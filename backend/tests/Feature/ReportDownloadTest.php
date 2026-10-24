<?php

namespace Tests\Feature;

use App\Models\Rating;
use App\Models\School;
use App\Models\ServiceSession;
use App\Models\User;
use App\Services\ReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportDownloadTest extends TestCase
{
    use RefreshDatabase;

    public function test_monthly_report_uses_luanda_month_bounds_and_excludes_invalidated_ratings(): void
    {
        $technician = User::factory()->technician()->create(['name' => 'Técnico Teste']);
        $school = School::create(['name' => 'Escola Central', 'active' => true]);
        $session = ServiceSession::create([
            'technician_id' => $technician->id,
            'school_id' => $school->id,
            'token_hash' => str_repeat('a', 64),
            'expires_at' => now()->addDay(),
        ]);

        $this->createRating($session, 2, '2025-12-31 22:59:59');
        $this->createRating($session, 5, '2025-12-31 23:00:00');
        $this->createRating($session, 3, '2026-01-31 22:59:59');
        $this->createRating($session, 1, '2026-01-31 23:00:00');
        $this->createRating($session, 1, '2026-01-15 12:00:00', true);

        $report = app(ReportService::class)->generateMonthlyReport('2026-01');

        $this->assertSame(2, $report['total_ratings']);
        $this->assertSame(4.0, $report['average_rating']);
        $this->assertSame('Escola Central', $report['schools']->first()->school_name);
        $this->assertSame(2, (int) $report['schools']->first()->ratings_count);
        $this->assertSame('Técnico Teste', $report['technicians']->first()->technician_name);
    }

    public function test_admin_can_download_monthly_and_technician_pdf_reports(): void
    {
        $admin = User::factory()->admin()->create();
        $technician = User::factory()->technician()->create(['name' => 'Técnico Teste']);
        $this->actingAs($admin);

        $monthlyResponse = $this->get('/api/admin/reports/monthly/2026-01');
        $monthlyResponse->assertOk();
        $this->assertStringStartsWith('%PDF', $monthlyResponse->getContent());

        $technicianResponse = $this->get("/api/admin/reports/technician/{$technician->id}/2026-01");
        $technicianResponse->assertOk();
        $this->assertStringStartsWith('%PDF', $technicianResponse->getContent());
    }

    public function test_technician_report_contains_only_the_requested_technicians_valid_ratings(): void
    {
        $technician = User::factory()->technician()->create(['name' => 'Técnico Alvo']);
        $otherTechnician = User::factory()->technician()->create(['name' => 'Outro Técnico']);
        $school = School::create(['name' => 'Escola Central', 'active' => true]);
        $session = ServiceSession::create([
            'technician_id' => $technician->id,
            'school_id' => $school->id,
            'token_hash' => str_repeat('a', 64),
            'expires_at' => now()->addDay(),
        ]);
        $otherSession = ServiceSession::create([
            'technician_id' => $otherTechnician->id,
            'school_id' => $school->id,
            'token_hash' => str_repeat('b', 64),
            'expires_at' => now()->addDay(),
        ]);

        $this->createRating($session, 5, '2026-01-10 12:00:00');
        $this->createRating($session, 1, '2026-01-11 12:00:00', true);
        $this->createRating($otherSession, 2, '2026-01-12 12:00:00');

        $report = app(ReportService::class)->generateTechnicianReport($technician->id, '2026-01');

        $this->assertSame('Técnico Alvo', $report['technician']->name);
        $this->assertSame(1, $report['total_ratings']);
        $this->assertSame(5.0, $report['average_rating']);
        $this->assertSame('Escola Central', $report['ratings']->first()->serviceSession->school->name);
    }

    public function test_rejects_invalid_month_in_report_url(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->getJson('/api/admin/reports/monthly/2026-13')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['month']);
    }

    public function test_technician_report_escapes_comment_content(): void
    {
        $technician = User::factory()->technician()->create();
        $school = School::create(['name' => 'Escola Central', 'active' => true]);
        $session = ServiceSession::create([
            'technician_id' => $technician->id,
            'school_id' => $school->id,
            'token_hash' => str_repeat('a', 64),
            'expires_at' => now()->addDay(),
        ]);
        $rating = $this->createRating($session, 5, '2026-01-15 12:00:00');
        $rating->update(['comment' => '<script>alert("xss")</script>']);
        $session->setRelation('school', $school);
        $rating->setRelation('serviceSession', $session);

        $html = view('reports.technician', [
            'month' => '2026-01',
            'technician' => $technician,
            'total_ratings' => 1,
            'average_rating' => 5.0,
            'ratings' => collect([$rating]),
        ])->render();

        $this->assertStringContainsString('&lt;script&gt;', $html);
        $this->assertStringNotContainsString('<script>alert("xss")</script>', $html);
    }

    private function createRating(ServiceSession $session, int $stars, string $createdAt, bool $invalidated = false): Rating
    {
        static $counter = 0;
        $counter++;

        $rating = Rating::create([
            'service_session_id' => $session->id,
            'stars' => $stars,
            'comment' => null,
            'device_hash' => str_pad((string) $counter, 64, '0', STR_PAD_LEFT),
            'ip_hash' => str_pad((string) $counter, 64, '1', STR_PAD_LEFT),
            'invalidated_at' => $invalidated ? now() : null,
        ]);
        $rating->forceFill(['created_at' => $createdAt])->save();

        return $rating;
    }
}
