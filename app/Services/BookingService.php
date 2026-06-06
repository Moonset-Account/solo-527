<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Member;
use App\Models\Coach;
use App\Models\CourseType;
use App\Models\MemberCoursePackage;
use App\Models\Attendance;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BookingService
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function createBooking(array $data, $createdBy = null)
    {
        return DB::transaction(function () use ($data, $createdBy) {
            $member = Member::findOrFail($data['member_id']);
            $coach = Coach::findOrFail($data['coach_id']);
            $courseType = CourseType::findOrFail($data['course_type_id']);

            $startTime = Carbon::parse($data['start_time']);
            $endTime = $startTime->copy()->addMinutes($courseType->duration_minutes);

            if (!$coach->isAvailableAt($startTime)) {
                throw new \Exception('该时段教练不可用');
            }

            if ($this->hasTimeConflict($coach->id, $startTime, $endTime)) {
                throw new \Exception('该时段已有预约，存在时间冲突');
            }

            $package = null;
            if (!empty($data['package_id'])) {
                $package = MemberCoursePackage::findOrFail($data['package_id']);
                if ($package->remaining_lessons <= 0) {
                    throw new \Exception('课时包剩余课时不足');
                }
            } else {
                $package = $member->packages()
                    ->where('course_type_id', $courseType->id)
                    ->where('remaining_lessons', '>', 0)
                    ->where('expire_date', '>=', now())
                    ->orderBy('expire_date', 'asc')
                    ->first();

                if (!$package) {
                    throw new \Exception('没有可用的课时包');
                }
            }

            $booking = Booking::create([
                'member_id' => $member->id,
                'coach_id' => $coach->id,
                'course_type_id' => $courseType->id,
                'package_id' => $package->id,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'status' => BookingStatus::PENDING->value,
                'is_free_cancellation' => true,
                'cancellation_deadline_hours' => 24,
                'notes' => $data['notes'] ?? null,
                'created_by' => $createdBy,
            ]);

            Attendance::create([
                'booking_id' => $booking->id,
                'member_id' => $member->id,
                'coach_id' => $coach->id,
                'status' => 'pending',
            ]);

            $booking->confirm($createdBy);

            $this->notificationService->sendBookingConfirmation($booking);

            return $booking;
        });
    }

    public function cancelBooking($bookingId, $reason, $cancelledBy = null)
    {
        return DB::transaction(function () use ($bookingId, $reason, $cancelledBy) {
            $booking = Booking::findOrFail($bookingId);

            $deductLesson = $booking->willDeductLessonOnCancel();

            $booking->cancel($reason, $cancelledBy, $deductLesson);

            if ($booking->attendance) {
                $booking->attendance->status = 'cancelled';
                $booking->attendance->save();
            }

            $this->notificationService->sendBookingCancellation($booking, $reason);

            return $booking;
        });
    }

    public function rescheduleBooking($bookingId, $newStartTime, $rescheduledBy = null)
    {
        return DB::transaction(function () use ($bookingId, $newStartTime, $rescheduledBy) {
            $oldBooking = Booking::findOrFail($bookingId);
            $courseType = $oldBooking->courseType;
            $newStartTime = Carbon::parse($newStartTime);
            $newEndTime = $newStartTime->copy()->addMinutes($courseType->duration_minutes);

            if (!$oldBooking->coach->isAvailableAt($newStartTime)) {
                throw new \Exception('新时段教练不可用');
            }

            if ($this->hasTimeConflict($oldBooking->coach_id, $newStartTime, $newEndTime, $oldBooking->id)) {
                throw new \Exception('新时段已有预约，存在时间冲突');
            }

            $oldBooking->status = BookingStatus::RESCHEDULED->value;
            $oldBooking->save();

            if ($oldBooking->attendance) {
                $oldBooking->attendance->status = 'rescheduled';
                $oldBooking->attendance->save();
            }

            $newBooking = Booking::create([
                'member_id' => $oldBooking->member_id,
                'coach_id' => $oldBooking->coach_id,
                'course_type_id' => $oldBooking->course_type_id,
                'package_id' => $oldBooking->package_id,
                'start_time' => $newStartTime,
                'end_time' => $newEndTime,
                'status' => BookingStatus::CONFIRMED->value,
                'is_free_cancellation' => true,
                'cancellation_deadline_hours' => 24,
                'notes' => "改期自原预约 #{$oldBooking->id}",
                'created_by' => $rescheduledBy,
                'confirmed_by' => $rescheduledBy,
                'confirmed_at' => now(),
            ]);

            Attendance::create([
                'booking_id' => $newBooking->id,
                'member_id' => $newBooking->member_id,
                'coach_id' => $newBooking->coach_id,
                'status' => 'pending',
            ]);

            $this->notificationService->sendBookingReschedule($oldBooking, $newBooking);

            return $newBooking;
        });
    }

    protected function hasTimeConflict($coachId, $startTime, $endTime, $excludeBookingId = null)
    {
        $query = Booking::where('coach_id', $coachId)
            ->whereIn('status', [BookingStatus::PENDING->value, BookingStatus::CONFIRMED->value])
            ->where(function ($q) use ($startTime, $endTime) {
                $q->whereBetween('start_time', [$startTime, $endTime])
                    ->orWhereBetween('end_time', [$startTime, $endTime])
                    ->orWhere(function ($q2) use ($startTime, $endTime) {
                        $q2->where('start_time', '<=', $startTime)
                            ->where('end_time', '>=', $endTime);
                    });
            });

        if ($excludeBookingId) {
            $query->where('id', '!=', $excludeBookingId);
        }

        return $query->exists();
    }

    public function getCoachBookings($coachId, $startDate, $endDate)
    {
        return Booking::where('coach_id', $coachId)
            ->whereBetween('start_time', [$startDate, $endDate])
            ->with(['member.user', 'courseType', 'attendance'])
            ->orderBy('start_time')
            ->get();
    }

    public function getMemberBookings($memberId, $status = null)
    {
        $query = Booking::where('member_id', $memberId)
            ->with(['coach.user', 'courseType', 'attendance']);

        if ($status) {
            $query->where('status', $status);
        }

        return $query->orderBy('start_time', 'desc')->get();
    }
}
