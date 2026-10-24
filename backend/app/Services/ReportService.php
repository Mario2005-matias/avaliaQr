<?php

namespace App\Services;

use App\Models\Rating;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ReportService
{
    /**
     * @return array{
     *     month: string,
     *     total_ratings: int,
     *     average_rating: float,
     *     technicians: Collection,
     *     schools: Collection
     * }
     */
    public function generateMonthlyReport(string $month): array
    {
        [$start, $end] = $this->monthRange($month);
        $ratings = $this->ratingsForPeriod($start, $end);

        $technicians = (clone $ratings)
            ->join('service_sessions', 'service_sessions.id', '=', 'ratings.service_session_id')
            ->join('users', 'users.id', '=', 'service_sessions.technician_id')
            ->selectRaw('users.id as technician_id, users.name as technician_name')
            ->selectRaw('COUNT(ratings.id) as ratings_count, ROUND(AVG(ratings.stars), 1) as average_rating')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('average_rating')
            ->orderByDesc('ratings_count')
            ->get();

        $schools = (clone $ratings)
            ->join('service_sessions', 'service_sessions.id', '=', 'ratings.service_session_id')
            ->join('schools', 'schools.id', '=', 'service_sessions.school_id')
            ->selectRaw('schools.id as school_id, schools.name as school_name')
            ->selectRaw('COUNT(ratings.id) as ratings_count, ROUND(AVG(ratings.stars), 1) as average_rating')
            ->groupBy('schools.id', 'schools.name')
            ->orderByDesc('average_rating')
            ->orderByDesc('ratings_count')
            ->get();

        return [
            'month' => $month,
            'total_ratings' => (clone $ratings)->count(),
            'average_rating' => round((clone $ratings)->avg('stars') ?? 0, 1),
            'technicians' => $technicians,
            'schools' => $schools,
        ];
    }

    /**
     * @return array{
     *     month: string,
     *     technician: User,
     *     total_ratings: int,
     *     average_rating: float,
     *     ratings: \Illuminate\Database\Eloquent\Collection<int, Rating>
     * }
     */
    public function generateTechnicianReport(int $technicianId, string $month): array
    {
        [$start, $end] = $this->monthRange($month);
        $technician = User::query()
            ->where('role', 'technician')
            ->findOrFail($technicianId);

        $ratings = $this->ratingsForPeriod($start, $end)
            ->whereHas('serviceSession', function (Builder $query) use ($technicianId) {
                $query->where('technician_id', $technicianId);
            })
            ->with([
                'serviceSession:id,school_id',
                'serviceSession.school:id,name',
            ])
            ->orderByDesc('created_at')
            ->get(['id', 'service_session_id', 'stars', 'comment', 'created_at']);

        return [
            'month' => $month,
            'technician' => $technician,
            'total_ratings' => $ratings->count(),
            'average_rating' => round($ratings->avg('stars') ?? 0, 1),
            'ratings' => $ratings,
        ];
    }

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    public function monthRange(string $month): array
    {
        $startInLuanda = CarbonImmutable::createFromFormat('!Y-m', $month, 'Africa/Luanda');
        $endInLuanda = $startInLuanda->addMonth();

        return [
            $startInLuanda->setTimezone('UTC'),
            $endInLuanda->setTimezone('UTC'),
        ];
    }

    private function ratingsForPeriod(CarbonImmutable $start, CarbonImmutable $end): Builder
    {
        return Rating::query()
            ->whereNull('ratings.invalidated_at')
            ->where('ratings.created_at', '>=', $start)
            ->where('ratings.created_at', '<', $end);
    }
}
