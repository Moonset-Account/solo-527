<?php

namespace App\Services;

use App\Enums\RefundStatus;
use App\Models\RefundRequest;
use Illuminate\Support\Facades\DB;

class RefundRequestService
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function createRequest(array $data, $submittedBy = null)
    {
        return DB::transaction(function () use ($data, $submittedBy) {
            $package = \App\Models\MemberCoursePackage::findOrFail($data['package_id']);

            if ($package->used_lessons < $data['refund_lessons']) {
                throw new \Exception('已上课时不足，无法退款');
            }

            $refundAmount = $package->unit_price * $data['refund_lessons'];

            $refundRequest = RefundRequest::create([
                'member_id' => $package->member_id,
                'package_id' => $package->id,
                'refund_lessons' => $data['refund_lessons'],
                'refund_amount' => $refundAmount,
                'reason' => $data['reason'],
                'status' => RefundStatus::PENDING->value,
                'submitted_by' => $submittedBy,
            ]);

            $this->notificationService->sendRefundSubmitted($refundRequest);

            return $refundRequest;
        });
    }

    public function approveRequest($requestId, $reviewerId, $notes = null)
    {
        return DB::transaction(function () use ($requestId, $reviewerId, $notes) {
            $refundRequest = RefundRequest::findOrFail($requestId);

            if ($refundRequest->status !== RefundStatus::PENDING->value) {
                throw new \Exception('该申请状态不允许审批');
            }

            $refundRequest->approve($reviewerId, $notes);

            $this->notificationService->sendRefundApproved($refundRequest);

            return $refundRequest;
        });
    }

    public function rejectRequest($requestId, $reviewerId, $notes = null)
    {
        return DB::transaction(function () use ($requestId, $reviewerId, $notes) {
            $refundRequest = RefundRequest::findOrFail($requestId);

            if ($refundRequest->status !== RefundStatus::PENDING->value) {
                throw new \Exception('该申请状态不允许审批');
            }

            $refundRequest->reject($reviewerId, $notes);

            $this->notificationService->sendRefundRejected($refundRequest);

            return $refundRequest;
        });
    }

    public function withdrawRequest($requestId, $userId)
    {
        return DB::transaction(function () use ($requestId, $userId) {
            $refundRequest = RefundRequest::findOrFail($requestId);

            if ($refundRequest->status !== RefundStatus::PENDING->value) {
                throw new \Exception('该申请状态不允许撤回');
            }

            $refundRequest->withdraw($userId);

            return $refundRequest;
        });
    }

    public function resubmitRequest($requestId, $userId, array $newData = [])
    {
        return DB::transaction(function () use ($requestId, $userId, $newData) {
            $oldRequest = RefundRequest::findOrFail($requestId);

            if (!in_array($oldRequest->status, [RefundStatus::REJECTED->value, RefundStatus::WITHDRAWN->value])) {
                throw new \Exception('该申请状态不允许重新提交');
            }

            $package = $oldRequest->package;
            $refundLessons = $newData['refund_lessons'] ?? $oldRequest->refund_lessons;

            if ($package->used_lessons < $refundLessons) {
                throw new \Exception('已上课时不足，无法退款');
            }

            $refundAmount = $package->unit_price * $refundLessons;

            $newRequest = RefundRequest::create([
                'member_id' => $oldRequest->member_id,
                'package_id' => $oldRequest->package_id,
                'refund_lessons' => $refundLessons,
                'refund_amount' => $refundAmount,
                'reason' => $newData['reason'] ?? $oldRequest->reason,
                'status' => RefundStatus::PENDING->value,
                'submitted_by' => $userId,
            ]);

            $this->notificationService->sendRefundSubmitted($newRequest);

            return $newRequest;
        });
    }

    public function completeRefund($requestId, $operatorId)
    {
        return DB::transaction(function () use ($requestId, $operatorId) {
            $refundRequest = RefundRequest::findOrFail($requestId);

            $refundRequest->complete($operatorId);

            $this->notificationService->sendRefundCompleted($refundRequest);

            return $refundRequest;
        });
    }

    public function getPendingRequests()
    {
        return RefundRequest::where('status', RefundStatus::PENDING->value)
            ->with(['member.user', 'package.courseType', 'submittedBy'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getApprovedForCompletion()
    {
        return RefundRequest::where('status', RefundStatus::APPROVED->value)
            ->with(['member.user', 'package.courseType', 'reviewedBy'])
            ->orderBy('reviewed_at', 'asc')
            ->get();
    }

    public function getMemberRequests($memberId)
    {
        return RefundRequest::where('member_id', $memberId)
            ->with(['package.courseType', 'reviewedBy'])
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
