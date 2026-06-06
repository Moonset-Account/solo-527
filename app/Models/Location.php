<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Location extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'zone',
        'aisle',
        'shelf',
        'level',
        'position',
        'type',
        'capacity',
        'capacity_unit',
        'is_active',
        'remarks',
    ];

    protected $casts = [
        'capacity' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }

    public function pickingItems()
    {
        return $this->hasMany(PickingItem::class);
    }

    public function getUsedCapacityAttribute()
    {
        return $this->inventories()->sum('quantity');
    }

    public function getAvailableCapacityAttribute()
    {
        if (!$this->capacity) {
            return null;
        }
        return max(0, $this->capacity - $this->used_capacity);
    }

    public function getUtilizationRateAttribute()
    {
        if (!$this->capacity || $this->capacity == 0) {
            return 0;
        }
        return round(($this->used_capacity / $this->capacity) * 100, 2);
    }
}
