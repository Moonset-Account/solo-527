<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PickupSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'start_time',
        'end_time',
        'max_orders',
        'current_orders',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function getIsFullAttribute()
    {
        return $this->current_orders >= $this->max_orders;
    }

    public function getAvailableSlotsAttribute()
    {
        return max(0, $this->max_orders - $this->current_orders);
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_active', true)
            ->whereColumn('current_orders', '<', 'max_orders');
    }

    public function scopeUpcoming($query)
    {
        return $query->where('date', '>=', now()->toDateString());
    }
}
