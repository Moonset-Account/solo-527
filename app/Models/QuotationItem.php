<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuotationItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'quotation_id',
        'purchase_request_item_id',
        'supply_id',
        'supply_name',
        'specification',
        'unit',
        'quantity',
        'unit_price',
        'total_price',
        'tax_rate',
        'tax_amount',
        'discount_rate',
        'discount_amount',
        'brand',
        'origin',
        'delivery_days',
        'remark',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'discount_rate' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'delivery_days' => 'integer',
        ];
    }

    public function quotation()
    {
        return $this->belongsTo(Quotation::class);
    }

    public function purchaseRequestItem()
    {
        return $this->belongsTo(PurchaseRequestItem::class);
    }

    public function supply()
    {
        return $this->belongsTo(Supply::class);
    }

    public function calculateTotalPrice(): float
    {
        $base = $this->quantity * $this->unit_price;
        $discount = $this->discount_amount ?? ($base * ($this->discount_rate ?? 0) / 100);
        $tax = $this->tax_amount ?? (($base - $discount) * ($this->tax_rate ?? 0) / 100);

        return $base - $discount + $tax;
    }

    protected static function booted()
    {
        static::saving(function ($item) {
            $item->total_price = $item->calculateTotalPrice();
        });

        static::saved(function ($item) {
            if ($item->quotation) {
                $item->quotation->updateAmounts();
            }
        });

        static::deleted(function ($item) {
            if ($item->quotation) {
                $item->quotation->updateAmounts();
            }
        });
    }
}
