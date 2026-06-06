<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Settlement extends Model
{
    protected $fillable = [
        'settlement_no', 'owner_id', 'period_start', 'period_end',
        'total_booking_amount', 'total_owner_earning', 'total_platform_fee',
        'total_refund', 'total_fine_income', 'net_settlement', 'total_bookings',
        'manual_intervention_count', 'status', 'settled_at', 'remark'
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'total_booking_amount' => 'decimal:2',
            'total_owner_earning' => 'decimal:2',
            'total_platform_fee' => 'decimal:2',
            'total_refund' => 'decimal:2',
            'total_fine_income' => 'decimal:2',
            'net_settlement' => 'decimal:2',
            'settled_at' => 'datetime',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($settlement) {
            if (empty($settlement->settlement_no)) {
                $settlement->settlement_no = 'ST' . date('YmdHis') . Str::random(8);
            }
        });
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SettlementItem::class, 'settlement_id');
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }
}
