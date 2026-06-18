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
        'code',
        'request_id',
        'supplier_id',
        'supplier_name',
        'supplier_contact',
        'supplier_phone',
        'contact_id',
        'contact_name',
        'quotation_date',
        'valid_until',
        'payment_terms',
        'delivery_terms',
        'delivery_days',
        'delivery_address',
        'tax_rate',
        'subtotal_amount',
        'tax_amount',
        'total_amount',
        'remark',
        'status',
        'is_selected',
        'flow_id',
        'is_expiry_reminded',
        'approved_by',
        'approved_at',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_selected' => 'boolean',
            'is_expiry_reminded' => 'boolean',
            'total_amount' => 'decimal:2',
            'subtotal_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'quotation_date' => 'date',
            'valid_until' => 'date',
            'approved_at' => 'datetime',
            'delivery_days' => 'integer',
        ];
    }

    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class, 'request_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function contact()
    {
        return $this->belongsTo(User::class, 'contact_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items()
    {
        return $this->hasMany(QuotationItem::class);
    }

    public function approvalRecords()
    {
        return $this->hasMany(ApprovalRecord::class);
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
        return $query->where('request_id', $prId);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', is_string($status) ? $status : $status->value);
    }

    public function scopeExpiring($query, int $days = 7)
    {
        return $query->whereIn('status', ['draft', 'submitted', 'approved'])
            ->whereBetween('valid_until', [now(), now()->addDays($days)]);
    }

    public function scopeExpired($query)
    {
        return $query->whereIn('status', ['draft', 'submitted', 'approved'])
            ->where('valid_until', '<', now());
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isSelected(): bool
    {
        return $this->is_selected;
    }

    public function isExpired(): bool
    {
        return $this->valid_until && strtotime($this->valid_until) < time();
    }

    public function canEdit(): bool
    {
        return in_array($this->status, ['draft', 'rejected']);
    }

    public function canSubmit(): bool
    {
        return $this->status === 'draft' &&
            $this->items()->count() > 0 &&
            $this->supplier_id !== null;
    }

    public function calculateTotals(): array
    {
        $subtotal = $this->items->sum('amount');
        $tax = $this->tax_rate ? $subtotal * ($this->tax_rate / 100) : 0;

        return [
            'subtotal_amount' => $subtotal,
            'tax_amount' => $tax,
            'total_amount' => $subtotal + $tax,
        ];
    }

    public function updateAmounts(): void
    {
        $totals = $this->calculateTotals();
        $this->subtotal_amount = $totals['subtotal_amount'];
        $this->tax_amount = $totals['tax_amount'];
        $this->total_amount = $totals['total_amount'];
        $this->save();
    }

    public function generateCode(): string
    {
        $date = now()->format('Ymd');
        $prefix = 'Q';
        $last = self::where('code', 'like', "{$prefix}{$date}%")
            ->withTrashed()
            ->latest('id')
            ->first();

        $sequence = $last ? (int) substr($last->code, -4) + 1 : 1;

        return "{$prefix}{$date}" . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
