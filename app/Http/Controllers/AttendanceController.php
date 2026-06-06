<?php

namespace App\Http\Controllers;

use App\Services\AttendanceService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AttendanceController extends Controller
{
    protected $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        $this->attendanceService = $attendanceService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = \App\Models\Attendance::with(['booking.member.user', 'booking.coach.user', 'booking.courseType']);

        if ($request->has('member_id')) {
            $query->where('member_id', $request->member_id);
        }

        if ($request->has('coach_id')) {
            $query->where('coach_id', $request->coach_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $attendances = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($attendances);
    }

    public function show($id): JsonResponse
    {
        $attendance = \App\Models\Attendance::with([
            'booking.member.user',
            'booking.coach.user',
            'booking.courseType',
            'reviewedBy',
            'signedInBy',
        ])->findOrFail($id);

        return response()->json($attendance);
    }

    public function memberCheckIn(Request $request, $bookingId): JsonResponse
    {
        $validated = $request->validate([
            'member_id' => 'required|exists:members,id',
        ]);

        try {
            $attendance = $this->attendanceService->memberSelfCheckIn($bookingId, $validated['member_id']);
            return response()->json($attendance->load(['booking']));
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function coachSign(Request $request, $bookingId): JsonResponse
    {
        $validated = $request->validate([
            'coach_user_id' => 'required|exists:users,id',
            'coach_notes' => 'nullable|string',
        ]);

        try {
            $attendance = $this->attendanceService->coachSign($bookingId, $validated['coach_user_id'], $validated['coach_notes'] ?? null);
            return response()->json($attendance->load(['booking']));
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function approveCoachSign(Request $request, $attendanceId): JsonResponse
    {
        $validated = $request->validate([
            'supervisor_id' => 'required|exists:users,id',
            'notes' => 'nullable|string',
        ]);

        try {
            $attendance = $this->attendanceService->approveCoachSign($attendanceId, $validated['supervisor_id'], $validated['notes'] ?? null);
            return response()->json($attendance);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function rejectCoachSign(Request $request, $attendanceId): JsonResponse
    {
        $validated = $request->validate([
            'supervisor_id' => 'required|exists:users,id',
            'notes' => 'required|string',
        ]);

        try {
            $attendance = $this->attendanceService->rejectCoachSign($attendanceId, $validated['supervisor_id'], $validated['notes']);
            return response()->json($attendance);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function markAbsent(Request $request, $bookingId): JsonResponse
    {
        $validated = $request->validate([
            'operator_id' => 'required|exists:users,id',
        ]);

        try {
            $attendance = $this->attendanceService->markAbsent($bookingId, $validated['operator_id']);
            return response()->json($attendance);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function getPendingReviews(): JsonResponse
    {
        $reviews = $this->attendanceService->getPendingReviews();
        return response()->json($reviews);
    }
}
