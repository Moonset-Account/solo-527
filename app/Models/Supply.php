<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supply extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'category_id',
        'specification',
        'unit',
        'brand',
        'min_stock',
        'max_stock',
        'current_stock',
        'reference_price',
        'storage_location',
        'remark',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'min_stock' => 'decimal:2',
            'max_stock' => 'decimal:2',
            'current_stock' => 'decimal:2',
            'reference_price' => 'decimal:2',
        ];
    }

    public function category()
    {
        return $this->belongsTo(SupplyCategory::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function purchaseRequestItems()
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }

    public function quotationItems()
    {
        return $this->hasMany(QuotationItem::class);
    }

    public function priceHistories()
    {
        return $this->hasMany(PriceHistory::class);
    }

    public function monthlyUsages()
    {
        return $this->hasMany(SupplyMonthlyUsage::class);
    }

    public function specAttachments()
    {
        return $this->hasMany(SupplySpecAttachment::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('current_stock', '<=', 'min_stock');
    }

    public function isLowStock(): bool
    {
        return $this->current_stock <= $this->min_stock;
    }

    public function updateStock(float $quantity, string $operation = 'add'): void
    {
        if ($operation === 'add') {
            $this->current_stock += $quantity;
        } else {
            $this->current_stock -= $quantity;
        }
        $this->save();
    }
}
