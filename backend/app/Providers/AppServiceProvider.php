<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if (app()->environment('production') && empty(env('APP_HMAC_KEY'))) {
            throw new RuntimeException(
                'APP_HMAC_KEY não está definida. Recusa arrancar em produção sem ela.'
            );
        }
    }
}
