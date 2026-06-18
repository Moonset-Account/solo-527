<?php

namespace App\Models;

use App\Enums\DeliveryStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryConfirmation extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'quotation_id',
        'request_id',
        'supplier_id',
        'supplier_name',
        'delivery_no',
        'logistics_company',
        'tracking_no',
        'delivery_time',
        'receiver_id',
        'receiver_name',
        'delivery_address',
        'inspector_name',
        'inspection_time',
        'inspection_result',
        'status',
        'total_quantity',
        'received_quantity',
        'total_amount',
        'remark',
        'has_discrepancy',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'delivery_time' => 'datetime',
            'inspection_time' => 'datetime',
            'total_quantity' => 'decimal:2',
            'received_quantity' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'has_discrepancy' => 'boolean',
        ];
    }

    public function quotation()
    {
        return $this->belongsTo(Quotation::class);
    }

    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class, 'request_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function confirmedBy()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function discrepancies()
    {
        return $this->hasMany(DeliveryDiscrepancy::class);
    }

    public function items()
    {
        return $this->hasMany(DeliveryItem::class);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeBySupplier($query, int $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }

    public function hasDiscrepancyRecord(): bool
    {
        return $this->has_discrepancy || $this->discrepancies()->count() > 0;
    }

    public function generateCode(): string
    {
        $date = now()->format('Ymd');
        $prefix = 'DN';
        $last = self::where('code', 'like', "{$prefix}{$date}%")
            ->latest('id')
            ->first();

        $sequence = $last ? (int) substr($last->code, -4) + 1 : 1;

        return "{$prefix}{$date}" . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
