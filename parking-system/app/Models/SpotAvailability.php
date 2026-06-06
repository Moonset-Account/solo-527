<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SpotAvailability extends Model
{
    use SoftDeletes;

    protected $table = 'spot_availability';

    protected $fillable = [
        'spot_id', 'start_time', 'end_time', 'custom_rate',
        'status', 'is_recurring', 'recurring_pattern'
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'custom_rate' => 'decimal:2',
            'is_recurring' => 'boolean',
        ];
    }

    public function spot(): BelongsTo
    {
        return $this->belongsTo(ParkingSpot::class, 'spot_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'availability_id');
    }
}
