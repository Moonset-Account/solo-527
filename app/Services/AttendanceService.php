<?php

namespace App\Services;

use App\Enums\AttendanceStatus;
use App\Models\Attendance;
use App\Models\Booking;
use App\Models\CoachRevenueLog;
use Illuminate\Support\Facades\DB;

class AttendanceService
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function memberSelfCheckIn($bookingId, $memberId)
    {
        return DB::transaction(function () use ($bookingId, $memberId) {
            $booking = Booking::findOrFail($bookingId);

            if ($booking->member_id != $memberId) {
                throw new \Exception('无权操作此预约');
            }

            if ($booking->attendance && $booking->attendance->status !== 'pending') {
                throw new \Exception('该预约已签到');
            }

            $attendance = $booking->attendance;
            $attendance->status = AttendanceStatus::PRESENT->value;
            $attendance->signed_in_at = now();
            $attendance->save();

            $this->completeCheckIn($attendance, $memberId);

            return $attendance;
        });
    }

    public function coachSign($bookingId, $coachUserId, $coachNotes = null)
    {
        return DB::transaction(function () use ($bookingId, $coachUserId, $coachNotes) {
            $booking = Booking::findOrFail($bookingId);
            $attendance = $booking->attendance;

            if (!$attendance) {
                throw new \Exception('签到记录不存在');
            }

            if ($attendance->status !== 'pending' && $attendance->status !== AttendanceStatus::PRESENT->value) {
                throw new \Exception('该签到状态不允许教练代签');
            }

            $attendance->coachSign($coachUserId);
            $attendance->coach_notes = $coachNotes;
            $attendance->save();

            $this->notificationService->sendCoachSignReviewNotification($attendance);

            return $attendance;
        });
    }

    public function approveCoachSign($attendanceId, $supervisorId, $notes = null)
    {
        return DB::transaction(function () use ($attendanceId, $supervisorId, $notes) {
            $attendance = Attendance::findOrFail($attendanceId);

            if ($attendance->status !== AttendanceStatus::REVIEW_PENDING->value) {
                throw new \Exception('该签到不需要复核');
            }

            $attendance->approveReview($supervisorId, $notes);

            $this->recordCoachRevenue($attendance, $supervisorId);

            $this->notificationService->sendCoachSignApproved($attendance);

            return $attendance;
        });
    }

    public function rejectCoachSign($attendanceId, $supervisorId, $notes = null)
    {
        return DB::transaction(function () use ($attendanceId, $supervisorId, $notes) {
            $attendance = Attendance::findOrFail($attendanceId);

            if ($attendance->status !== AttendanceStatus::REVIEW_PENDING->value) {
                throw new \Exception('该签到不需要复核');
            }

            $attendance->rejectReview($supervisorId, $notes);

            $this->notificationService->sendCoachSignRejected($attendance);

            return $attendance;
        });
    }

    protected function completeCheckIn($attendance, $operatorId)
    {
        $attendance->deductLesson($operatorId);

        $this->recordCoachRevenue($attendance, $operatorId);

        $attendance->booking->complete();

        $this->notificationService->sendAttendanceCompleted($attendance);
    }

    protected function recordCoachRevenue($attendance, $operatorId)
    {
        $courseType = $attendance->booking->courseType;
        $commission = $courseType->coach_commission;

        CoachRevenueLog::create([
            'coach_id' => $attendance->coach_id,
            'attendance_id' => $attendance->id,
            'type' => 'lesson_commission',
            'amount' => $commission,
            'description' => "课程提成 - {$courseType->name}",
            'created_by' => $operatorId,
        ]);
    }

    public function markAbsent($bookingId, $operatorId)
    {
        return DB::transaction(function () use ($bookingId, $operatorId) {
            $booking = Booking::findOrFail($bookingId);
            $attendance = $booking->attendance;

            if (!$attendance) {
                throw new \Exception('签到记录不存在');
            }

            $attendance->status = AttendanceStatus::ABSENT->value;
            $attendance->deductLesson($operatorId);
            $attendance->save();

            $booking->status = 'no_show';
            $booking->save();

            return $attendance;
        });
    }

    public function getPendingReviews()
    {
        return Attendance::where('status', AttendanceStatus::REVIEW_PENDING->value)
            ->with(['booking.coach.user', 'booking.member.user', 'booking.courseType'])
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
