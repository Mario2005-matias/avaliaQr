<?php

namespace Tests\Feature\Api;

use App\Enums\Role;
use App\Models\School;
use App\Models\ServiceSession;
use App\Models\User;
use App\Services\ServiceSessionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\RateLimiter;
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
            'photo_path' => 'technicians/placeholder.jpg'
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
            ->assertJsonPath('status', 'valid')
            ->assertJsonPath('technician.name', 'João Técnico')
            ->assertJsonPath('school.name', 'Escola do Zango')
            ->assertJsonMissingPath('technician.email') // Não vaza e-mail
            ->assertJsonMissingPath('technician.id');    // Não vaza IDs
    }

    public function test_get_invalid_token_returns_404()
    {
        $this->getJson("/api/public/service-sessions/token-invalido")
            ->assertStatus(404)
            ->assertJsonPath('error', 'TOKEN_INVALIDO');
    }

    public function test_post_rating_registers_successfully()
    {
        $response = $this->postJson("/api/public/service-sessions/{$this->plainToken}/ratings", [
            'stars' => 5,
            'comment' => 'Ótimo trabalho',
            'device_id' => 'device-test-123'
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('ratings', [
            'service_session_id' => $this->session->id,
            'stars' => 5,
            'comment' => 'Ótimo trabalho'
        ]);
    }

    public function test_post_duplicate_rating_returns_409()
    {
        // Primeiro envio
        $this->postJson("/api/public/service-sessions/{$this->plainToken}/ratings", [
            'stars' => 5, 'device_id' => 'device-test-123'
        ]);

        // Segundo envio com o mesmo aparelho
        $this->postJson("/api/public/service-sessions/{$this->plainToken}/ratings", [
            'stars' => 4, 'device_id' => 'device-test-123'
        ])->assertStatus(409)
          ->assertJsonPath('error', 'JA_AVALIASTE');
    }

    public function test_post_without_stars_returns_422()
    {
        $this->postJson("/api/public/service-sessions/{$this->plainToken}/ratings", [
            'device_id' => 'device-test-123'
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['stars']);
    }
}
