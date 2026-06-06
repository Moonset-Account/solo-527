<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryLock extends Model
{
    protected $fillable = [
        'lock_no',
        'inventory_id',
        'order_id',
        'order_item_id',
        'quantity',
        'status',
        'expires_at',
        'remarks',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function release()
    {
        if ($this->status !== 'locked') {
            return false;
        }

        $this->inventory->releaseLock($this->quantity);
        $this->status = 'released';
        $this->save();

        return true;
    }

    public function consume()
    {
        if ($this->status !== 'locked') {
            return false;
        }

        $this->inventory->consumeLocked($this->quantity);
        $this->status = 'consumed';
        $this->save();

        return true;
    }

    public function getIsExpiredAttribute()
    {
        return $this->expires_at && $this->expires_at < now();
    }
}
