<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Rating;
use App\Models\School;
use App\Models\User;
use App\Services\RatingService;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

class AdminController extends Controller
{
    public function __construct(
        private RatingService $ratingService,
        private ReportService $reportService,
    ) {}

    public function ratings(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'technician_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where('role', 'technician'),
            ],
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'month' => ['nullable', 'date_format:Y-m'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = Rating::query()
            ->select([
                'id',
                'service_session_id',
                'stars',
                'comment',
                'created_at',
                'invalidated_at',
                'invalidated_by',
                'invalidation_reason',
            ])
            ->with([
                'serviceSession:id,technician_id,school_id',
                'serviceSession.technician:id,name',
                'serviceSession.school:id,name',
                'invalidatedBy:id,name',
            ]);

        if (isset($filters['technician_id'])) {
            $query->whereHas('serviceSession', function ($sessionQuery) use ($filters) {
                $sessionQuery->where('technician_id', $filters['technician_id']);
            });
        }

        if (isset($filters['school_id'])) {
            $query->whereHas('serviceSession', function ($sessionQuery) use ($filters) {
                $sessionQuery->where('school_id', $filters['school_id']);
            });
        }

        if (isset($filters['month'])) {
            [$start, $end] = $this->reportService->monthRange($filters['month']);
            $query->where('created_at', '>=', $start)
                ->where('created_at', '<', $end);
        }

        $ratings = $query->orderByDesc('created_at')
            ->paginate(30)
            ->through(fn (Rating $rating): array => [
                'id' => $rating->id,
                'stars' => $rating->stars,
                'comment' => $rating->comment,
                'created_at' => $rating->created_at
                    ->setTimezone('Africa/Luanda')
                    ->toIso8601String(),
                'invalidated_at' => $rating->invalidated_at?->toIso8601String(),
                'invalidation_reason' => $rating->invalidation_reason,
                'invalidated_by' => $rating->invalidatedBy?->name,
                'technician' => [
                    'id' => $rating->serviceSession->technician->id,
                    'name' => $rating->serviceSession->technician->name,
                ],
                'school_name' => $rating->serviceSession->school->name,
            ]);

        return response()->json($ratings);
    }

    public function invalidateRating(Request $request, Rating $rating): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
        ]);

        try {
            $this->ratingService->invalidate($rating, $request->user(), $validated['reason']);
        } catch (InvalidArgumentException $exception) {
            return response()->json(['error' => $exception->getMessage()], 422);
        }

        return response()->json(['status' => 'invalidated']);
    }

    public function revalidateRating(Rating $rating): JsonResponse
    {
        try {
            $this->ratingService->revalidate($rating);
        } catch (InvalidArgumentException $exception) {
            return response()->json(['error' => $exception->getMessage()], 422);
        }

        return response()->json(['status' => 'revalidated']);
    }

    public function technicians(): JsonResponse
    {
        $technicians = User::query()
            ->where('role', 'technician')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'photo_path', 'active'])
            ->map(fn (User $technician): array => [
                'id' => $technician->id,
                'name' => $technician->name,
                'email' => $technician->email,
                'photo_url' => $technician->photo_path
                    ? Storage::disk('public')->url($technician->photo_path)
                    : null,
                'active' => $technician->active,
            ]);

        return response()->json($technicians);
    }

    public function storeTechnician(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            'photo' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $photoPath = $request->file('photo')->store('technicians', 'public');
        if ($photoPath === false) {
            throw new RuntimeException('Não foi possível guardar a fotografia do técnico.');
        }

        try {
            $technician = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'technician',
                'photo_path' => $photoPath,
                'active' => true,
            ]);
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($photoPath);
            throw $exception;
        }

        return response()->json([
            'id' => $technician->id,
            'name' => $technician->name,
            'email' => $technician->email,
            'photo_url' => Storage::disk('public')->url($technician->photo_path),
            'active' => $technician->active,
        ], 201);
    }

    public function schools(): JsonResponse
    {
        return response()->json(
            School::query()->orderBy('name')->get(['id', 'name', 'active'])
        );
    }

    public function storeSchool(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:schools,name'],
        ]);

        $school = School::create([
            'name' => $validated['name'],
            'active' => true,
        ]);

        return response()->json($school->only(['id', 'name', 'active']), 201);
    }
}
