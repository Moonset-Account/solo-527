<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'quantity',
        'picked_quantity',
        'shipped_quantity',
        'returned_quantity',
        'unit_price',
        'total_price',
        'cost_price',
        'status',
        'remarks',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_PICKING = 'picking';
    const STATUS_PICKED = 'picked';
    const STATUS_SHIPPED = 'shipped';
    const STATUS_COMPLETED = 'completed';
    const STATUS_RETURNED = 'returned';
    const STATUS_CANCELLED = 'cancelled';

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function pickingItems()
    {
        return $this->hasMany(PickingItem::class);
    }

    public function inventoryLocks()
    {
        return $this->hasMany(InventoryLock::class);
    }

    public function returnItems()
    {
        return $this->hasMany(ReturnItem::class);
    }

    public function getStatusTextAttribute()
    {
        $statusMap = [
            self::STATUS_PENDING => '待处理',
            self::STATUS_PICKING => '拣货中',
            self::STATUS_PICKED => '已拣货',
            self::STATUS_SHIPPED => '已发货',
            self::STATUS_COMPLETED => '已完成',
            self::STATUS_RETURNED => '已退货',
            self::STATUS_CANCELLED => '已取消',
        ];
        return $statusMap[$this->status] ?? $this->status;
    }

    public function getRemainingToPickAttribute()
    {
        return max(0, $this->quantity - $this->picked_quantity);
    }

    public function getRemainingToShipAttribute()
    {
        return max(0, $this->picked_quantity - $this->shipped_quantity);
    }

    public function getCanReturnQuantityAttribute()
    {
        $maxReturnable = max($this->quantity, $this->shipped_quantity, $this->picked_quantity);
        return max(0, $maxReturnable - $this->returned_quantity);
    }
}
