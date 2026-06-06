<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ReturnRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'return_no',
        'order_id',
        'customer_id',
        'total_amount',
        'refund_amount',
        'status',
        'reason',
        'return_type',
        'created_by',
        'approved_by',
        'approved_at',
        'approval_remarks',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';

    const TYPE_QUALITY = 'quality';
    const TYPE_WRONG = 'wrong';
    const TYPE_DAMAGE = 'damage';
    const TYPE_OTHER = 'other';

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items()
    {
        return $this->hasMany(ReturnItem::class);
    }

    public function getStatusTextAttribute()
    {
        $statusMap = [
            self::STATUS_PENDING => '待审批',
            self::STATUS_APPROVED => '已批准',
            self::STATUS_REJECTED => '已拒绝',
            self::STATUS_PROCESSING => '处理中',
            self::STATUS_COMPLETED => '已完成',
        ];
        return $statusMap[$this->status] ?? $this->status;
    }

    public function getReturnTypeTextAttribute()
    {
        $typeMap = [
            self::TYPE_QUALITY => '质量问题',
            self::TYPE_WRONG => '发错货',
            self::TYPE_DAMAGE => '损坏',
            self::TYPE_OTHER => '其他',
        ];
        return $typeMap[$this->return_type] ?? $this->return_type;
    }

    public function getIsTimeoutAttribute()
    {
        if (in_array($this->status, [self::STATUS_COMPLETED, self::STATUS_REJECTED])) {
            return false;
        }
        return now()->diffInHours($this->created_at) > 24;
    }

    public function generateReturnNo()
    {
        return 'RT' . date('YmdHis') . rand(100, 999);
    }
}
