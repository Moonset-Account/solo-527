<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Booking extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'booking_no', 'spot_id', 'visitor_id', 'availability_id',
        'license_plate', 'start_time', 'end_time', 'total_amount',
        'owner_earning', 'platform_fee', 'refund_amount', 'cancel_reason',
        'status', 'is_locked', 'locked_at', 'lock_expires_at', 'lock_key',
        'cross_midnight', 'manual_intervention_count', 'remark'
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'total_amount' => 'decimal:2',
            'owner_earning' => 'decimal:2',
            'platform_fee' => 'decimal:2',
            'refund_amount' => 'decimal:2',
            'is_locked' => 'boolean',
            'locked_at' => 'datetime',
            'cross_midnight' => 'boolean',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($booking) {
            if (empty($booking->booking_no)) {
                $booking->booking_no = 'BK' . date('YmdHis') . Str::random(8);
            }
        });
    }

    public function spot(): BelongsTo
    {
        return $this->belongsTo(ParkingSpot::class, 'spot_id');
    }

    public function visitor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'visitor_id');
    }

    public function availability(): BelongsTo
    {
        return $this->belongsTo(SpotAvailability::class, 'availability_id');
    }

    public function dailySplits(): HasMany
    {
        return $this->hasMany(BookingDailySplit::class, 'booking_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'booking_id');
    }

    public function entryRecords(): HasMany
    {
        return $this->hasMany(EntryRecord::class, 'booking_id');
    }

    public function violation(): HasMany
    {
        return $this->hasMany(ParkingViolation::class, 'booking_id');
    }

    public function settlementItems(): HasMany
    {
        return $this->hasMany(SettlementItem::class, 'booking_id');
    }

    public function getDurationInMinutes(): int
    {
        return $this->start_time->diffInMinutes($this->end_time);
    }

    public function isCrossMidnight(): bool
    {
        return $this->start_time->toDateString() !== $this->end_time->toDateString();
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['pending', 'confirmed', 'paid']);
    }

    public function incrementManualIntervention(): void
    {
        $this->increment('manual_intervention_count');
    }
}
