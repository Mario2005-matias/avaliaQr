<?php

namespace App\Services;

use App\Models\School;
use App\Models\ServiceSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ServiceSessionService
{
    public function __construct(
        private HashService $hashService
    ) {}

    /**
     * Cria ou reaproveita a sessão do dia para o técnico e colégio.
     * Retorna a sessão e o token em claro (para o QR).
     */
    public function createOrReuse(User $technician, School $school): array
    {
        if (! $technician->active || ! $technician->isTechnician()) {
            throw new InvalidArgumentException('O técnico não está ativo ou não tem o role correto.');
        }

        if (! $school->active) {
            throw new InvalidArgumentException('O colégio não está ativo.');
        }

        // Define o fim do dia em Luanda + margem (02:00 do dia seguinte)
        $nowLuanda = now('Africa/Luanda');
        $expiresAt = $nowLuanda->copy()->endOfDay()->addHours(2)->setTimezone('UTC');

        return DB::transaction(function () use ($technician, $school, $expiresAt) {
            // Procura sessão ativa hoje para este técnico/colégio
            $session = ServiceSession::where('technician_id', $technician->id)
                ->where('school_id', $school->id)
                ->where('expires_at', '>', now('UTC'))
                ->whereNull('revoked_at')
                ->lockForUpdate()
                ->first();

            $token = $this->hashService->generateToken();

            if ($session) {
                // Reaproveita a sessão, mas gera um novo token (invalida o antigo)
                $session->update([
                    'token_hash' => $token['hash'],
                ]);
            } else {
                // Cria uma nova sessão
                $session = ServiceSession::create([
                    'technician_id' => $technician->id,
                    'school_id' => $school->id,
                    'token_hash' => $token['hash'],
                    'expires_at' => $expiresAt,
                    'max_ratings' => 30, // default da v2
                ]);
            }

            return [
                'session' => $session,
                'token' => $token['plain'],
            ];
        });
    }

    /**
     * Valida o token e devolve a sessão, ou lança erro se inválido.
     */
    public function validateToken(string $plainToken): ServiceSession
    {
        $hash = $this->hashService->hash($plainToken);
        $session = ServiceSession::where('token_hash', $hash)->first();

        if (! $session) {
            throw new InvalidArgumentException('TOKEN_INVALIDO');
        }

        if ($session->revoked_at !== null) {
            throw new InvalidArgumentException('SESSAO_REVOGADA');
        }

        if ($session->expires_at->isPast()) {
            throw new InvalidArgumentException('SESSAO_EXPIRADA');
        }

        if (! $session->technician->active) {
            throw new InvalidArgumentException('TECNICO_INATIVO');
        }

        return $session;
    }

    /**
     * Revoga uma sessão.
     */
    public function revoke(ServiceSession $session): void
    {
        $session->update(['revoked_at' => now('UTC')]);
    }
}
