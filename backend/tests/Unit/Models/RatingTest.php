<?php

namespace Tests\Unit\Models;

use App\Models\Rating;
use App\Models\School;
use App\Models\ServiceSession;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class RatingTest extends TestCase
{
    use RefreshDatabase;

    private function makeServiceSession(): ServiceSession
    {
        $technician = User::factory()->create(['role' => 'technician']);
        $school = School::create(['name' => 'Zango', 'active' => true]);
        return ServiceSession::create([
            'technician_id' => $technician->id,
            'school_id' => $school->id,
            'token_hash' => hash('sha256', Str::random(40)),
            'expires_at' => now()->addDay(),
            'max_ratings' => 30,
        ]);
    }

    public function test_check_rejects_zero_and_six_stars(): void
    {
        foreach ([0, 6] as $stars) {
            $this->expectException(QueryException::class);
            Rating::create([
                'service_session_id' => $this->makeServiceSession()->id,
                'stars' => $stars,
                'device_hash' => hash('sha256', 'd'.Str::random(10)),
                'ip_hash' => hash('sha256', 'i'.Str::random(10)),
            ]);
        }
    }

    public function test_unique_service_session_device_rejects_duplicates(): void
    {
        $serviceSession = $this->makeServiceSession();
        $device = hash('sha256', 'dispositivo-1');

        Rating::create([
            'service_session_id' => $serviceSession->id, 'stars' => 5,
            'device_hash' => $device, 'ip_hash' => hash('sha256', 'ip-1'),
        ]);

        $this->expectException(QueryException::class);
        Rating::create([
            'service_session_id' => $serviceSession->id, 'stars' => 4,
            'device_hash' => $device, 'ip_hash' => hash('sha256', 'ip-2'),
        ]);
    }

    public function test_comment_longer_than_1000_characters_is_rejected(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            $this->markTestSkipped('SQLite does not enforce VARCHAR length.');
        }

        $this->expectException(QueryException::class);
        Rating::create([
            'service_session_id' => $this->makeServiceSession()->id,
            'stars' => 5,
            'comment' => str_repeat('a', 1001),
            'device_hash' => hash('sha256', Str::random(20)),
            'ip_hash' => hash('sha256', Str::random(20)),
        ]);
    }
}
