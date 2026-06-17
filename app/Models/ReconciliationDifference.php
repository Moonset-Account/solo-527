<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class ReconciliationDifference extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_RESOLVED = 'resolved';
    const STATUS_WRITE_OFF = 'write_off';

    const TYPE_PRICE_DIFFERENCE = 'price_difference';
    const TYPE_QUANTITY_DIFFERENCE = 'quantity_difference';
    const TYPE_PAYMENT_DELAY = 'payment_delay';
    const TYPE_OTHER = 'other';

    protected $fillable = [
        'reconciliation_item_id',
        'difference_type',
        'amount',
        'status',
        'responsible_person',
        'processing_deadline',
        'description',
        'resolution',
        'resolved_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'processing_deadline' => 'date',
        'resolved_at' => 'date',
    ];

    public function reconciliationItem()
    {
        return $this->belongsTo(ReconciliationItem::class);
    }

    public function writeOff()
    {
        return $this->hasOne(WriteOff::class);
    }

    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeProcessing($query)
    {
        return $query->where('status', self::STATUS_PROCESSING);
    }

    public function scopeResolved($query)
    {
        return $query->where('status', self::STATUS_RESOLVED);
    }

    public function scopeWriteOff($query)
    {
        return $query->where('status', self::STATUS_WRITE_OFF);
    }

    public function scopeUnresolved($query)
    {
        return $query->whereIn('status', [self::STATUS_PENDING, self::STATUS_PROCESSING]);
    }

    public function scopeType($query, $type)
    {
        return $query->where('difference_type', $type);
    }

    public function scopeResponsible($query, $person)
    {
        return $query->where('responsible_person', $person);
    }

    public function scopeOverdue($query)
    {
        return $query->where('processing_deadline', '<', now()->toDateString())
            ->whereIn('status', [self::STATUS_PENDING, self::STATUS_PROCESSING]);
    }

    public function scopeDeadlineWithin($query, $days)
    {
        return $query->whereBetween('processing_deadline', [
            now()->toDateString(),
            now()->addDays($days)->toDateString(),
        ])->whereIn('status', [self::STATUS_PENDING, self::STATUS_PROCESSING]);
    }

    public function scopeItem($query, $itemId)
    {
        return $query->where('reconciliation_item_id', $itemId);
    }

    protected function formattedAmount(): Attribute
    {
        return Attribute::make(
            get: fn () => number_format($this->amount, 2, '.', ','),
        );
    }

    protected function isOverdue(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->processing_deadline < now()->toDateString()
                && in_array($this->status, [self::STATUS_PENDING, self::STATUS_PROCESSING]),
        );
    }

    protected function isResolved(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === self::STATUS_RESOLVED,
        );
    }

    protected function hasWriteOff(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->writeOff !== null,
        );
    }

    protected function daysUntilDeadline(): Attribute
    {
        return Attribute::make(
            get: fn () => now()->diffInDays($this->processing_deadline, false),
        );
    }

    protected function typeLabel(): Attribute
    {
        return Attribute::make(
            get: function () {
                $labels = [
                    self::TYPE_PRICE_DIFFERENCE => '价格差异',
                    self::TYPE_QUANTITY_DIFFERENCE => '数量差异',
                    self::TYPE_PAYMENT_DELAY => '付款延迟',
                    self::TYPE_OTHER => '其他',
                ];
                return $labels[$this->difference_type] ?? $this->difference_type;
            },
        );
    }

    protected function statusLabel(): Attribute
    {
        return Attribute::make(
            get: function () {
                $labels = [
                    self::STATUS_PENDING => '待处理',
                    self::STATUS_PROCESSING => '处理中',
                    self::STATUS_RESOLVED => '已解决',
                    self::STATUS_WRITE_OFF => '已冲销',
                ];
                return $labels[$this->status] ?? $this->status;
            },
        );
    }
}
