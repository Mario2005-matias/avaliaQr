<?php

namespace Tests\Feature\Api;

use App\Enums\Role;
use App\Models\Rating;
use App\Models\School;
use App\Models\ServiceSession;
use App\Models\User;
use App\Services\ServiceSessionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class PublicRatingTest extends TestCase
{
    use RefreshDatabase;

    private string $plainToken;

    private ServiceSession $session;

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('app.hmac_key', 'test-secret-key');

        $technician = User::factory()->create([
            'name' => 'João Técnico',
            'email' => 'joao@teste.com',
            'role' => Role::Technician,
            'active' => true,
            'photo_path' => 'technicians/placeholder.jpg',
        ]);
        $school = School::create(['name' => 'Escola do Zango', 'active' => true]);

        $sessionService = app(ServiceSessionService::class);
        $result = $sessionService->createOrReuse($technician, $school);

        $this->session = $result['session'];
        $this->plainToken = $result['token'];
    }

    public function test_get_valid_session_returns_only_public_data()
    {
        $response = $this->getJson("/api/public/service-sessions/{$this->plainToken}");

        $response->assertOk()
            ->assertExactJson([
                'status' => 'valid',
                'technician' => [
                    'name' => 'João Técnico',
                    'photo_url' => asset('storage/technicians/placeholder.jpg'),
                ],
                'school' => [
                    'name' => 'Escola do Zango',
                ],
                'is_full' => false,
            ]);
    }

    public function test_get_invalid_token_returns_404()
    {
        $this->getJson('/api/public/service-sessions/token-invalido')
            ->assertStatus(404)
            ->assertJsonPath('error', 'TOKEN_INVALIDO');
    }

    public function test_post_rating_registers_successfully()
    {
        $response = $this->postJson("/api/public/service-sessions/{$this->plainToken}/ratings", [
            'stars' => 5,
            'comment' => 'Ótimo trabalho',
            'device_id' => 'device-test-123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('ratings', [
            'service_session_id' => $this->session->id,
            'stars' => 5,
            'comment' => 'Ótimo trabalho',
        ]);
    }

    public function test_post_duplicate_rating_returns_409()
    {
        // Primeiro envio
        $this->postJson("/api/public/service-sessions/{$this->plainToken}/ratings", [
            'stars' => 5, 'device_id' => 'device-test-123',
        ]);

        // Segundo envio com o mesmo aparelho
        $this->postJson("/api/public/service-sessions/{$this->plainToken}/ratings", [
            'stars' => 4, 'device_id' => 'device-test-123',
        ])->assertStatus(409)
            ->assertJsonPath('error', 'JA_AVALIASTE');
    }

    public function test_post_without_stars_returns_422()
    {
        $this->postJson("/api/public/service-sessions/{$this->plainToken}/ratings", [
            'device_id' => 'device-test-123',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['stars']);
    }

    public function test_technician_ratings_only_returns_own_valid_ratings()
    {
        $otherTechnician = User::factory()->create([
            'role' => Role::Technician,
            'active' => true,
        ]);
        $otherSchool = School::create(['name' => 'Outro Colégio', 'active' => true]);
        $otherSession = ServiceSession::create([
            'technician_id' => $otherTechnician->id,
            'school_id' => $otherSchool->id,
            'token_hash' => str_repeat('a', 64),
            'expires_at' => now()->addDay(),
        ]);

        Rating::create([
            'service_session_id' => $this->session->id,
            'stars' => 5,
            'comment' => 'Excelente',
            'device_hash' => str_repeat('b', 64),
            'ip_hash' => str_repeat('c', 64),
        ]);
        Rating::create([
            'service_session_id' => $this->session->id,
            'stars' => 1,
            'comment' => 'Inválida',
            'device_hash' => str_repeat('d', 64),
            'ip_hash' => str_repeat('e', 64),
            'invalidated_at' => now(),
            'invalidated_by' => $otherTechnician->id,
            'invalidation_reason' => 'Teste',
        ]);
        Rating::create([
            'service_session_id' => $otherSession->id,
            'stars' => 2,
            'comment' => 'Outro técnico',
            'device_hash' => str_repeat('f', 64),
            'ip_hash' => str_repeat('1', 64),
        ]);

        $this->actingAs(User::findOrFail($this->session->technician_id))
            ->getJson('/api/technician/ratings')
            ->assertOk()
            ->assertJsonPath('average_rating', 5)
            ->assertJsonPath('total', 1)
            ->assertJsonPath('ratings.0.stars', 5)
            ->assertJsonPath('ratings.0.comment', 'Excelente')
            ->assertJsonPath('ratings.0.school_name', 'Escola do Zango')
            ->assertJsonMissing(['comment' => 'Inválida'])
            ->assertJsonMissing(['comment' => 'Outro técnico']);
    }
}
