<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PickingList extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'picking_no',
        'order_id',
        'picker_id',
        'status',
        'total_items',
        'picked_items',
        'remarks',
        'created_by',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_PICKING = 'picking';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function picker()
    {
        return $this->belongsTo(User::class, 'picker_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(PickingItem::class)->orderBy('location_id');
    }

    public function scans()
    {
        return $this->hasManyThrough(PickingScan::class, PickingItem::class);
    }

    public function getStatusTextAttribute()
    {
        $statusMap = [
            self::STATUS_PENDING => '待拣货',
            self::STATUS_PICKING => '拣货中',
            self::STATUS_COMPLETED => '已完成',
            self::STATUS_CANCELLED => '已取消',
        ];
        return $statusMap[$this->status] ?? $this->status;
    }

    public function getProgressAttribute()
    {
        if ($this->total_items == 0) {
            return 0;
        }
        return round(($this->picked_items / $this->total_items) * 100, 2);
    }

    public function getIsTimeoutAttribute()
    {
        if ($this->status === self::STATUS_COMPLETED || $this->status === self::STATUS_CANCELLED) {
            return false;
        }
        if (!$this->created_at) {
            return false;
        }
        return now()->diffInHours($this->created_at) > 24;
    }

    public function generatePickingNo()
    {
        return 'PK' . date('YmdHis') . rand(100, 999);
    }
}
