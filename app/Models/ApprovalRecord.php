<?php

namespace App\Models;

use App\Enums\ApprovalStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApprovalRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_request_id',
        'quotation_id',
        'step_id',
        'approver_id',
        'delegated_from_id',
        'status',
        'comment',
        'approved_at',
        'rejected_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ApprovalStatus::class,
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function quotation()
    {
        return $this->belongsTo(Quotation::class);
    }

    public function step()
    {
        return $this->belongsTo(ApprovalFlowStep::class, 'step_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function delegatedFrom()
    {
        return $this->belongsTo(User::class, 'delegated_from_id');
    }

    public function scopeByApprover($query, int $userId)
    {
        return $query->where('approver_id', $userId);
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

    public function approve(string $comment = ''): bool
    {
        $this->status = ApprovalStatus::APPROVED;
        $this->comment = $comment;
        $this->approved_at = now();
        return $this->save();
    }

    public function reject(string $comment = ''): bool
    {
        $this->status = ApprovalStatus::REJECTED;
        $this->comment = $comment;
        $this->rejected_at = now();
        return $this->save();
    }
}
