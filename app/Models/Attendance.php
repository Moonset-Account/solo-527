<?php

namespace App\Models;

use App\Enums\AttendanceStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'member_id',
        'coach_id',
        'status',
        'is_coach_signed',
        'needs_review',
        'review_notes',
        'reviewed_by',
        'reviewed_at',
        'signed_in_at',
        'signed_in_by',
        'coach_notes',
        'member_feedback',
        'rating',
        'lesson_deducted',
        'deducted_by',
        'deducted_at',
    ];

    protected $casts = [
        'signed_in_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'deducted_at' => 'datetime',
        'is_coach_signed' => 'boolean',
        'needs_review' => 'boolean',
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

    public function coach()
    {
        return $this->belongsTo(Coach::class);
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function signedInBy()
    {
        return $this->belongsTo(User::class, 'signed_in_by');
    }

    public function revenueLog()
    {
        return $this->hasOne(CoachRevenueLog::class);
    }

    public function coachSign($coachUserId)
    {
        $this->status = AttendanceStatus::REVIEW_PENDING->value;
        $this->is_coach_signed = true;
        $this->needs_review = true;
        $this->signed_in_at = now();
        $this->signed_in_by = $coachUserId;
        $this->save();
    }

    public function approveReview($supervisorId, $notes = null)
    {
        $this->status = AttendanceStatus::REVIEW_APPROVED->value;
        $this->review_notes = $notes;
        $this->reviewed_by = $supervisorId;
        $this->reviewed_at = now();
        $this->save();

        $this->deductLesson($supervisorId);
    }

    public function rejectReview($supervisorId, $notes = null)
    {
        $this->status = AttendanceStatus::REVIEW_REJECTED->value;
        $this->review_notes = $notes;
        $this->reviewed_by = $supervisorId;
        $this->reviewed_at = now();
        $this->save();
    }

    public function deductLesson($userId)
    {
        if ($this->lesson_deducted) {
            return;
        }

        if ($this->booking->package) {
            $this->booking->package->deductLesson();
        }
        $this->member->deductLesson();

        $this->lesson_deducted = true;
        $this->deducted_by = $userId;
        $this->deducted_at = now();
        $this->save();

        $this->coach->incrementLessonCount();
    }
}
