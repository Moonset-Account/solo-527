<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingDailySplit extends Model
{
    protected $fillable = [
        'booking_id', 'split_date', 'segment_start', 'segment_end',
        'duration_minutes', 'segment_amount', 'owner_share', 'platform_share'
    ];

    protected function casts(): array
    {
        return [
            'split_date' => 'date',
            'segment_start' => 'datetime',
            'segment_end' => 'datetime',
            'segment_amount' => 'decimal:2',
            'owner_share' => 'decimal:2',
            'platform_share' => 'decimal:2',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }
}
