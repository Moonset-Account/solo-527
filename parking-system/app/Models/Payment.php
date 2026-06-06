<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Payment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'transaction_no', 'booking_id', 'user_id', 'amount', 'type',
        'method', 'status', 'third_party_no', 'callback_data', 'paid_at', 'remark'
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
            'callback_data' => 'array',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($payment) {
            if (empty($payment->transaction_no)) {
                $payment->transaction_no = 'TX' . date('YmdHis') . Str::random(12);
            }
        });
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function isSuccessful(): bool
    {
        return $this->status === 'success';
    }

    public function isRefunded(): bool
    {
        return in_array($this->status, ['refunded', 'partial_refund']);
    }
}
