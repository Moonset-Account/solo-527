<?php

namespace App\Http\Controllers;

use App\Services\RefundRequestService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RefundRequestController extends Controller
{
    protected $refundRequestService;

    public function __construct(RefundRequestService $refundRequestService)
    {
        $this->refundRequestService = $refundRequestService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = \App\Models\RefundRequest::with(['member.user', 'package.courseType', 'submittedBy', 'reviewedBy', 'completedBy']);

        if ($request->has('member_id')) {
            $query->where('member_id', $request->member_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $refundRequests = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($refundRequests);
    }

    public function show($id): JsonResponse
    {
        $refundRequest = \App\Models\RefundRequest::with([
            'member.user',
            'package.courseType',
            'submittedBy',
            'reviewedBy',
            'completedBy',
        ])->findOrFail($id);

        return response()->json($refundRequest);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'package_id' => 'required|exists:member_course_packages,id',
            'refund_lessons' => 'required|integer|min:1',
            'reason' => 'required|string',
        ]);

        try {
            $refundRequest = $this->refundRequestService->createRequest($validated, $request->user()?->id);
            return response()->json($refundRequest->load(['member.user', 'package.courseType']), 201);
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
            $refundRequest = $this->refundRequestService->approveRequest($id, $validated['reviewer_id'], $validated['notes'] ?? null);
            return response()->json($refundRequest);
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
            $refundRequest = $this->refundRequestService->rejectRequest($id, $validated['reviewer_id'], $validated['notes']);
            return response()->json($refundRequest);
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
            $refundRequest = $this->refundRequestService->withdrawRequest($id, $validated['user_id']);
            return response()->json($refundRequest);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function resubmit(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'refund_lessons' => 'nullable|integer|min:1',
            'reason' => 'nullable|string',
        ]);

        try {
            $refundRequest = $this->refundRequestService->resubmitRequest($id, $validated['user_id'], $validated);
            return response()->json($refundRequest->load(['member.user', 'package.courseType']), 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function complete(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'operator_id' => 'required|exists:users,id',
        ]);

        try {
            $refundRequest = $this->refundRequestService->completeRefund($id, $validated['operator_id']);
            return response()->json($refundRequest);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function getPending(): JsonResponse
    {
        $requests = $this->refundRequestService->getPendingRequests();
        return response()->json($requests);
    }

    public function getApprovedForCompletion(): JsonResponse
    {
        $requests = $this->refundRequestService->getApprovedForCompletion();
        return response()->json($requests);
    }

    public function getMemberRequests($memberId): JsonResponse
    {
        $requests = $this->refundRequestService->getMemberRequests($memberId);
        return response()->json($requests);
    }
}
