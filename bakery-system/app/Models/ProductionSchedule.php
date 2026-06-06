<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductionSchedule extends Model
{
    use HasFactory;

    const STATUS_PENDING = 'pending';
    const STATUS_PREPARING = 'preparing';
    const STATUS_BAKING = 'baking';
    const STATUS_DECORATING = 'decorating';
    const STATUS_COMPLETED = 'completed';
    const STATUS_ON_HOLD = 'on_hold';

    protected $fillable = [
        'order_id',
        'order_item_id',
        'assigned_to',
        'status',
        'scheduled_at',
        'started_at',
        'completed_at',
        'notes',
        'priority',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'priority' => 'integer',
        ];
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function getStatusLabelAttribute()
    {
        $labels = [
            self::STATUS_PENDING => '待开始',
            self::STATUS_PREPARING => '准备中',
            self::STATUS_BAKING => '烘焙中',
            self::STATUS_DECORATING => '装饰中',
            self::STATUS_COMPLETED => '已完成',
            self::STATUS_ON_HOLD => '暂停',
        ];
        return $labels[$this->status] ?? $this->status;
    }
}
