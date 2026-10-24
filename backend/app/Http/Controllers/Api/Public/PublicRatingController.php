<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\StoreRatingRequest;
use App\Services\RatingService;
use App\Services\ServiceSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Throwable;

class PublicRatingController extends Controller
{
    public function __construct(
        private ServiceSessionService $sessionService,
        private RatingService $ratingService
    ) {}

    /**
     * GET /api/public/service-sessions/{token}
     * Valida o QR e devolve os dados públicos do técnico e colégio.
     */
    public function show(string $token): JsonResponse
    {
        try {
            $session = $this->sessionService->validateToken($token);

            // Conta as avaliações válidas atuais para mostrar no frontend (opcional)
            $validRatingsCount = $session->validRatings()->count();
            $isFull = $session->max_ratings !== null && $validRatingsCount >= $session->max_ratings;

            return response()->json([
                'status' => 'valid',
                'technician' => [
                    'name' => $session->technician->name,
                    // Usa o accessor ou gera o URL do storage para a foto
                    'photo_url' => $session->technician->photo_path
                        ? asset('storage/' . $session->technician->photo_path)
                        : null,
                ],
                'school' => [
                    'name' => $session->school->name,
                ],
                'is_full' => $isFull, // Útil para o frontend bloquear o botão antes do envio
            ]);
        } catch (InvalidArgumentException $e) {
            return $this->handleServiceException($e);
        }
    }

    /**
     * POST /api/public/service-sessions/{token}/ratings
     * Regista uma avaliação.
     */
    public function store(StoreRatingRequest $request, string $token): JsonResponse
    {
        try {
            $session = $this->sessionService->validateToken($token);

            $rating = $this->ratingService->register(
                $session,
                $request->integer('stars'),
                $request->input('comment'),
                $request->input('device_id'),
                $request->ip() // IP real do avaliador
            );

            return response()->json([
                'status' => 'success',
                'rating_id' => $rating->id,
            ], 201);

        } catch (InvalidArgumentException $e) {
            return $this->handleServiceException($e);
        }
    }

    /**
     * Traduz as exceções de negócio do Service para respostas HTTP.
     */
    private function handleServiceException(InvalidArgumentException $e): JsonResponse
    {
        $code = $e->getMessage();

        // Mapeamento de erros de negócio para códigos HTTP
        $status = match ($code) {
            'TOKEN_INVALIDO' => 404,
            'SESSAO_EXPIRADA', 'SESSAO_REVOGADA', 'TECNICO_INATIVO' => 410, // Gone
            'JA_AVALIASTE' => 409, // Conflict
            'LIMITE_ATINGIDO' => 422, // Unprocessable Entity
            'RATE_LIMIT' => 429, // Too Many Requests
            'ESTRELAS_INVALIDAS', 'COMENTARIO_LONGO' => 422,
            default => 400,
        };

        return response()->json([
            'error' => $code,
            'message' => $this->getFriendlyMessage($code),
        ], $status);
    }

    private function getFriendlyMessage(string $code): string
    {
        return match ($code) {
            'TOKEN_INVALIDO' => 'QR code inválido.',
            'SESSAO_EXPIRADA' => 'Este QR code já expirou.',
            'SESSAO_REVOGADA' => 'Este atendimento foi encerrado.',
            'TECNICO_INATIVO' => 'O técnico não está disponível.',
            'JA_AVALIASTE' => 'Já avaliaste este atendimento.',
            'LIMITE_ATINGIDO' => 'Este atendimento já recebeu o número máximo de avaliações.',
            'RATE_LIMIT' => 'Demasiadas tentativas. Tenta novamente daqui a pouco.',
            default => 'Ocorreu um erro ao processar a avaliação.',
        };
    }
}
