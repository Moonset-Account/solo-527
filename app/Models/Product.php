<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'sku',
        'barcode',
        'name',
        'description',
        'category',
        'brand',
        'unit',
        'specification',
        'cost_price',
        'standard_price',
        'wholesale_price',
        'weight',
        'volume',
        'warning_stock',
        'is_active',
        'remarks',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'standard_price' => 'decimal:2',
        'wholesale_price' => 'decimal:2',
        'weight' => 'decimal:2',
        'volume' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }

    public function priceLists()
    {
        return $this->hasMany(CustomerPriceList::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function pickingItems()
    {
        return $this->hasMany(PickingItem::class);
    }

    public function returnItems()
    {
        return $this->hasMany(ReturnItem::class);
    }

    public function getTotalStockAttribute()
    {
        return $this->inventories()->sum('quantity');
    }

    public function getTotalLockedStockAttribute()
    {
        return $this->inventories()->sum('locked_quantity');
    }

    public function getTotalAvailableStockAttribute()
    {
        return $this->inventories()->sum('available_quantity');
    }

    public function getIsLowStockAttribute()
    {
        return $this->total_available_stock <= $this->warning_stock;
    }
}
