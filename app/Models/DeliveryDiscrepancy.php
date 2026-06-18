<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryDiscrepancy extends Model
{
    use HasFactory;

    protected $fillable = [
        'delivery_confirmation_id',
        'quotation_item_id',
        'supply_id',
        'expected_quantity',
        'received_quantity',
        'difference_quantity',
        'discrepancy_type',
        'description',
        'resolution',
        'resolved_at',
        'resolved_by',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'expected_quantity' => 'decimal:2',
            'received_quantity' => 'decimal:2',
            'difference_quantity' => 'decimal:2',
            'resolved_at' => 'datetime',
        ];
    }

    public function deliveryConfirmation()
    {
        return $this->belongsTo(DeliveryConfirmation::class);
    }

    public function quotationItem()
    {
        return $this->belongsTo(QuotationItem::class);
    }

    public function supply()
    {
        return $this->belongsTo(Supply::class);
    }

    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function scopeUnresolved($query)
    {
        return $query->whereNull('resolved_at');
    }

    public function scopeResolved($query)
    {
        return $query->whereNotNull('resolved_at');
    }

    public function isQuantityIssue(): bool
    {
        return in_array($this->discrepancy_type, ['shortage', 'overage', 'wrong_quantity']);
    }

    public function isQualityIssue(): bool
    {
        return in_array($this->discrepancy_type, ['damaged', 'defective', 'wrong_item', 'wrong_spec']);
    }

    public function calculateDifference(): float
    {
        return $this->received_quantity - $this->expected_quantity;
    }

    public function isResolved(): bool
    {
        return $this->resolved_at !== null;
    }

    public function resolve(User $resolver, string $resolution): bool
    {
        $this->resolution = $resolution;
        $this->resolved_by = $resolver->id;
        $this->resolved_at = now();
        $this->status = 'resolved';
        return $this->save();
    }
}
