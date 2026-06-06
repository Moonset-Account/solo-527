<?php

namespace App\Http\Controllers;

use App\Services\BookingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BookingController extends Controller
{
    protected $bookingService;

    public function __construct(BookingService $bookingService)
    {
        $this->bookingService = $bookingService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = \App\Models\Booking::with(['member.user', 'coach.user', 'courseType', 'attendance']);

        if ($request->has('member_id')) {
            $query->where('member_id', $request->member_id);
        }

        if ($request->has('coach_id')) {
            $query->where('coach_id', $request->coach_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('start_date')) {
            $query->where('start_time', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->where('start_time', '<=', $request->end_date);
        }

        $bookings = $query->orderBy('start_time', 'desc')->paginate(20);

        return response()->json($bookings);
    }

    public function show($id): JsonResponse
    {
        $booking = \App\Models\Booking::with([
            'member.user',
            'coach.user',
            'courseType',
            'package',
            'attendance',
            'leaveRequest',
        ])->findOrFail($id);

        return response()->json($booking);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'member_id' => 'required|exists:members,id',
            'coach_id' => 'required|exists:coaches,id',
            'course_type_id' => 'required|exists:course_types,id',
            'package_id' => 'nullable|exists:member_course_packages,id',
            'start_time' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        try {
            $booking = $this->bookingService->createBooking($validated, $request->user()?->id);
            return response()->json($booking->load(['member.user', 'coach.user', 'courseType', 'attendance']), 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function cancel(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string',
        ]);

        try {
            $booking = $this->bookingService->cancelBooking($id, $validated['reason'], $request->user()?->id);
            return response()->json($booking);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function reschedule(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'start_time' => 'required|date',
        ]);

        try {
            $booking = $this->bookingService->rescheduleBooking($id, $validated['start_time'], $request->user()?->id);
            return response()->json($booking->load(['member.user', 'coach.user', 'courseType', 'attendance']));
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function getCoachBookings($coachId, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        $bookings = $this->bookingService->getCoachBookings(
            $coachId,
            $validated['start_date'],
            $validated['end_date']
        );

        return response()->json($bookings);
    }
}
