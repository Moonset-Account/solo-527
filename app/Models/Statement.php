<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Statement extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'statement_no',
        'customer_id',
        'start_date',
        'end_date',
        'previous_balance',
        'sales_amount',
        'return_amount',
        'payment_amount',
        'ending_balance',
        'order_count',
        'return_count',
        'payment_count',
        'status',
        'remarks',
        'created_by',
        'confirmed_by',
        'confirmed_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'previous_balance' => 'decimal:2',
        'sales_amount' => 'decimal:2',
        'return_amount' => 'decimal:2',
        'payment_amount' => 'decimal:2',
        'ending_balance' => 'decimal:2',
        'confirmed_at' => 'datetime',
    ];

    const STATUS_DRAFT = 'draft';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_SENT = 'sent';

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function confirmer()
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function items()
    {
        return $this->hasMany(StatementItem::class)->orderBy('transaction_date');
    }

    public function getStatusTextAttribute()
    {
        $statusMap = [
            self::STATUS_DRAFT => '草稿',
            self::STATUS_CONFIRMED => '已确认',
            self::STATUS_SENT => '已发送',
        ];
        return $statusMap[$this->status] ?? $this->status;
    }

    public function generateStatementNo()
    {
        return 'ST' . date('YmdHis') . rand(100, 999);
    }

    public function calculateTotals()
    {
        $this->sales_amount = $this->items()->where('item_type', 'order')->sum('debit');
        $this->return_amount = $this->items()->where('item_type', 'return')->sum('credit');
        $this->payment_amount = $this->items()->where('item_type', 'payment')->sum('credit');
        $this->order_count = $this->items()->where('item_type', 'order')->count();
        $this->return_count = $this->items()->where('item_type', 'return')->count();
        $this->payment_count = $this->items()->where('item_type', 'payment')->count();
        $this->ending_balance = $this->previous_balance + $this->sales_amount - $this->return_amount - $this->payment_amount;
    }
}
