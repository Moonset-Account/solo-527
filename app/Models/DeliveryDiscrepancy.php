<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryDiscrepancy extends Model
{
    use HasFactory;

    protected $fillable = [
        'delivery_id',
        'quotation_item_id',
        'supply_id',
        'supply_name',
        'specification',
        'unit',
        'discrepancy_type',
        'expected_quantity',
        'actual_quantity',
        'difference',
        'description',
        'severity',
        'status',
        'handling_measures',
        'resolution_result',
        'resolved_at',
        'handled_by',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'expected_quantity' => 'decimal:2',
            'actual_quantity' => 'decimal:2',
            'difference' => 'decimal:2',
            'resolved_at' => 'datetime',
        ];
    }

    public function deliveryConfirmation()
    {
        return $this->belongsTo(DeliveryConfirmation::class, 'delivery_id');
    }

    public function quotationItem()
    {
        return $this->belongsTo(QuotationItem::class);
    }

    public function supply()
    {
        return $this->belongsTo(Supply::class);
    }

    public function handler()
    {
        return $this->belongsTo(User::class, 'handled_by');
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('discrepancy_type', $type);
    }

    public function scopeUnresolved($query)
    {
        return $query->whereNull('resolved_at');
    }

    public function scopeResolved($query)
    {
        return $query->whereNotNull('resolved_at');
    }

    public function isResolved(): bool
    {
        return $this->resolved_at !== null;
    }

    public function resolve(User $resolver, string $resolution): bool
    {
        $this->handling_measures = $resolution;
        $this->resolution_result = $resolution;
        $this->handled_by = $resolver->id;
        $this->resolved_at = now();
        $this->status = 'resolved';
        return $this->save();
    }
}
