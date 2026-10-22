<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('service_sessions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('technician_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('school_id')
                ->constrained('schools')
                ->restrictOnDelete();

            $table->char('token_hash', 64)->unique();
            $table->dateTime('expires_at');
            $table->unsignedSmallInteger('max_ratings')->nullable()->default(30);
            $table->dateTime('revoked_at')->nullable();

            $table->timestamps();

            $table->index(
                ['technician_id', 'school_id', 'expires_at'],
                'idx_session_reuse'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_sessions');
    }
};
