<?php

namespace App\Models;

use App\Enums\RefundStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RefundRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'member_id',
        'package_id',
        'refund_lessons',
        'refund_amount',
        'reason',
        'status',
        'review_notes',
        'reviewed_by',
        'reviewed_at',
        'submitted_by',
        'withdrawn_at',
        'withdrawn_by',
        'coach_lessons_adjusted',
        'completed_at',
        'completed_by',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
        'withdrawn_at' => 'datetime',
        'completed_at' => 'datetime',
        'coach_lessons_adjusted' => 'boolean',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function package()
    {
        return $this->belongsTo(MemberCoursePackage::class, 'package_id');
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function submittedBy()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function revenueLog()
    {
        return $this->hasOne(CoachRevenueLog::class);
    }

    public function storeRevenueLog()
    {
        return $this->hasOne(StoreRevenueLog::class);
    }

    public function approve($reviewerId, $notes = null)
    {
        $this->status = RefundStatus::APPROVED->value;
        $this->review_notes = $notes;
        $this->reviewed_by = $reviewerId;
        $this->reviewed_at = now();
        $this->save();
    }

    public function reject($reviewerId, $notes = null)
    {
        $this->status = RefundStatus::REJECTED->value;
        $this->review_notes = $notes;
        $this->reviewed_by = $reviewerId;
        $this->reviewed_at = now();
        $this->save();
    }

    public function withdraw($userId)
    {
        $this->status = RefundStatus::WITHDRAWN->value;
        $this->withdrawn_by = $userId;
        $this->withdrawn_at = now();
        $this->save();
    }

    public function complete($operatorId)
    {
        if ($this->status !== RefundStatus::APPROVED->value) {
            throw new \Exception('退款审批通过后才能完成退款');
        }

        $this->adjustCoachLessons($operatorId);

        $this->package->refundLesson($this->refund_lessons);
        $this->member->refundLesson($this->refund_lessons);

        StoreRevenueLog::create([
            'member_id' => $this->member_id,
            'refund_request_id' => $this->id,
            'package_id' => $this->package_id,
            'type' => 'refund',
            'amount' => -$this->refund_amount,
            'description' => "退款完成 - {$this->refund_lessons}课时，金额{$this->refund_amount}",
            'created_by' => $operatorId,
        ]);

        $this->status = RefundStatus::COMPLETED->value;
        $this->completed_at = now();
        $this->completed_by = $operatorId;
        $this->save();
    }

    protected function adjustCoachLessons($operatorId)
    {
        if ($this->coach_lessons_adjusted) {
            return;
        }

        $courseType = $this->package->courseType;
        $commissionPerLesson = $courseType->coach_commission;

        $confirmedBookings = Booking::where('member_id', $this->member_id)
            ->where('course_type_id', $this->package->course_type_id)
            ->where('status', 'completed')
            ->count();

        $adjustLessons = min($this->refund_lessons, max(0, $confirmedBookings));

        if ($adjustLessons > 0) {
            $bookings = Booking::where('member_id', $this->member_id)
                ->where('course_type_id', $this->package->course_type_id)
                ->where('status', 'completed')
                ->with('attendance.revenueLog')
                ->limit($adjustLessons)
                ->get();

            foreach ($bookings as $booking) {
                if ($booking->attendance && $booking->attendance->revenueLog) {
                    CoachRevenueLog::create([
                        'coach_id' => $booking->coach_id,
                        'refund_request_id' => $this->id,
                        'attendance_id' => $booking->attendance->id,
                        'type' => 'refund_adjust',
                        'amount' => -$commissionPerLesson,
                        'description' => "退款调整 - 扣回课时提成",
                        'created_by' => $operatorId,
                    ]);
                }
            }
        }

        $this->coach_lessons_adjusted = true;
        $this->save();
    }
}
