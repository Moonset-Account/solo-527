<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ParkingSpot extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'owner_id', 'spot_number', 'location', 'hourly_rate',
        'daily_rate', 'description', 'status'
    ];

    protected function casts(): array
    {
        return [
            'hourly_rate' => 'decimal:2',
            'daily_rate' => 'decimal:2',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function availabilities(): HasMany
    {
        return $this->hasMany(SpotAvailability::class, 'spot_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'spot_id');
    }

    public function entryRecords(): HasMany
    {
        return $this->hasMany(EntryRecord::class, 'spot_id');
    }

    public function violations(): HasMany
    {
        return $this->hasMany(ParkingViolation::class, 'spot_id');
    }

    public function isAvailableDuring($startTime, $endTime, $excludeBookingId = null): bool
    {
        $query = Booking::where('spot_id', $this->id)
            ->whereNotIn('status', ['cancelled', 'refunded'])
            ->where(function ($q) use ($startTime, $endTime) {
                $q->whereBetween('start_time', [$startTime, $endTime])
                    ->orWhereBetween('end_time', [$startTime, $endTime])
                    ->orWhere(function ($q2) use ($startTime, $endTime) {
                        $q2->where('start_time', '<=', $startTime)
                            ->where('end_time', '>=', $endTime);
                    });
            });

        if ($excludeBookingId) {
            $query->where('id', '!=', $excludeBookingId);
        }

        return $query->count() === 0;
    }
}
