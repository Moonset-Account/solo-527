<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseRequestItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_request_id',
        'supply_id',
        'supply_name',
        'specification',
        'unit',
        'quantity',
        'estimated_price',
        'estimated_total',
        'purpose',
        'remark',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'estimated_price' => 'decimal:2',
            'estimated_total' => 'decimal:2',
        ];
    }

    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function supply()
    {
        return $this->belongsTo(Supply::class);
    }

    public function quotationItems()
    {
        return $this->hasMany(QuotationItem::class);
    }

    public function calculateEstimatedTotal(): float
    {
        return $this->quantity * $this->estimated_price;
    }

    protected static function booted()
    {
        static::saving(function ($item) {
            $item->estimated_total = $item->calculateEstimatedTotal();
        });

        static::saved(function ($item) {
            if ($item->purchaseRequest) {
                $item->purchaseRequest->updateTotalAmount();
            }
        });

        static::deleted(function ($item) {
            if ($item->purchaseRequest) {
                $item->purchaseRequest->updateTotalAmount();
            }
        });
    }
}
