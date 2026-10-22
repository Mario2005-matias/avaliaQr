<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_login_returns_user_and_cookie(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@exemplo.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'active' => true,
        ]);

        $res = $this->postJson('/api/login', [
            'email' => 'admin@exemplo.com',
            'password' => 'password',
        ]);

        $res->assertOk()
            ->assertJsonPath('user.email', 'admin@exemplo.com')
            ->assertJsonPath('user.role', 'admin');

        $this->assertAuthenticatedAs($user);
    }

    public function test_invalid_login_returns_generic_422(): void
    {
        User::factory()->create([
            'email' => 'admin@exemplo.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'active' => true,
        ]);

        $this->postJson('/api/login', [
            'email' => 'admin@exemplo.com',
            'password' => 'errada',
        ])->assertStatus(422)
          ->assertJsonPath('errors.email.0', 'Credenciais inválidas.');
    }

    public function test_inactive_account_cannot_log_in(): void
    {
        User::factory()->create([
            'email' => 'inativo@exemplo.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'active' => false,
        ]);

        $this->postJson('/api/login', [
            'email' => 'inativo@exemplo.com',
            'password' => 'password',
        ])->assertStatus(422);
    }

    public function test_me_without_session_returns_401(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
    }

    public function test_logout_invalidates_session(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'active' => true]);
        $this->actingAs($user);

        $this->postJson('/api/logout')->assertNoContent();
        $this->assertGuest();
    }
}
