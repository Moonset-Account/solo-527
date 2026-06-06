<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SettlementItem extends Model
{
    protected $fillable = [
        'settlement_id', 'booking_id', 'violation_id', 'type',
        'amount', 'owner_share', 'platform_share', 'description'
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'owner_share' => 'decimal:2',
            'platform_share' => 'decimal:2',
        ];
    }

    public function settlement(): BelongsTo
    {
        return $this->belongsTo(Settlement::class, 'settlement_id');
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function violation(): BelongsTo
    {
        return $this->belongsTo(ParkingViolation::class, 'violation_id');
    }
}
