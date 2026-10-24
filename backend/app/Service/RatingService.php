<?php

namespace App\Services;

use App\Models\Rating;
use App\Models\ServiceSession;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use InvalidArgumentException;

class RatingService
{
    public function __construct(
        private HashService $hashService
    ) {}

    /**
     * Regista uma nova avaliação.
     */
    public function register(
        ServiceSession $session,
        int $stars,
        ?string $comment,
        string $deviceId,
        string $ip
    ): Rating {
        // 1. Validação básica dos campos
        if ($stars < 1 || $stars > 5) {
            throw new InvalidArgumentException('ESTRELAS_INVALIDAS');
        }

        $comment = $comment ? trim($comment) : null;
        if ($comment && mb_strlen($comment) > 1000) {
            throw new InvalidArgumentException('COMENTARIO_LONGO');
        }

        // 2. Aplica o rate limit (composto: IP + Sessão)
        $this->ensureIsNotRateLimited($session->id, $ip);

        $hashes = $this->hashService->hashDeviceAndIp($deviceId, $ip);

        return DB::transaction(function () use ($session, $stars, $comment, $hashes, $ip) {
            // 3. Duplicidade: o mesmo dispositivo não pode avaliar a mesma sessão
            $exists = Rating::where('service_session_id', $session->id)
                ->where('device_hash', $hashes['device_hash'])
                ->exists();

            if ($exists) {
                throw new InvalidArgumentException('JA_AVALIASTE');
            }

            // 4. Limite máximo de avaliações por sessão (contando apenas as válidas)
            if ($session->max_ratings !== null) {
                $validCount = Rating::where('service_session_id', $session->id)
                    ->whereNull('invalidated_at')
                    ->count();

                if ($validCount >= $session->max_ratings) {
                    throw new InvalidArgumentException('LIMITE_ATINGIDO');
                }
            }

            // 5. Cria a avaliação (a transação e o UNIQUE no banco protegem contra corrida)
            return Rating::create([
                'service_session_id' => $session->id,
                'stars' => $stars,
                'comment' => $comment,
                'device_hash' => $hashes['device_hash'],
                'ip_hash' => $hashes['ip_hash'],
            ]);
        });
    }

    /**
     * Invalida uma avaliação (ação do administrador).
     */
    public function invalidate(Rating $rating, User $admin, string $reason): void
    {
        if ($rating->invalidated_at !== null) {
            throw new InvalidArgumentException('JA_INVALIDADA');
        }

        if (mb_strlen($reason) > 255) {
            throw new InvalidArgumentException('MOTIVO_LONGO');
        }

        $rating->update([
            'invalidated_at' => now('UTC'),
            'invalidated_by' => $admin->id,
            'invalidation_reason' => $reason,
        ]);
    }

    /**
     * Revalida uma avaliação (desfaz a invalidação).
     */
    public function revalidate(Rating $rating): void
    {
        if ($rating->invalidated_at === null) {
            throw new InvalidArgumentException('JA_VALIDA');
        }

        $rating->update([
            'invalidated_at' => null,
            'invalidated_by' => null,
            'invalidation_reason' => null,
        ]);
    }

    /**
     * Rate limit composto (por sessão e por IP).
     */
    private function ensureIsNotRateLimited(int $sessionId, string $ip): void
    {
        $ipKey = 'rating-ip:' . $ip;
        $sessionKey = 'rating-session:' . $sessionId;

        // Limite de 10 avaliações por minuto por IP
        if (RateLimiter::tooManyAttempts($ipKey, 10)) {
            throw new InvalidArgumentException('RATE_LIMIT');
        }

        // Limite de 5 avaliações por minuto por sessão (QR específico)
        if (RateLimiter::tooManyAttempts($sessionKey, 5)) {
            throw new InvalidArgumentException('RATE_LIMIT');
        }

        // Regista a tentativa
        RateLimiter::hit($ipKey, 60);
        RateLimiter::hit($sessionKey, 60);
    }
}
