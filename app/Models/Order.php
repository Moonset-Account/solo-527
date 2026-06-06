<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_no',
        'customer_id',
        'salesperson_id',
        'total_amount',
        'discount_amount',
        'paid_amount',
        'debt_amount',
        'status',
        'payment_status',
        'payment_method',
        'urgent_level',
        'expected_delivery_at',
        'shipping_address',
        'remarks',
        'source',
        'created_by',
        'confirmed_by',
        'confirmed_at',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'debt_amount' => 'decimal:2',
        'expected_delivery_at' => 'datetime',
        'confirmed_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_PICKING = 'picking';
    const STATUS_SHIPPED = 'shipped';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    const PAYMENT_STATUS_UNPAID = 'unpaid';
    const PAYMENT_STATUS_PARTIAL = 'partial';
    const PAYMENT_STATUS_PAID = 'paid';

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function salesperson()
    {
        return $this->belongsTo(User::class, 'salesperson_id');
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
        return $this->hasMany(OrderItem::class);
    }

    public function pickingLists()
    {
        return $this->hasMany(PickingList::class);
    }

    public function inventoryLocks()
    {
        return $this->hasMany(InventoryLock::class);
    }

    public function debts()
    {
        return $this->hasMany(Debt::class);
    }

    public function returns()
    {
        return $this->hasMany(ReturnRequest::class);
    }

    public function getStatusTextAttribute()
    {
        $statusMap = [
            self::STATUS_PENDING => '待确认',
            self::STATUS_CONFIRMED => '已确认',
            self::STATUS_PICKING => '拣货中',
            self::STATUS_SHIPPED => '已发货',
            self::STATUS_COMPLETED => '已完成',
            self::STATUS_CANCELLED => '已取消',
        ];
        return $statusMap[$this->status] ?? $this->status;
    }

    public function getPaymentStatusTextAttribute()
    {
        $statusMap = [
            self::PAYMENT_STATUS_UNPAID => '未付款',
            self::PAYMENT_STATUS_PARTIAL => '部分付款',
            self::PAYMENT_STATUS_PAID => '已付款',
        ];
        return $statusMap[$this->payment_status] ?? $this->payment_status;
    }

    public function getIsTimeoutAttribute()
    {
        if ($this->status === self::STATUS_COMPLETED || $this->status === self::STATUS_CANCELLED) {
            return false;
        }
        if (!$this->expected_delivery_at) {
            return false;
        }
        return now() > $this->expected_delivery_at;
    }

    public function generateOrderNo()
    {
        return 'ORD' . date('YmdHis') . rand(100, 999);
    }

    public function calculateTotals()
    {
        $this->total_amount = $this->items->sum('total_price');
        $this->debt_amount = max(0, $this->total_amount - $this->discount_amount - $this->paid_amount);

        if ($this->paid_amount <= 0) {
            $this->payment_status = self::PAYMENT_STATUS_UNPAID;
        } elseif ($this->paid_amount >= $this->total_amount - $this->discount_amount) {
            $this->payment_status = self::PAYMENT_STATUS_PAID;
        } else {
            $this->payment_status = self::PAYMENT_STATUS_PARTIAL;
        }
    }
}
