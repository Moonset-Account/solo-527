<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApprovalRecord extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'entity_type',
        'entity_id',
        'flow_id',
        'flow_step_id',
        'step_order',
        'step_name',
        'approver_type',
        'approver_id',
        'approver_name',
        'status',
        'comment',
        'action_at',
        'ip_address',
        'user_agent',
        'transferred_to_id',
        'transferred_reason',
        'extra_data',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'step_order' => 'integer',
            'action_at' => 'datetime',
            'extra_data' => 'json',
        ];
    }

    public function entity()
    {
        return $this->morphTo(__FUNCTION__, 'entity_type', 'entity_id');
    }

    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class, 'entity_id')
            ->where('entity_type', 'purchase_request');
    }

    public function quotation()
    {
        return $this->belongsTo(Quotation::class, 'entity_id')
            ->where('entity_type', 'quotation');
    }

    public function flowStep()
    {
        return $this->belongsTo(ApprovalFlowStep::class, 'flow_step_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function transferredTo()
    {
        return $this->belongsTo(User::class, 'transferred_to_id');
    }

    public function scopeForEntity($query, string $entityType, int $entityId)
    {
        return $query->where('entity_type', $entityType)->where('entity_id', $entityId);
    }

    public function scopeByApprover($query, int $userId)
    {
        return $query->where('approver_id', $userId);
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

    public function approve(string $comment = ''): bool
    {
        $this->status = 'approved';
        $this->comment = $comment;
        $this->action_at = now();
        return $this->save();
    }

    public function reject(string $comment = ''): bool
    {
        $this->status = 'rejected';
        $this->comment = $comment;
        $this->action_at = now();
        return $this->save();
    }

    public function transfer(int $toUserId, string $reason = ''): bool
    {
        $this->status = 'transferred';
        $this->transferred_to_id = $toUserId;
        $this->transferred_reason = $reason;
        $this->action_at = now();
        return $this->save();
    }
}
