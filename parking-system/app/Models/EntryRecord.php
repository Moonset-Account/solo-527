<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EntryRecord extends Model
{
    protected $fillable = [
        'booking_id', 'spot_id', 'license_plate', 'type', 'occurred_at',
        'recognition_method', 'operator_id', 'device_id', 'image_url',
        'recognition_confidence', 'is_manual_release', 'release_reason', 'remark'
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'recognition_confidence' => 'decimal:2',
            'is_manual_release' => 'boolean',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function spot(): BelongsTo
    {
        return $this->belongsTo(ParkingSpot::class, 'spot_id');
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    public function isEntry(): bool
    {
        return $this->type === 'entry';
    }

    public function isExit(): bool
    {
        return $this->type === 'exit';
    }

    public function isManual(): bool
    {
        return in_array($this->recognition_method, ['manual', 'corrected']);
    }
}
