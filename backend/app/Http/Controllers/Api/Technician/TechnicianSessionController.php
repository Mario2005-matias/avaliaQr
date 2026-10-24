<?php

namespace App\Http\Controllers\Api\Technician;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\ServiceSession;
use App\Services\ServiceSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class TechnicianSessionController extends Controller
{
    public function __construct(
        private ServiceSessionService $sessionService
    ) {}

    /**
     * Lista as sessões de hoje do técnico autenticado.
     */
    public function today(Request $request): JsonResponse
    {
        // Procura sessões criadas hoje (fuso de Luanda) para este técnico
        $sessions = ServiceSession::with('school')
            ->where('technician_id', $request->user()->id)
            ->whereDate('created_at', now('Africa/Luanda')->toDateString())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($session) {
                return [
                    'id' => $session->id,
                    'school_name' => $session->school->name,
                    'created_at' => $session->created_at->setTimezone('Africa/Luanda')->format('H:i'),
                    'expires_at' => $session->expires_at->setTimezone('Africa/Luanda')->format('H:i'),
                    'revoked_at' => $session->revoked_at,
                    'ratings_count' => $session->validRatings()->count(),
                    'average_rating' => round($session->validRatings()->avg('stars') ?? 0, 1),
                ];
            });

        return response()->json($sessions);
    }

    /**
     * Cria ou reaproveita uma sessão para hoje.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'school_id' => ['required', 'exists:schools,id']
        ]);

        try {
            $school = School::findOrFail($request->school_id);

            $result = $this->sessionService->createOrReuse($request->user(), $school);

            return response()->json([
                'session_id' => $result['session']->id,
                'token' => $result['token'], // O token em claro para o frontend gerar o QR
                'school_name' => $school->name,
                'expires_at' => $result['session']->expires_at->toIso8601String(),
                'reused' => $result['session']->wasRecentlyCreated === false,
            ]);

        } catch (InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Revoga (encerra) uma sessão.
     */
    public function destroy(Request $request, ServiceSession $session): JsonResponse
    {
        // Policy simples: só o dono pode revogar
        if ($session->technician_id !== $request->user()->id) {
            return response()->json(['error' => 'UNAUTHORIZED'], 403);
        }

        if ($session->revoked_at === null) {
            $this->sessionService->revoke($session);
        }

        return response()->json(['status' => 'revoked']);
    }

    /**
     * Lista os colégios ativos para o dropdown.
     */
    public function schools(): JsonResponse
    {
        $schools = School::where('active', true)->orderBy('name')->get(['id', 'name']);
        return response()->json($schools);
    }
}
