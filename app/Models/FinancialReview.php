<?php

namespace App\Models;

use App\Enums\ApprovalStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FinancialReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'quotation_id',
        'reviewer_id',
        'status',
        'review_notes',
        'budget_check',
        'price_comparison',
        'vendor_check',
        'risk_assessment',
        'recommended_amount',
        'final_decision',
        'reviewed_at',
        'approved_at',
        'rejected_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ApprovalStatus::class,
            'budget_check' => 'boolean',
            'price_comparison' => 'boolean',
            'vendor_check' => 'boolean',
            'recommended_amount' => 'decimal:2',
            'reviewed_at' => 'datetime',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    public function quotation()
    {
        return $this->belongsTo(Quotation::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function scopeByReviewer($query, int $reviewerId)
    {
        return $query->where('reviewer_id', $reviewerId);
    }

    public function scopeByStatus($query, ApprovalStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', ApprovalStatus::PENDING);
    }

    public function isPending(): bool
    {
        return $this->status === ApprovalStatus::PENDING;
    }

    public function isApproved(): bool
    {
        return $this->status === ApprovalStatus::APPROVED;
    }

    public function isRejected(): bool
    {
        return $this->status === ApprovalStatus::REJECTED;
    }

    public function allChecksPassed(): bool
    {
        return $this->budget_check && $this->price_comparison && $this->vendor_check;
    }

    public function approve(User $reviewer, string $notes = ''): bool
    {
        $this->reviewer_id = $reviewer->id;
        $this->status = ApprovalStatus::APPROVED;
        $this->final_decision = 'approved';
        if ($notes) {
            $this->review_notes = $notes;
        }
        $this->reviewed_at = now();
        $this->approved_at = now();
        return $this->save();
    }

    public function reject(User $reviewer, string $reason): bool
    {
        $this->reviewer_id = $reviewer->id;
        $this->status = ApprovalStatus::REJECTED;
        $this->final_decision = 'rejected';
        $this->review_notes = $reason;
        $this->reviewed_at = now();
        $this->rejected_at = now();
        return $this->save();
    }
}
