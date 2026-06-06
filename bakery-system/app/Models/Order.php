<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_IN_PRODUCTION = 'in_production';
    const STATUS_READY = 'ready';
    const STATUS_PICKED_UP = 'picked_up';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_REFUNDED = 'refunded';

    const PAYMENT_UNPAID = 'unpaid';
    const PAYMENT_DEPOSIT_PAID = 'deposit_paid';
    const PAYMENT_PAID = 'paid';
    const PAYMENT_PARTIAL_REFUND = 'partial_refund';
    const PAYMENT_FULL_REFUND = 'full_refund';

    protected $fillable = [
        'order_number',
        'customer_id',
        'pickup_slot_id',
        'customer_name',
        'customer_phone',
        'customer_email',
        'special_notes',
        'total_amount',
        'deposit_amount',
        'balance_amount',
        'status',
        'payment_status',
        'assigned_to',
        'created_by',
        'picked_up_at',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'balance_amount' => 'decimal:2',
            'picked_up_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            if (empty($order->order_number)) {
                $order->order_number = 'BK' . date('Ymd') . str_pad(random_int(1, 9999), 4, '0', STR_PAD_LEFT);
            }
        });
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function pickupSlot()
    {
        return $this->belongsTo(PickupSlot::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function refunds()
    {
        return $this->hasMany(Refund::class);
    }

    public function productionSchedules()
    {
        return $this->hasMany(ProductionSchedule::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getStatusLabelAttribute()
    {
        $labels = [
            self::STATUS_PENDING => '待确认',
            self::STATUS_CONFIRMED => '已确认',
            self::STATUS_IN_PRODUCTION => '生产中',
            self::STATUS_READY => '已就绪',
            self::STATUS_PICKED_UP => '已取货',
            self::STATUS_CANCELLED => '已取消',
            self::STATUS_REFUNDED => '已退款',
        ];
        return $labels[$this->status] ?? $this->status;
    }

    public function getPaymentStatusLabelAttribute()
    {
        $labels = [
            self::PAYMENT_UNPAID => '未支付',
            self::PAYMENT_DEPOSIT_PAID => '定金已付',
            self::PAYMENT_PAID => '已付清',
            self::PAYMENT_PARTIAL_REFUND => '部分退款',
            self::PAYMENT_FULL_REFUND => '全额退款',
        ];
        return $labels[$this->payment_status] ?? $this->payment_status;
    }

    public function canCancel()
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_CONFIRMED]);
    }

    public function canStartProduction()
    {
        return $this->status === self::STATUS_CONFIRMED && $this->payment_status !== self::PAYMENT_UNPAID;
    }

    public function canPickup()
    {
        return $this->status === self::STATUS_READY && $this->payment_status === self::PAYMENT_PAID;
    }
}
