<?php

namespace App\Http\Controllers;

use App\Models\Coach;
use App\Services\CoachCalendarService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CoachController extends Controller
{
    protected $calendarService;

    public function __construct(CoachCalendarService $calendarService)
    {
        $this->calendarService = $calendarService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Coach::with(['user', 'courseTypes']);

        if ($request->has('keyword')) {
            $keyword = $request->keyword;
            $query->whereHas('user', function ($uq) use ($keyword) {
                $uq->where('name', 'like', "%{$keyword}%")
                    ->orWhere('phone', 'like', "%{$keyword}%");
            });
        }

        if ($request->has('course_type_id')) {
            $query->whereHas('courseTypes', function ($cq) use ($request) {
                $cq->where('course_type_id', $request->course_type_id);
            });
        }

        $coaches = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($coaches);
    }

    public function show($id): JsonResponse
    {
        $coach = Coach::with(['user', 'courseTypes', 'availableTimes'])->findOrFail($id);
        return response()->json($coach);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id|unique:coaches,user_id',
            'employee_no' => 'required|unique:coaches',
            'gender' => 'nullable|in:male,female',
            'specialties' => 'nullable|array',
            'certifications' => 'nullable|array',
            'experience_years' => 'nullable|integer|min:0',
            'bio' => 'nullable|string',
            'course_types' => 'nullable|array',
            'course_types.*' => 'exists:course_types,id',
        ]);

        $coach = Coach::create($validated);

        if (!empty($validated['course_types'])) {
            $coach->courseTypes()->sync($validated['course_types']);
        }

        return response()->json($coach->load(['user', 'courseTypes']), 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $coach = Coach::findOrFail($id);

        $validated = $request->validate([
            'gender' => 'nullable|in:male,female',
            'specialties' => 'nullable|array',
            'certifications' => 'nullable|array',
            'experience_years' => 'nullable|integer|min:0',
            'bio' => 'nullable|string',
            'course_types' => 'nullable|array',
            'course_types.*' => 'exists:course_types,id',
        ]);

        $coach->update($validated);

        if (isset($validated['course_types'])) {
            $coach->courseTypes()->sync($validated['course_types']);
        }

        return response()->json($coach->load(['user', 'courseTypes']));
    }

    public function destroy($id): JsonResponse
    {
        $coach = Coach::findOrFail($id);
        $coach->delete();

        return response()->json(['message' => '教练已删除']);
    }

    public function getCalendar($id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        $calendar = $this->calendarService->getCoachCalendar(
            $id,
            $validated['start_date'],
            $validated['end_date']
        );

        return response()->json($calendar);
    }

    public function getAvailableSlots($id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_type_id' => 'required|exists:course_types,id',
            'date' => 'required|date',
        ]);

        $slots = $this->calendarService->getAvailableSlots(
            $id,
            $validated['course_type_id'],
            $validated['date']
        );

        return response()->json($slots);
    }

    public function getStats($id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        $stats = $this->calendarService->getCoachStats(
            $id,
            $validated['start_date'],
            $validated['end_date']
        );

        return response()->json($stats);
    }

    public function getAvailableTimes($id): JsonResponse
    {
        $coach = Coach::findOrFail($id);
        $times = $coach->availableTimes()->get();

        return response()->json($times);
    }

    public function addAvailableTime(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'day_of_week' => 'required|integer|min:0|max:6',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'is_recurring' => 'nullable|boolean',
            'specific_date' => 'nullable|date',
        ]);

        $availableTime = $this->calendarService->setAvailableTime($id, $validated);

        return response()->json($availableTime, 201);
    }

    public function removeAvailableTime($id, $timeId): JsonResponse
    {
        $this->calendarService->removeAvailableTime($timeId);

        return response()->json(['message' => '可约时段已删除']);
    }
}
