<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Payment extends Model
{
    use HasFactory;

    const STATUS_PENDING = 'pending';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    const STATUS_REFUNDED = 'refunded';

    const TYPE_DEPOSIT = 'deposit';
    const TYPE_BALANCE = 'balance';
    const TYPE_FULL = 'full';

    protected $fillable = [
        'order_id',
        'transaction_id',
        'amount',
        'type',
        'method',
        'status',
        'notes',
        'processed_by',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function refunds()
    {
        return $this->hasMany(Refund::class);
    }
}
