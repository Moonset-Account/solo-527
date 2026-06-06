<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Booking extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'member_id',
        'coach_id',
        'course_type_id',
        'package_id',
        'start_time',
        'end_time',
        'status',
        'is_free_cancellation',
        'cancellation_deadline_hours',
        'notes',
        'cancel_reason',
        'cancelled_by',
        'cancelled_at',
        'created_by',
        'confirmed_by',
        'confirmed_at',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'cancelled_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'is_free_cancellation' => 'boolean',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function coach()
    {
        return $this->belongsTo(Coach::class);
    }

    public function courseType()
    {
        return $this->belongsTo(CourseType::class);
    }

    public function package()
    {
        return $this->belongsTo(MemberCoursePackage::class, 'package_id');
    }

    public function attendance()
    {
        return $this->hasOne(Attendance::class);
    }

    public function leaveRequest()
    {
        return $this->hasOne(LeaveRequest::class);
    }

    public function isCancellable()
    {
        if (!in_array($this->status, [BookingStatus::PENDING->value, BookingStatus::CONFIRMED->value])) {
            return false;
        }

        $deadline = $this->start_time->subHours($this->cancellation_deadline_hours);
        return now()->lessThan($deadline);
    }

    public function willDeductLessonOnCancel()
    {
        return !$this->isCancellable() && $this->is_free_cancellation;
    }

    public function confirm($userId = null)
    {
        $this->status = BookingStatus::CONFIRMED->value;
        $this->confirmed_by = $userId;
        $this->confirmed_at = now();
        $this->save();
    }

    public function cancel($reason, $userId = null, $deductLesson = false)
    {
        $this->status = BookingStatus::CANCELLED->value;
        $this->cancel_reason = $reason;
        $this->cancelled_by = $userId;
        $this->cancelled_at = now();
        $this->save();

        if ($deductLesson && $this->package) {
            $this->package->deductLesson();
            $this->member->deductLesson();
        }
    }

    public function complete()
    {
        $this->status = BookingStatus::COMPLETED->value;
        $this->save();
    }
}
