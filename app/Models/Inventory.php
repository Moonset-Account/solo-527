<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Inventory extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id',
        'location_id',
        'quantity',
        'locked_quantity',
        'available_quantity',
        'unit_cost',
        'production_date',
        'expiry_date',
        'batch_no',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
        'production_date' => 'date',
        'expiry_date' => 'date',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function locks()
    {
        return $this->hasMany(InventoryLock::class);
    }

    public function getIsExpiredAttribute()
    {
        return $this->expiry_date && $this->expiry_date < now()->toDateString();
    }

    public function getIsNearExpiryAttribute()
    {
        if (!$this->expiry_date) {
            return false;
        }
        return $this->expiry_date < now()->addDays(30)->toDateString();
    }

    public function lock($quantity, $orderId = null, $orderItemId = null, $expiresAt = null)
    {
        if ($quantity > $this->available_quantity) {
            throw new \Exception('库存不足');
        }

        $lock = InventoryLock::create([
            'lock_no' => 'LK' . date('YmdHis') . rand(1000, 9999),
            'inventory_id' => $this->id,
            'order_id' => $orderId,
            'order_item_id' => $orderItemId,
            'quantity' => $quantity,
            'status' => 'locked',
            'expires_at' => $expiresAt ?? now()->addHours(24),
        ]);

        $this->locked_quantity += $quantity;
        $this->available_quantity = $this->quantity - $this->locked_quantity;
        $this->save();

        return $lock;
    }

    public function releaseLock($quantity)
    {
        $this->locked_quantity = max(0, $this->locked_quantity - $quantity);
        $this->available_quantity = $this->quantity - $this->locked_quantity;
        $this->save();
    }

    public function consumeLocked($quantity)
    {
        if ($quantity > $this->locked_quantity) {
            throw new \Exception('锁定库存不足');
        }

        $this->quantity -= $quantity;
        $this->locked_quantity -= $quantity;
        $this->available_quantity = $this->quantity - $this->locked_quantity;
        $this->save();
    }

    public function addStock($quantity, $unitCost = null)
    {
        $this->quantity += $quantity;
        $this->available_quantity = $this->quantity - $this->locked_quantity;
        if ($unitCost !== null) {
            $this->unit_cost = $unitCost;
        }
        $this->save();
    }
}
