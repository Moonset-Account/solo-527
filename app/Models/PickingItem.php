<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PickingItem extends Model
{
    protected $fillable = [
        'picking_list_id',
        'order_item_id',
        'product_id',
        'location_id',
        'quantity',
        'picked_quantity',
        'status',
        'picked_at',
        'picked_by',
        'remarks',
    ];

    protected $casts = [
        'picked_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_PICKING = 'picking';
    const STATUS_PICKED = 'picked';
    const STATUS_SKIPPED = 'skipped';

    public function pickingList()
    {
        return $this->belongsTo(PickingList::class);
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function picker()
    {
        return $this->belongsTo(User::class, 'picked_by');
    }

    public function scans()
    {
        return $this->hasMany(PickingScan::class);
    }

    public function getStatusTextAttribute()
    {
        $statusMap = [
            self::STATUS_PENDING => '待拣',
            self::STATUS_PICKING => '拣货中',
            self::STATUS_PICKED => '已拣',
            self::STATUS_SKIPPED => '跳过',
        ];
        return $statusMap[$this->status] ?? $this->status;
    }

    public function getRemainingQuantityAttribute()
    {
        return max(0, $this->quantity - $this->picked_quantity);
    }

    public function getIsCompletedAttribute()
    {
        return $this->picked_quantity >= $this->quantity;
    }
}
