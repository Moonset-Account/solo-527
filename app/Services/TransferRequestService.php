<?php

namespace App\Services;

use App\Enums\TransferStatus;
use App\Models\TransferRequest;
use Illuminate\Support\Facades\DB;

class TransferRequestService
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function createRequest(array $data, $submittedBy = null)
    {
        return DB::transaction(function () use ($data, $submittedBy) {
            $member = \App\Models\Member::findOrFail($data['member_id']);
            $fromCoach = \App\Models\Coach::findOrFail($data['from_coach_id']);
            $toCoach = \App\Models\Coach::findOrFail($data['to_coach_id']);
            $courseType = \App\Models\CourseType::findOrFail($data['course_type_id']);

            if ($fromCoach->id === $toCoach->id) {
                throw new \Exception('不能转课给同一个教练');
            }

            $package = $member->packages()
                ->where('course_type_id', $courseType->id)
                ->where('remaining_lessons', '>=', $data['lessons_count'])
                ->first();

            if (!$package) {
                throw new \Exception('剩余课时不足，无法转课');
            }

            $transferRequest = TransferRequest::create([
                'member_id' => $member->id,
                'from_coach_id' => $fromCoach->id,
                'to_coach_id' => $toCoach->id,
                'course_type_id' => $courseType->id,
                'lessons_count' => $data['lessons_count'],
                'reason' => $data['reason'] ?? null,
                'status' => TransferStatus::PENDING->value,
                'submitted_by' => $submittedBy,
            ]);

            $this->notificationService->sendTransferSubmitted($transferRequest);

            return $transferRequest;
        });
    }

    public function approveRequest($requestId, $reviewerId, $notes = null)
    {
        return DB::transaction(function () use ($requestId, $reviewerId, $notes) {
            $transferRequest = TransferRequest::findOrFail($requestId);

            if ($transferRequest->status !== TransferStatus::PENDING->value) {
                throw new \Exception('该申请状态不允许审批');
            }

            $transferRequest->approve($reviewerId, $notes);

            $this->notificationService->sendTransferApproved($transferRequest);

            return $transferRequest;
        });
    }

    public function rejectRequest($requestId, $reviewerId, $notes = null)
    {
        return DB::transaction(function () use ($requestId, $reviewerId, $notes) {
            $transferRequest = TransferRequest::findOrFail($requestId);

            if ($transferRequest->status !== TransferStatus::PENDING->value) {
                throw new \Exception('该申请状态不允许审批');
            }

            $transferRequest->reject($reviewerId, $notes);

            $this->notificationService->sendTransferRejected($transferRequest);

            return $transferRequest;
        });
    }

    public function withdrawRequest($requestId, $userId)
    {
        return DB::transaction(function () use ($requestId, $userId) {
            $transferRequest = TransferRequest::findOrFail($requestId);

            if ($transferRequest->status !== TransferStatus::PENDING->value) {
                throw new \Exception('该申请状态不允许撤回');
            }

            $transferRequest->withdraw($userId);

            return $transferRequest;
        });
    }

    public function resubmitRequest($requestId, $userId, array $newData = [])
    {
        return DB::transaction(function () use ($requestId, $userId, $newData) {
            $oldRequest = TransferRequest::findOrFail($requestId);

            if (!in_array($oldRequest->status, [TransferStatus::REJECTED->value, TransferStatus::WITHDRAWN->value])) {
                throw new \Exception('该申请状态不允许重新提交');
            }

            $newRequest = TransferRequest::create([
                'member_id' => $oldRequest->member_id,
                'from_coach_id' => $newData['from_coach_id'] ?? $oldRequest->from_coach_id,
                'to_coach_id' => $newData['to_coach_id'] ?? $oldRequest->to_coach_id,
                'course_type_id' => $newData['course_type_id'] ?? $oldRequest->course_type_id,
                'lessons_count' => $newData['lessons_count'] ?? $oldRequest->lessons_count,
                'reason' => $newData['reason'] ?? $oldRequest->reason,
                'status' => TransferStatus::PENDING->value,
                'submitted_by' => $userId,
            ]);

            $this->notificationService->sendTransferSubmitted($newRequest);

            return $newRequest;
        });
    }

    public function getPendingRequests()
    {
        return TransferRequest::where('status', TransferStatus::PENDING->value)
            ->with(['member.user', 'fromCoach.user', 'toCoach.user', 'courseType', 'submittedBy'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getMemberRequests($memberId)
    {
        return TransferRequest::where('member_id', $memberId)
            ->with(['fromCoach.user', 'toCoach.user', 'courseType', 'reviewedBy'])
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
