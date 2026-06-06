<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ParkingViolation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'violation_no', 'booking_id', 'spot_id', 'license_plate', 'type',
        'violation_time', 'fine_amount', 'description', 'evidence_images',
        'status', 'has_appeal', 'appeal_lock_until', 'processed_by',
        'processed_at', 'process_remark'
    ];

    protected function casts(): array
    {
        return [
            'violation_time' => 'datetime',
            'fine_amount' => 'decimal:2',
            'evidence_images' => 'array',
            'has_appeal' => 'boolean',
            'appeal_lock_until' => 'datetime',
            'processed_at' => 'datetime',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($violation) {
            if (empty($violation->violation_no)) {
                $violation->violation_no = 'VL' . date('YmdHis') . Str::random(8);
            }
        });
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function spot(): BelongsTo
    {
        return $this->belongsTo(ParkingSpot::class, 'spot_id');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function appeals(): HasMany
    {
        return $this->hasMany(ViolationAppeal::class, 'violation_id');
    }

    public function isUnderAppealLock(): bool
    {
        if (!$this->has_appeal || !$this->appeal_lock_until) {
            return false;
        }
        return Carbon::now()->lt($this->appeal_lock_until);
    }

    public function canBeFinedAgain(): bool
    {
        return !$this->isUnderAppealLock();
    }
}
