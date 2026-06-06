<?php

namespace App\Services;

use App\Enums\LeaveStatus;
use App\Models\LeaveRequest;
use App\Models\Booking;
use Illuminate\Support\Facades\DB;

class LeaveRequestService
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function createRequest(array $data, $submittedBy = null)
    {
        return DB::transaction(function () use ($data, $submittedBy) {
            $booking = Booking::findOrFail($data['booking_id']);

            if ($booking->status !== 'confirmed' && $booking->status !== 'pending') {
                throw new \Exception('该预约状态不允许请假');
            }

            $existingRequest = LeaveRequest::where('booking_id', $booking->id)
                ->whereIn('status', [LeaveStatus::PENDING->value, LeaveStatus::APPROVED->value])
                ->first();

            if ($existingRequest) {
                throw new \Exception('该预约已有请假申请');
            }

            $deadline = $booking->start_time->subHours($booking->cancellation_deadline_hours);
            $lessonDeducted = now()->greaterThanOrEqualTo($deadline);

            $leaveRequest = LeaveRequest::create([
                'booking_id' => $booking->id,
                'member_id' => $booking->member_id,
                'reason' => $data['reason'],
                'status' => LeaveStatus::PENDING->value,
                'lesson_deducted' => false,
                'submitted_by' => $submittedBy,
            ]);

            $this->notificationService->sendLeaveSubmitted($leaveRequest);

            return $leaveRequest;
        });
    }

    public function approveRequest($requestId, $reviewerId, $notes = null)
    {
        return DB::transaction(function () use ($requestId, $reviewerId, $notes) {
            $leaveRequest = LeaveRequest::findOrFail($requestId);

            if ($leaveRequest->status !== LeaveStatus::PENDING->value) {
                throw new \Exception('该申请状态不允许审批');
            }

            $booking = $leaveRequest->booking;
            $deadline = $booking->start_time->subHours($booking->cancellation_deadline_hours);
            $deductLesson = now()->greaterThanOrEqualTo($deadline);

            $leaveRequest->approve($reviewerId, $notes, $deductLesson);

            $this->notificationService->sendLeaveApproved($leaveRequest);

            return $leaveRequest;
        });
    }

    public function rejectRequest($requestId, $reviewerId, $notes = null)
    {
        return DB::transaction(function () use ($requestId, $reviewerId, $notes) {
            $leaveRequest = LeaveRequest::findOrFail($requestId);

            if ($leaveRequest->status !== LeaveStatus::PENDING->value) {
                throw new \Exception('该申请状态不允许审批');
            }

            $leaveRequest->reject($reviewerId, $notes);

            $this->notificationService->sendLeaveRejected($leaveRequest);

            return $leaveRequest;
        });
    }

    public function withdrawRequest($requestId, $userId)
    {
        return DB::transaction(function () use ($requestId, $userId) {
            $leaveRequest = LeaveRequest::findOrFail($requestId);

            if (!in_array($leaveRequest->status, [LeaveStatus::PENDING->value])) {
                throw new \Exception('该申请状态不允许撤回');
            }

            $leaveRequest->withdraw($userId);

            return $leaveRequest;
        });
    }

    public function resubmitRequest($requestId, $userId, $newReason = null)
    {
        return DB::transaction(function () use ($requestId, $userId, $newReason) {
            $oldRequest = LeaveRequest::findOrFail($requestId);

            if (!in_array($oldRequest->status, [LeaveStatus::REJECTED->value, LeaveStatus::WITHDRAWN->value])) {
                throw new \Exception('该申请状态不允许重新提交');
            }

            $newRequest = LeaveRequest::create([
                'booking_id' => $oldRequest->booking_id,
                'member_id' => $oldRequest->member_id,
                'reason' => $newReason ?? $oldRequest->reason,
                'status' => LeaveStatus::PENDING->value,
                'lesson_deducted' => false,
                'submitted_by' => $userId,
            ]);

            $this->notificationService->sendLeaveSubmitted($newRequest);

            return $newRequest;
        });
    }

    public function getPendingRequests()
    {
        return LeaveRequest::where('status', LeaveStatus::PENDING->value)
            ->with(['booking.coach.user', 'booking.member.user', 'booking.courseType', 'submittedBy'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getMemberRequests($memberId)
    {
        return LeaveRequest::where('member_id', $memberId)
            ->with(['booking.coach.user', 'booking.courseType', 'reviewedBy'])
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
