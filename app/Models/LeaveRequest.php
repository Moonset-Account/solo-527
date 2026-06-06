<?php

namespace App\Models;

use App\Enums\LeaveStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeaveRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'booking_id',
        'member_id',
        'reason',
        'status',
        'review_notes',
        'reviewed_by',
        'reviewed_at',
        'lesson_deducted',
        'submitted_by',
        'withdrawn_at',
        'withdrawn_by',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
        'withdrawn_at' => 'datetime',
        'lesson_deducted' => 'boolean',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function submittedBy()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function approve($reviewerId, $notes = null, $deductLesson = false)
    {
        $this->status = LeaveStatus::APPROVED->value;
        $this->review_notes = $notes;
        $this->reviewed_by = $reviewerId;
        $this->reviewed_at = now();

        if ($deductLesson) {
            $this->lesson_deducted = true;
            if ($this->booking->package) {
                $this->booking->package->deductLesson();
            }
            $this->member->deductLesson();
        }

        $this->save();

        $this->booking->cancel('请假批准', $reviewerId, false);
    }

    public function reject($reviewerId, $notes = null)
    {
        $this->status = LeaveStatus::REJECTED->value;
        $this->review_notes = $notes;
        $this->reviewed_by = $reviewerId;
        $this->reviewed_at = now();
        $this->save();
    }

    public function withdraw($userId)
    {
        $this->status = LeaveStatus::WITHDRAWN->value;
        $this->withdrawn_by = $userId;
        $this->withdrawn_at = now();
        $this->save();
    }
}
