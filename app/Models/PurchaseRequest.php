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
        'pr_number',
        'title',
        'description',
        'requester_id',
        'department',
        'approval_flow_id',
        'current_step_id',
        'status',
        'priority',
        'total_amount',
        'currency',
        'expected_date',
        'reason',
        'is_urgent',
        'rejection_reason',
        'cancellation_reason',
        'submitted_at',
        'approved_at',
        'completed_at',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => PurchaseRequestStatus::class,
            'is_urgent' => 'boolean',
            'total_amount' => 'decimal:2',
            'priority' => 'integer',
            'expected_date' => 'date',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function approvalFlow()
    {
        return $this->belongsTo(ApprovalFlow::class);
    }

    public function currentStep()
    {
        return $this->belongsTo(ApprovalFlowStep::class, 'current_step_id');
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
        return $this->hasMany(Quotation::class);
    }

    public function deliveryConfirmations()
    {
        return $this->hasMany(DeliveryConfirmation::class);
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

    public function scopeByStatus($query, PurchaseRequestStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByDepartment($query, string $department)
    {
        return $query->where('department', $department);
    }

    public function scopeUrgent($query)
    {
        return $query->where('is_urgent', true);
    }

    public function scopePendingApproval($query)
    {
        return $query->where('status', PurchaseRequestStatus::PENDING_APPROVAL);
    }

    public function isDraft(): bool
    {
        return $this->status === PurchaseRequestStatus::DRAFT;
    }

    public function isSubmitted(): bool
    {
        return $this->status === PurchaseRequestStatus::SUBMITTED;
    }

    public function isPendingApproval(): bool
    {
        return $this->status === PurchaseRequestStatus::PENDING_APPROVAL;
    }

    public function isApproved(): bool
    {
        return $this->status === PurchaseRequestStatus::APPROVED;
    }

    public function isRejected(): bool
    {
        return $this->status === PurchaseRequestStatus::REJECTED;
    }

    public function isCompleted(): bool
    {
        return $this->status === PurchaseRequestStatus::COMPLETED;
    }

    public function canEdit(): bool
    {
        return in_array($this->status, [
            PurchaseRequestStatus::DRAFT,
            PurchaseRequestStatus::REJECTED,
        ]);
    }

    public function canSubmit(): bool
    {
        return $this->status === PurchaseRequestStatus::DRAFT && $this->items()->count() > 0;
    }

    public function canCancel(): bool
    {
        return in_array($this->status, [
            PurchaseRequestStatus::DRAFT,
            PurchaseRequestStatus::SUBMITTED,
            PurchaseRequestStatus::PENDING_APPROVAL,
        ]);
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

    public function generatePrNumber(): string
    {
        $date = now()->format('Ymd');
        $prefix = 'PR';
        $last = self::where('pr_number', 'like', "{$prefix}{$date}%")
            ->withTrashed()
            ->latest('id')
            ->first();

        $sequence = $last ? (int) substr($last->pr_number, -4) + 1 : 1;

        return "{$prefix}{$date}" . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
