<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseRequestItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'request_id',
        'supply_id',
        'supply_code',
        'supply_name',
        'specification',
        'brand',
        'unit',
        'quantity',
        'reference_price',
        'estimated_price',
        'estimated_amount',
        'current_stock',
        'remark',
        'sort',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'reference_price' => 'decimal:2',
            'estimated_price' => 'decimal:2',
            'estimated_amount' => 'decimal:2',
            'current_stock' => 'decimal:2',
            'sort' => 'integer',
        ];
    }

    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class, 'request_id');
    }

    public function supply()
    {
        return $this->belongsTo(Supply::class);
    }

    public function quotationItems()
    {
        return $this->hasMany(QuotationItem::class, 'request_item_id');
    }

    public function calculateEstimatedAmount(): float
    {
        return ($this->quantity ?? 0) * ($this->estimated_price ?? 0);
    }

    protected static function booted()
    {
        static::saving(function ($item) {
            $item->estimated_amount = $item->calculateEstimatedAmount();
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
