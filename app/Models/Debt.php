<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Debt extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'debt_no',
        'customer_id',
        'order_id',
        'amount',
        'paid_amount',
        'remaining_amount',
        'status',
        'due_date',
        'interest_rate',
        'remarks',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'due_date' => 'date',
        'interest_rate' => 'decimal:2',
    ];

    const STATUS_UNPAID = 'unpaid';
    const STATUS_PARTIAL = 'partial';
    const STATUS_PAID = 'paid';
    const STATUS_OVERDUE = 'overdue';

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function payments()
    {
        return $this->hasMany(DebtPayment::class);
    }

    public function getStatusTextAttribute()
    {
        $statusMap = [
            self::STATUS_UNPAID => '未还',
            self::STATUS_PARTIAL => '部分还',
            self::STATUS_PAID => '已还清',
            self::STATUS_OVERDUE => '逾期',
        ];
        return $statusMap[$this->status] ?? $this->status;
    }

    public function getIsOverdueAttribute()
    {
        if ($this->status === self::STATUS_PAID) {
            return false;
        }
        if (!$this->due_date) {
            return false;
        }
        return now()->toDateString() > $this->due_date;
    }

    public function getInterestAmountAttribute()
    {
        if (!$this->interest_rate || !$this->due_date || !$this->is_overdue) {
            return 0;
        }
        $overdueDays = now()->diffInDays($this->due_date);
        return round($this->remaining_amount * ($this->interest_rate / 100) * $overdueDays, 2);
    }

    public function generateDebtNo()
    {
        return 'DB' . date('YmdHis') . rand(100, 999);
    }

    public function updateStatus()
    {
        if ($this->paid_amount <= 0) {
            $this->status = self::STATUS_UNPAID;
        } elseif ($this->paid_amount >= $this->amount) {
            $this->status = self::STATUS_PAID;
        } else {
            $this->status = self::STATUS_PARTIAL;
        }

        if ($this->is_overdue && $this->status !== self::STATUS_PAID) {
            $this->status = self::STATUS_OVERDUE;
        }
    }
}
