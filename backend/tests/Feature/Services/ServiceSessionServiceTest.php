<?php

namespace Tests\Feature\Services;

use App\Enums\Role;
use App\Models\School;
use App\Models\ServiceSession;
use App\Models\User;
use App\Services\ServiceSessionService as ServiceServiceSessionService;
use App\Services\ServiceSessionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class ServiceSessionServiceTest extends TestCase
{
    use RefreshDatabase;

    private ServiceServiceSessionService $service;
    private User $technician;
    private School $school;

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('app.hmac_key', 'test-secret-key');

        $this->service = app(ServiceServiceSessionService::class);

        $this->technician = User::factory()->create(['role' => Role::Technician, 'active' => true]);
        $this->school = School::create(['name' => 'Escola Teste', 'active' => true]);
    }

    public function test_can_create_new_session_and_generate_token()
    {
        $result = $this->service->createOrReuse($this->technician, $this->school);

        $this->assertArrayHasKey('token', $result);
        $this->assertArrayHasKey('session', $result);
        $this->assertDatabaseHas('service_sessions', [
            'technician_id' => $this->technician->id,
            'school_id' => $this->school->id,
            'revoked_at' => null,
        ]);
    }

    public function test_can_reuse_session_and_generate_new_token()
    {
        // Primeira chamada
        $first = $this->service->createOrReuse($this->technician, $this->school);
        // Segunda chamada (deve reaproveitar)
        $second = $this->service->createOrReuse($this->technician, $this->school);

        $this->assertEquals($first['session']->id, $second['session']->id);
        $this->assertNotEquals($first['token'], $second['token']); // Token deve ser diferente
        $this->assertSame(1, ServiceSession::count()); // Só existe uma sessão na BD
    }

    public function test_throws_exception_if_school_is_inactive()
    {
        $inactiveSchool = School::create(['name' => 'Inativa', 'active' => false]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('O colégio não está ativo.');

        $this->service->createOrReuse($this->technician, $inactiveSchool);
    }

    public function test_can_validate_valid_token()
    {
        $result = $this->service->createOrReuse($this->technician, $this->school);

        $session = $this->service->validateToken($result['token']);

        $this->assertEquals($result['session']->id, $session->id);
    }

    public function test_throws_exception_for_invalid_token()
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('TOKEN_INVALIDO');

        $this->service->validateToken('token-invalido-que-nao-existe');
    }

    public function test_throws_exception_for_expired_session()
    {
        $result = $this->service->createOrReuse($this->technician, $this->school);

        // Força a expiração no passado
        $result['session']->update(['expires_at' => now('UTC')->subDay()]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('SESSAO_EXPIRADA');

        $this->service->validateToken($result['token']);
    }

    public function test_throws_exception_for_revoked_session()
    {
        $result = $this->service->createOrReuse($this->technician, $this->school);

        $this->service->revoke($result['session']);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('SESSAO_REVOGADA');

        $this->service->validateToken($result['token']);
    }
}
