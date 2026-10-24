<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Rating;
use App\Models\School;
use App\Models\ServiceSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_routes_return_401_without_authentication(): void
    {
        $this->getJson('/api/admin/technicians')->assertUnauthorized();
    }

    public function test_forbids_technicians_from_admin_routes(): void
    {
        $technician = User::factory()->technician()->create();

        $this->actingAs($technician)
            ->getJson('/api/admin/technicians')
            ->assertForbidden();
    }

    public function test_admin_creates_technician_with_required_photo(): void
    {
        Storage::fake('public');
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post('/api/admin/technicians', [
            'name' => 'Ana Técnica',
            'email' => 'ana@escola.ao',
            'password' => 'palavra-passe-segura',
            'photo' => UploadedFile::fake()->image('ana.png'),
        ], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('name', 'Ana Técnica')
            ->assertJsonPath('email', 'ana@escola.ao')
            ->assertJsonMissingPath('password');

        $technician = User::where('email', 'ana@escola.ao')->firstOrFail();
        $this->assertSame(Role::Technician, $technician->role);
        Storage::disk('public')->assertExists($technician->photo_path);
    }

    public function test_rejects_technician_creation_without_photo(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->postJson('/api/admin/technicians', [
                'name' => 'Ana Técnica',
                'email' => 'ana@escola.ao',
                'password' => 'palavra-passe-segura',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['photo']);
    }

    public function test_admin_creates_and_lists_schools(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->postJson('/api/admin/schools', ['name' => 'Escola Nova'])
            ->assertCreated()
            ->assertJsonPath('name', 'Escola Nova')
            ->assertJsonPath('active', true);

        $this->getJson('/api/admin/schools')
            ->assertOk()
            ->assertJsonPath('0.name', 'Escola Nova');
    }

    public function test_admin_invalidates_and_revalidates_rating(): void
    {
        $admin = User::factory()->admin()->create();
        $technician = User::factory()->technician()->create();
        $school = School::create(['name' => 'Escola Central', 'active' => true]);
        $session = ServiceSession::create([
            'technician_id' => $technician->id,
            'school_id' => $school->id,
            'token_hash' => str_repeat('a', 64),
            'expires_at' => now()->addDay(),
        ]);
        $rating = Rating::create([
            'service_session_id' => $session->id,
            'stars' => 4,
            'comment' => 'Bom serviço',
            'device_hash' => str_repeat('b', 64),
            'ip_hash' => str_repeat('c', 64),
        ]);

        $this->actingAs($admin)
            ->patchJson("/api/admin/ratings/{$rating->id}/invalidate", ['reason' => 'Avaliação duplicada'])
            ->assertOk()
            ->assertJsonPath('status', 'invalidated');

        $this->assertDatabaseHas('ratings', [
            'id' => $rating->id,
            'invalidated_by' => $admin->id,
            'invalidation_reason' => 'Avaliação duplicada',
        ]);

        $this->patchJson("/api/admin/ratings/{$rating->id}/revalidate")
            ->assertOk()
            ->assertJsonPath('status', 'revalidated');

        $this->assertDatabaseHas('ratings', [
            'id' => $rating->id,
            'invalidated_at' => null,
            'invalidated_by' => null,
            'invalidation_reason' => null,
        ]);
    }

    public function test_admin_rating_list_includes_invalidated_ratings_and_omits_hashes(): void
    {
        $admin = User::factory()->admin()->create();
        $technician = User::factory()->technician()->create();
        $school = School::create(['name' => 'Escola Central', 'active' => true]);
        $session = ServiceSession::create([
            'technician_id' => $technician->id,
            'school_id' => $school->id,
            'token_hash' => str_repeat('d', 64),
            'expires_at' => now()->addDay(),
        ]);
        Rating::create([
            'service_session_id' => $session->id,
            'stars' => 3,
            'comment' => 'Comentário administrativo',
            'device_hash' => str_repeat('e', 64),
            'ip_hash' => str_repeat('f', 64),
            'invalidated_at' => now(),
            'invalidated_by' => $admin->id,
            'invalidation_reason' => 'Revisão',
        ]);

        $this->actingAs($admin)
            ->getJson("/api/admin/ratings?technician_id={$technician->id}&school_id={$school->id}&month=".now('Africa/Luanda')->format('Y-m').'&search=Coment%C3%A1rio+administrativo')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.invalidated_by', $admin->name)
            ->assertJsonPath('data.0.invalidation_reason', 'Revisão')
            ->assertJsonMissingPath('data.0.device_hash')
            ->assertJsonMissingPath('data.0.ip_hash');
    }
}
