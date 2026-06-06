<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReturnItem extends Model
{
    protected $fillable = [
        'return_id',
        'order_item_id',
        'product_id',
        'quantity',
        'received_quantity',
        'restocked_quantity',
        'unit_price',
        'total_price',
        'status',
        'reason',
        'received_by',
        'received_at',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'received_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_RECEIVED = 'received';
    const STATUS_RESTOCKED = 'restocked';
    const STATUS_REJECTED = 'rejected';

    public function returnRequest()
    {
        return $this->belongsTo(ReturnRequest::class, 'return_id');
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function getStatusTextAttribute()
    {
        $statusMap = [
            self::STATUS_PENDING => '待处理',
            self::STATUS_RECEIVED => '已收货',
            self::STATUS_RESTOCKED => '已入库',
            self::STATUS_REJECTED => '拒收',
        ];
        return $statusMap[$this->status] ?? $this->status;
    }

    public function getRemainingToReceiveAttribute()
    {
        return max(0, $this->quantity - $this->received_quantity);
    }

    public function getRemainingToRestockAttribute()
    {
        return max(0, $this->received_quantity - $this->restocked_quantity);
    }
}
