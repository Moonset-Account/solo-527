<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class WriteOff extends Model
{
    use HasFactory, SoftDeletes;

    const APPROVAL_STATUS_PENDING = 'pending';
    const APPROVAL_STATUS_APPROVED = 'approved';
    const APPROVAL_STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'reconciliation_difference_id',
        'amount',
        'reason',
        'approval_status',
        'approved_by',
        'approved_at',
        'approval_remarks',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'approved_at' => 'date',
    ];

    public function reconciliationDifference()
    {
        return $this->belongsTo(ReconciliationDifference::class);
    }

    public function scopeApprovalStatus($query, $status)
    {
        return $query->where('approval_status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('approval_status', self::APPROVAL_STATUS_PENDING);
    }

    public function scopeApproved($query)
    {
        return $query->where('approval_status', self::APPROVAL_STATUS_APPROVED);
    }

    public function scopeRejected($query)
    {
        return $query->where('approval_status', self::APPROVAL_STATUS_REJECTED);
    }

    public function scopeByApprover($query, $approver)
    {
        return $query->where('approved_by', $approver);
    }

    public function scopeDifference($query, $differenceId)
    {
        return $query->where('reconciliation_difference_id', $differenceId);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('approved_at', [$startDate, $endDate]);
    }

    protected function formattedAmount(): Attribute
    {
        return Attribute::make(
            get: fn () => number_format($this->amount, 2, '.', ','),
        );
    }

    protected function isPending(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->approval_status === self::APPROVAL_STATUS_PENDING,
        );
    }

    protected function isApproved(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->approval_status === self::APPROVAL_STATUS_APPROVED,
        );
    }

    protected function isRejected(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->approval_status === self::APPROVAL_STATUS_REJECTED,
        );
    }

    protected function approvalStatusLabel(): Attribute
    {
        return Attribute::make(
            get: function () {
                $labels = [
                    self::APPROVAL_STATUS_PENDING => '待审批',
                    self::APPROVAL_STATUS_APPROVED => '已通过',
                    self::APPROVAL_STATUS_REJECTED => '已拒绝',
                ];
                return $labels[$this->approval_status] ?? $this->approval_status;
            },
        );
    }

    protected function relatedProjectName(): Attribute
    {
        return Attribute::make(
            get: fn () => optional(optional($this->reconciliationDifference)->reconciliationItem)->project->name,
        );
    }

    protected function relatedCustomer(): Attribute
    {
        return Attribute::make(
            get: fn () => optional(optional($this->reconciliationDifference)->reconciliationItem)->project->customer,
        );
    }
}
