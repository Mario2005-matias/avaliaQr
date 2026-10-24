<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Technician\TechnicianSessionController;
use App\Http\Controllers\Api\Public\PublicRatingController;

Route::middleware('web')->group(base_path('routes/auth.php'));   // cookie mode exige 'web'

// Rotas Públicas (Avaliador)
// Throttle: 20 pedidos por minuto por IP (podes ajustar)
Route::middleware('throttle:20,1')->prefix('public')->group(function () {
    Route::get('/service-sessions/{token}', [PublicRatingController::class, 'show']);
    Route::post('/service-sessions/{token}/ratings', [PublicRatingController::class, 'store']);
});

// Rotas do Técnico (Requerem autenticação via Sanctum)
Route::middleware('auth:sanctum')->prefix('technician')->group(function () {
    Route::get('/schools', [TechnicianSessionController::class, 'schools']);
    Route::get('/sessions/today', [TechnicianSessionController::class, 'today']);
    Route::post('/sessions', [TechnicianSessionController::class, 'store']);
    Route::delete('/sessions/{session}', [TechnicianSessionController::class, 'destroy']);
});


