<?php

namespace App\Http\Controllers;

use App\Services\TransferRequestService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TransferRequestController extends Controller
{
    protected $transferRequestService;

    public function __construct(TransferRequestService $transferRequestService)
    {
        $this->transferRequestService = $transferRequestService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = \App\Models\TransferRequest::with(['member.user', 'fromCoach.user', 'toCoach.user', 'courseType', 'submittedBy', 'reviewedBy']);

        if ($request->has('member_id')) {
            $query->where('member_id', $request->member_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $transferRequests = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($transferRequests);
    }

    public function show($id): JsonResponse
    {
        $transferRequest = \App\Models\TransferRequest::with([
            'member.user',
            'fromCoach.user',
            'toCoach.user',
            'courseType',
            'submittedBy',
            'reviewedBy',
        ])->findOrFail($id);

        return response()->json($transferRequest);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'member_id' => 'required|exists:members,id',
            'from_coach_id' => 'required|exists:coaches,id',
            'to_coach_id' => 'required|exists:coaches,id|different:from_coach_id',
            'course_type_id' => 'required|exists:course_types,id',
            'lessons_count' => 'required|integer|min:1',
            'reason' => 'nullable|string',
        ]);

        try {
            $transferRequest = $this->transferRequestService->createRequest($validated, $request->user()?->id);
            return response()->json($transferRequest->load(['member.user', 'fromCoach.user', 'toCoach.user']), 201);
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
            $transferRequest = $this->transferRequestService->approveRequest($id, $validated['reviewer_id'], $validated['notes'] ?? null);
            return response()->json($transferRequest);
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
            $transferRequest = $this->transferRequestService->rejectRequest($id, $validated['reviewer_id'], $validated['notes']);
            return response()->json($transferRequest);
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
            $transferRequest = $this->transferRequestService->withdrawRequest($id, $validated['user_id']);
            return response()->json($transferRequest);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function resubmit(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'from_coach_id' => 'nullable|exists:coaches,id',
            'to_coach_id' => 'nullable|exists:coaches,id|different:from_coach_id',
            'course_type_id' => 'nullable|exists:course_types,id',
            'lessons_count' => 'nullable|integer|min:1',
            'reason' => 'nullable|string',
        ]);

        try {
            $transferRequest = $this->transferRequestService->resubmitRequest($id, $validated['user_id'], $validated);
            return response()->json($transferRequest->load(['member.user', 'fromCoach.user', 'toCoach.user']), 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function getPending(): JsonResponse
    {
        $requests = $this->transferRequestService->getPendingRequests();
        return response()->json($requests);
    }

    public function getMemberRequests($memberId): JsonResponse
    {
        $requests = $this->transferRequestService->getMemberRequests($memberId);
        return response()->json($requests);
    }
}
