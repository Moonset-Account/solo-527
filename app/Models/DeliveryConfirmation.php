<?php

namespace App\Models;

use App\Enums\DeliveryStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryConfirmation extends Model
{
    use HasFactory;

    protected $fillable = [
        'delivery_number',
        'purchase_request_id',
        'quotation_id',
        'supplier_id',
        'status',
        'tracking_number',
        'shipping_method',
        'estimated_delivery_date',
        'actual_delivery_date',
        'received_by',
        'received_at',
        'warehouse_location',
        'remark',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => DeliveryStatus::class,
            'estimated_delivery_date' => 'date',
            'actual_delivery_date' => 'date',
            'received_at' => 'datetime',
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

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function discrepancies()
    {
        return $this->hasMany(DeliveryDiscrepancy::class);
    }

    public function scopeByStatus($query, DeliveryStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopeBySupplier($query, int $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    public function isPending(): bool
    {
        return $this->status === DeliveryStatus::PENDING;
    }

    public function isDelivered(): bool
    {
        return $this->status === DeliveryStatus::DELIVERED;
    }

    public function isConfirmed(): bool
    {
        return $this->status === DeliveryStatus::CONFIRMED;
    }

    public function hasDiscrepancy(): bool
    {
        return $this->status === DeliveryStatus::DISCREPANCY || $this->discrepancies()->count() > 0;
    }

    public function confirm(User $receiver, string $remark = ''): bool
    {
        $this->status = DeliveryStatus::CONFIRMED;
        $this->received_by = $receiver->id;
        $this->received_at = now();
        if ($remark) {
            $this->remark = $remark;
        }
        return $this->save();
    }

    public function markDiscrepancy(): bool
    {
        $this->status = DeliveryStatus::DISCREPANCY;
        return $this->save();
    }

    public function generateDeliveryNumber(): string
    {
        $date = now()->format('Ymd');
        $prefix = 'DN';
        $last = self::where('delivery_number', 'like', "{$prefix}{$date}%")
            ->latest('id')
            ->first();

        $sequence = $last ? (int) substr($last->delivery_number, -4) + 1 : 1;

        return "{$prefix}{$date}" . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
