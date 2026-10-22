<?php

namespace Tests\Unit\Models;

use App\Models\School;
use App\Models\ServiceSession;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ServiceSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_unique_token_hash_rejects_duplicates(): void
    {
        $technician = User::factory()->create(['role' => 'technician']);
        $school = School::create(['name' => 'Zango', 'active' => true]);
        $hash = hash('sha256', 'mesmo-token');

        ServiceSession::create([
            'technician_id' => $technician->id, 'school_id' => $school->id,
            'token_hash' => $hash, 'expires_at' => now()->addDay(),
        ]);

        $this->expectException(QueryException::class);
        ServiceSession::create([
            'technician_id' => $technician->id, 'school_id' => $school->id,
            'token_hash' => $hash, 'expires_at' => now()->addDay(),
        ]);
    }

    public function test_restrict_prevents_deleting_technician_with_service_sessions(): void
    {
        $technician = User::factory()->create(['role' => 'technician']);
        $school = School::create(['name' => 'Zango', 'active' => true]);
        ServiceSession::create([
            'technician_id' => $technician->id, 'school_id' => $school->id,
            'token_hash' => hash('sha256', Str::random(40)),
            'expires_at' => now()->addDay(),
        ]);

        $this->expectException(QueryException::class);
        $technician->delete();
    }

    public function test_max_ratings_accepts_null_and_defaults_to_30(): void
    {
        $technician = User::factory()->create(['role' => 'technician']);
        $school = School::create(['name' => 'Zango', 'active' => true]);

        $unlimited = ServiceSession::create([
            'technician_id' => $technician->id, 'school_id' => $school->id,
            'token_hash' => hash('sha256', Str::random(40)),
            'expires_at' => now()->addDay(),
            'max_ratings' => null,
        ]);
        $this->assertNull($unlimited->max_ratings);

        $withDefault = ServiceSession::create([
            'technician_id' => $technician->id, 'school_id' => $school->id,
            'token_hash' => hash('sha256', Str::random(40)),
            'expires_at' => now()->addDay(),
        ])->refresh();
        $this->assertSame(30, $withDefault->max_ratings);
    }
}
