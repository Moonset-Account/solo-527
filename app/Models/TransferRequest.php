<?php

namespace App\Models;

use App\Enums\TransferStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TransferRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'member_id',
        'from_coach_id',
        'to_coach_id',
        'course_type_id',
        'lessons_count',
        'reason',
        'status',
        'review_notes',
        'reviewed_by',
        'reviewed_at',
        'submitted_by',
        'withdrawn_at',
        'withdrawn_by',
        'coach_adjusted',
        'store_revenue_adjusted',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
        'withdrawn_at' => 'datetime',
        'coach_adjusted' => 'boolean',
        'store_revenue_adjusted' => 'boolean',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function fromCoach()
    {
        return $this->belongsTo(Coach::class, 'from_coach_id');
    }

    public function toCoach()
    {
        return $this->belongsTo(Coach::class, 'to_coach_id');
    }

    public function courseType()
    {
        return $this->belongsTo(CourseType::class);
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
        $this->status = TransferStatus::APPROVED->value;
        $this->review_notes = $notes;
        $this->reviewed_by = $reviewerId;
        $this->reviewed_at = now();
        $this->save();

        $this->adjustCoachHours();
        $this->adjustStoreRevenue();
    }

    public function reject($reviewerId, $notes = null)
    {
        $this->status = TransferStatus::REJECTED->value;
        $this->review_notes = $notes;
        $this->reviewed_by = $reviewerId;
        $this->reviewed_at = now();
        $this->save();
    }

    public function withdraw($userId)
    {
        $this->status = TransferStatus::WITHDRAWN->value;
        $this->withdrawn_by = $userId;
        $this->withdrawn_at = now();
        $this->save();
    }

    protected function adjustCoachHours()
    {
        $courseType = $this->courseType;
        $commissionPerLesson = $courseType->coach_commission;

        CoachRevenueLog::create([
            'coach_id' => $this->from_coach_id,
            'transfer_request_id' => $this->id,
            'type' => 'transfer_out',
            'amount' => -($commissionPerLesson * $this->lessons_count),
            'description' => "转课转出 - {$this->lessons_count}课时",
            'created_by' => $this->reviewed_by,
        ]);

        CoachRevenueLog::create([
            'coach_id' => $this->to_coach_id,
            'transfer_request_id' => $this->id,
            'type' => 'transfer_in',
            'amount' => $commissionPerLesson * $this->lessons_count,
            'description' => "转课转入 - {$this->lessons_count}课时",
            'created_by' => $this->reviewed_by,
        ]);

        $this->coach_adjusted = true;
        $this->save();
    }

    protected function adjustStoreRevenue()
    {
        StoreRevenueLog::create([
            'member_id' => $this->member_id,
            'transfer_request_id' => $this->id,
            'type' => 'transfer',
            'amount' => 0,
            'description' => "会员转课 - 从教练{$this->fromCoach->user->name}转到教练{$this->toCoach->user->name}，共{$this->lessons_count}课时",
            'created_by' => $this->reviewed_by,
        ]);

        $this->store_revenue_adjusted = true;
        $this->save();
    }
}
