<?php

use App\Http\Controllers\Api\Admin\AdminController;
use App\Http\Controllers\Api\Admin\ReportController;
use App\Http\Controllers\Api\Public\PublicRatingController;
use App\Http\Controllers\Api\Technician\TechnicianSessionController;
use App\Models\User;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(base_path('routes/auth.php'));

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
    Route::get('/ratings', [TechnicianSessionController::class, 'ratings']);
    Route::post('/sessions', [TechnicianSessionController::class, 'store']);
    Route::delete('/sessions/{session}', [TechnicianSessionController::class, 'destroy']);
});

Route::middleware(['auth:sanctum', 'can:accessAdmin,'.User::class])
    ->prefix('admin')
    ->group(function () {
        Route::get('/ratings', [AdminController::class, 'ratings']);
        Route::patch('/ratings/{rating}/invalidate', [AdminController::class, 'invalidateRating']);
        Route::patch('/ratings/{rating}/revalidate', [AdminController::class, 'revalidateRating']);
        Route::get('/technicians', [AdminController::class, 'technicians']);
        Route::post('/technicians', [AdminController::class, 'storeTechnician']);
        Route::get('/schools', [AdminController::class, 'schools']);
        Route::post('/schools', [AdminController::class, 'storeSchool']);
        Route::get('/reports/monthly/{month}', [ReportController::class, 'monthly'])
            ->where('month', '\d{4}-\d{2}');
        Route::get('/reports/technician/{id}/{month}', [ReportController::class, 'technician'])
            ->whereNumber('id')
            ->where('month', '\d{4}-\d{2}');
    });
