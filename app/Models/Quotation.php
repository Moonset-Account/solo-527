<?php

namespace App\Models;

use App\Enums\QuotationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Quotation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'quotation_number',
        'purchase_request_id',
        'supplier_id',
        'title',
        'status',
        'total_amount',
        'tax_amount',
        'discount_amount',
        'final_amount',
        'currency',
        'valid_until',
        'payment_terms',
        'delivery_days',
        'delivery_terms',
        'warranty_terms',
        'remark',
        'rejection_reason',
        'submitted_at',
        'reviewed_at',
        'approved_at',
        'expires_at',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => QuotationStatus::class,
            'total_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'final_amount' => 'decimal:2',
            'valid_until' => 'date',
            'delivery_days' => 'integer',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'approved_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(QuotationItem::class);
    }

    public function approvalRecords()
    {
        return $this->hasMany(ApprovalRecord::class);
    }

    public function financialReview()
    {
        return $this->hasOne(FinancialReview::class);
    }

    public function deliveryConfirmations()
    {
        return $this->hasMany(DeliveryConfirmation::class);
    }

    public function expiryReminders()
    {
        return $this->hasMany(QuotationExpiryReminder::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopeBySupplier($query, int $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    public function scopeByPurchaseRequest($query, int $prId)
    {
        return $query->where('purchase_request_id', $prId);
    }

    public function scopeByStatus($query, QuotationStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopeExpiring($query, int $days = 7)
    {
        return $query->where('status', QuotationStatus::SUBMITTED)
            ->whereBetween('expires_at', [now(), now()->addDays($days)]);
    }

    public function scopeExpired($query)
    {
        return $query->where('status', QuotationStatus::SUBMITTED)
            ->where('expires_at', '<', now());
    }

    public function isDraft(): bool
    {
        return $this->status === QuotationStatus::DRAFT;
    }

    public function isSubmitted(): bool
    {
        return $this->status === QuotationStatus::SUBMITTED;
    }

    public function isApproved(): bool
    {
        return $this->status === QuotationStatus::APPROVED;
    }

    public function isSelected(): bool
    {
        return $this->status === QuotationStatus::SELECTED;
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function canEdit(): bool
    {
        return in_array($this->status, [
            QuotationStatus::DRAFT,
            QuotationStatus::REJECTED,
        ]);
    }

    public function canSubmit(): bool
    {
        return $this->status === QuotationStatus::DRAFT &&
            $this->items()->count() > 0 &&
            $this->supplier_id !== null;
    }

    public function calculateTotal(): array
    {
        $subtotal = $this->items->sum('total_price');
        $tax = $this->tax_amount ?? 0;
        $discount = $this->discount_amount ?? 0;

        return [
            'subtotal' => $subtotal,
            'tax' => $tax,
            'discount' => $discount,
            'final' => $subtotal + $tax - $discount,
        ];
    }

    public function updateAmounts(): void
    {
        $totals = $this->calculateTotal();
        $this->total_amount = $totals['subtotal'];
        $this->final_amount = $totals['final'];
        $this->save();
    }

    public function generateQuotationNumber(): string
    {
        $date = now()->format('Ymd');
        $prefix = 'Q';
        $last = self::where('quotation_number', 'like', "{$prefix}{$date}%")
            ->withTrashed()
            ->latest('id')
            ->first();

        $sequence = $last ? (int) substr($last->quotation_number, -4) + 1 : 1;

        return "{$prefix}{$date}" . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
