<?php

namespace App\Models;

use App\Enums\ApprovalStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FinancialReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'entity_type',
        'entity_id',
        'entity_code',
        'total_amount',
        'budget_amount',
        'available_budget',
        'budget_type',
        'budget_code',
        'review_points',
        'review_comments',
        'status',
        'reviewer_id',
        'reviewer_name',
        'reviewed_at',
        'reject_reason',
        'is_within_budget',
        'requires_additional_approval',
        'attachments',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'budget_amount' => 'decimal:2',
            'available_budget' => 'decimal:2',
            'status' => 'string',
            'is_within_budget' => 'boolean',
            'requires_additional_approval' => 'boolean',
            'attachments' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function deliveryDiscrepancies()
    {
        return DeliveryDiscrepancy::where('entity_type', $this->entity_type)
            ->where('entity_id', $this->entity_id)
            ->get();
    }

    public function scopeByReviewer($query, int $reviewerId)
    {
        return $query->where('reviewer_id', $reviewerId);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function approve(User $reviewer, string $comments = ''): bool
    {
        $this->reviewer_id = $reviewer->id;
        $this->reviewer_name = $reviewer->name;
        $this->status = 'approved';
        if ($comments) {
            $this->review_comments = $comments;
        }
        $this->reviewed_at = now();
        return $this->save();
    }

    public function reject(User $reviewer, string $reason): bool
    {
        $this->reviewer_id = $reviewer->id;
        $this->reviewer_name = $reviewer->name;
        $this->status = 'rejected';
        $this->reject_reason = $reason;
        $this->reviewed_at = now();
        return $this->save();
    }
}
