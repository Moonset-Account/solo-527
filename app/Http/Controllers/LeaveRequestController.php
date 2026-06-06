<?php

namespace App\Http\Controllers;

use App\Services\LeaveRequestService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LeaveRequestController extends Controller
{
    protected $leaveRequestService;

    public function __construct(LeaveRequestService $leaveRequestService)
    {
        $this->leaveRequestService = $leaveRequestService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = \App\Models\LeaveRequest::with(['booking.member.user', 'booking.coach.user', 'booking.courseType', 'submittedBy', 'reviewedBy']);

        if ($request->has('member_id')) {
            $query->where('member_id', $request->member_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $leaveRequests = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($leaveRequests);
    }

    public function show($id): JsonResponse
    {
        $leaveRequest = \App\Models\LeaveRequest::with([
            'booking.member.user',
            'booking.coach.user',
            'booking.courseType',
            'submittedBy',
            'reviewedBy',
        ])->findOrFail($id);

        return response()->json($leaveRequest);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'reason' => 'required|string',
        ]);

        try {
            $leaveRequest = $this->leaveRequestService->createRequest($validated, $request->user()?->id);
            return response()->json($leaveRequest->load(['booking']), 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function approve(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'reviewer_id' => 'required|exists:users,id',
            'notes' => 'nullable|string',
        ]);

        try {
            $leaveRequest = $this->leaveRequestService->approveRequest($id, $validated['reviewer_id'], $validated['notes'] ?? null);
            return response()->json($leaveRequest);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function reject(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'reviewer_id' => 'required|exists:users,id',
            'notes' => 'required|string',
        ]);

        try {
            $leaveRequest = $this->leaveRequestService->rejectRequest($id, $validated['reviewer_id'], $validated['notes']);
            return response()->json($leaveRequest);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function withdraw(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        try {
            $leaveRequest = $this->leaveRequestService->withdrawRequest($id, $validated['user_id']);
            return response()->json($leaveRequest);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function resubmit(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'reason' => 'nullable|string',
        ]);

        try {
            $leaveRequest = $this->leaveRequestService->resubmitRequest($id, $validated['user_id'], $validated['reason'] ?? null);
            return response()->json($leaveRequest->load(['booking']), 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function getPending(): JsonResponse
    {
        $requests = $this->leaveRequestService->getPendingRequests();
        return response()->json($requests);
    }

    public function getMemberRequests($memberId): JsonResponse
    {
        $requests = $this->leaveRequestService->getMemberRequests($memberId);
        return response()->json($requests);
    }
}
