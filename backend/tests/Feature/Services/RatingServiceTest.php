<?php

namespace Tests\Feature\Services;

use App\Enums\Role;
use App\Models\Rating;
use App\Models\School;
use App\Models\ServiceSession;
use App\Models\User;
use App\Services\RatingService;
use App\Services\ServiceSessionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class RatingServiceTest extends TestCase
{
    use RefreshDatabase;

    private RatingService $service;
    private ServiceSession $session;

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('app.hmac_key', 'test-secret-key');
        $this->service = app(RatingService::class);

        // Cria um cenário base
        $technician = User::factory()->create(['role' => Role::Technician, 'active' => true]);
        $school = School::create(['name' => 'Escola Teste', 'active' => true]);
        $sessionService = app(ServiceSessionService::class);

        $result = $sessionService->createOrReuse($technician, $school);
        $this->session = $result['session'];
    }

    protected function tearDown(): void
    {
        RateLimiter::clear('rating-ip:127.0.0.1');
        RateLimiter::clear('rating-session:' . $this->session->id);
        parent::tearDown();
    }

    public function test_can_register_rating()
    {
        $rating = $this->service->register(
            $this->session, 5, 'Excelente atendimento', 'device-123', '127.0.0.1'
        );

        $this->assertDatabaseHas('ratings', [
            'id' => $rating->id,
            'stars' => 5,
            'comment' => 'Excelente atendimento',
        ]);
    }

    public function test_cannot_rate_twice_with_same_device()
    {
        $this->service->register($this->session, 5, null, 'device-123', '127.0.0.1');

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('JA_AVALIASTE');

        $this->service->register($this->session, 4, null, 'device-123', '127.0.0.1');
    }

    public function test_respects_max_ratings_limit()
    {
        // Altera o limite da sessão para 2
        $this->session->update(['max_ratings' => 2]);

        $this->service->register($this->session, 5, null, 'device-1', '127.0.0.1');
        $this->service->register($this->session, 4, null, 'device-2', '127.0.0.1');

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('LIMITE_ATINGIDO');

        $this->service->register($this->session, 3, null, 'device-3', '127.0.0.1');
    }

    public function test_invalidated_rating_frees_up_a_slot()
    {
        $this->session->update(['max_ratings' => 2]);
        $admin = User::factory()->create(['role' => Role::Admin]);

        $rating1 = $this->service->register($this->session, 5, null, 'device-1', '127.0.0.1');
        $this->service->register($this->session, 4, null, 'device-2', '127.0.0.1');

        // Invalida a primeira avaliação
        $this->service->invalidate($rating1, $admin, 'Teste');

        // Agora deve permitir uma nova avaliação
        $rating3 = $this->service->register($this->session, 3, null, 'device-3', '127.0.0.1');
        $this->assertNotNull($rating3->id);
    }

    public function test_can_invalidate_and_revalidate_rating()
    {
        $admin = User::factory()->create(['role' => Role::Admin]);
        $rating = $this->service->register($this->session, 5, null, 'device-1', '127.0.0.1');

        $this->service->invalidate($rating, $admin, 'Ofensivo');
        $this->assertNotNull($rating->fresh()->invalidated_at);

        $this->service->revalidate($rating);
        $this->assertNull($rating->fresh()->invalidated_at);
    }

    public function test_rate_limit_blocks_too_many_requests()
    {
        // Limite de 5 por sessão. Fazemos 5.
        for ($i = 1; $i <= 5; $i++) {
            $this->service->register($this->session, 5, null, 'device-' . $i, '127.0.0.1');
        }

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('RATE_LIMIT');

        $this->service->register($this->session, 5, null, 'device-6', '127.0.0.1');
    }
}
