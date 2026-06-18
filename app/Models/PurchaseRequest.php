<?php

namespace App\Models;

use App\Enums\PurchaseRequestStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'title',
        'department',
        'requester_id',
        'requester_name',
        'request_date',
        'expected_date',
        'priority',
        'reason',
        'remark',
        'flow_id',
        'status',
        'current_step',
        'total_steps',
        'total_amount',
        'financial_review_id',
        'is_financial_reviewed',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'reject_reason',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_financial_reviewed' => 'boolean',
            'total_amount' => 'decimal:2',
            'request_date' => 'date',
            'expected_date' => 'date',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'current_step' => 'integer',
            'total_steps' => 'integer',
        ];
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejector()
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function approvalFlow()
    {
        return $this->belongsTo(ApprovalFlow::class, 'flow_id');
    }

    public function items()
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }

    public function approvalRecords()
    {
        return $this->hasMany(ApprovalRecord::class);
    }

    public function quotations()
    {
        return $this->hasMany(Quotation::class, 'request_id');
    }

    public function deliveryConfirmations()
    {
        return $this->hasMany(DeliveryConfirmation::class, 'request_id');
    }

    public function financialReview()
    {
        return $this->belongsTo(FinancialReview::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopeByRequester($query, int $userId)
    {
        return $query->where('requester_id', $userId);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', is_string($status) ? $status : $status->value);
    }

    public function scopeByDepartment($query, string $department)
    {
        return $query->where('department', $department);
    }

    public function scopeUrgent($query)
    {
        return $query->where('priority', 'urgent');
    }

    public function scopePendingApproval($query)
    {
        return $query->where('status', 'pending_approval');
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }

    public function isPendingApproval(): bool
    {
        return $this->status === 'pending_approval';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function canEdit(): bool
    {
        return in_array($this->status, ['draft', 'rejected']);
    }

    public function canSubmit(): bool
    {
        return $this->status === 'draft' && $this->items()->count() > 0;
    }

    public function canCancel(): bool
    {
        return in_array($this->status, ['draft', 'submitted', 'pending_approval']);
    }

    public function calculateTotalAmount(): float
    {
        return $this->items->sum(function ($item) {
            return $item->quantity * $item->estimated_price;
        });
    }

    public function updateTotalAmount(): void
    {
        $this->total_amount = $this->calculateTotalAmount();
        $this->save();
    }

    public function generateCode(): string
    {
        $date = now()->format('Ymd');
        $prefix = 'PR';
        $last = self::where('code', 'like', "{$prefix}{$date}%")
            ->withTrashed()
            ->latest('id')
            ->first();

        $sequence = $last ? (int) substr($last->code, -4) + 1 : 1;

        return "{$prefix}{$date}" . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
