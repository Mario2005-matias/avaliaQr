<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{

     public function up(): void
    {
        Schema::create('ratings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('service_session_id')
                ->constrained('service_sessions')
                ->restrictOnDelete();

            $table->unsignedTinyInteger('stars');
            $table->string('comment', 1000)->nullable();

            $table->char('device_hash', 64);
            $table->char('ip_hash', 64);

            $table->dateTime('invalidated_at')->nullable();
            $table->foreignId('invalidated_by')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();
            $table->string('invalidation_reason', 255)->nullable();

            $table->timestamp('created_at')->useCurrent();

            $table->unique(['service_session_id', 'device_hash'], 'uq_session_device');
            $table->index(['ip_hash', 'created_at'], 'idx_ip_rate');
            $table->index('created_at', 'idx_report_month');
            $table->index(['service_session_id', 'invalidated_at'], 'idx_session_valid');
        });

        // CHECK constraint via SQL bruto (não suportado pelo Blueprint do Laravel).
        // MySQL 8.0.16+ aplica-o; versões anteriores ignoram-no em silêncio.
        // SQLite (usado em testes) não suporta ALTER TABLE ADD CONSTRAINT,
        // por isso só corremos em MySQL/MariaDB.
        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement(
                'ALTER TABLE ratings ADD CONSTRAINT chk_ratings_stars CHECK (stars BETWEEN 1 AND 5)'
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ratings');
    }
};
