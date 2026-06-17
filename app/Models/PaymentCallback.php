<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class PaymentCallback extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_PENDING = 'pending';
    const STATUS_SUCCESS = 'success';
    const STATUS_FAILED = 'failed';
    const STATUS_PROCESSING = 'processing';

    const METHOD_BANK_TRANSFER = 'bank_transfer';
    const METHOD_ALIPAY = 'alipay';
    const METHOD_WECHAT = 'wechat';
    const METHOD_UNIONPAY = 'unionpay';
    const METHOD_CASH = 'cash';
    const METHOD_OTHER = 'other';

    protected $fillable = [
        'payment_no',
        'status',
        'failure_reason',
        'retry_count',
        'affected_documents',
        'amount',
        'payment_method',
        'callback_time',
        'callback_data',
        'remarks',
    ];

    protected $casts = [
        'retry_count' => 'integer',
        'amount' => 'decimal:2',
        'callback_time' => 'datetime',
        'callback_data' => 'array',
        'affected_documents' => 'array',
    ];

    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeSuccess($query)
    {
        return $query->where('status', self::STATUS_SUCCESS);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    public function scopeProcessing($query)
    {
        return $query->where('status', self::STATUS_PROCESSING);
    }

    public function scopePaymentNo($query, $paymentNo)
    {
        return $query->where('payment_no', $paymentNo);
    }

    public function scopePaymentMethod($query, $method)
    {
        return $query->where('payment_method', $method);
    }

    public function scopeNeedsRetry($query, $maxRetries = 3)
    {
        return $query->where('status', self::STATUS_FAILED)
            ->where('retry_count', '<', $maxRetries);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    public function scopeCallbackDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('callback_time', [$startDate, $endDate]);
    }

    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeAmountGreaterThan($query, $amount)
    {
        return $query->where('amount', '>=', $amount);
    }

    protected function formattedAmount(): Attribute
    {
        return Attribute::make(
            get: fn () => number_format($this->amount, 2, '.', ','),
        );
    }

    protected function formattedCallbackTime(): Attribute
    {
        return Attribute::make(
            get: fn () => optional($this->callback_time)->format('Y-m-d H:i'),
        );
    }

    protected function isPending(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === self::STATUS_PENDING,
        );
    }

    protected function isSuccess(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === self::STATUS_SUCCESS,
        );
    }

    protected function isFailed(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === self::STATUS_FAILED,
        );
    }

    protected function isProcessing(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === self::STATUS_PROCESSING,
        );
    }

    protected function canRetry(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === self::STATUS_FAILED && $this->retry_count < 3,
        );
    }

    protected function statusLabel(): Attribute
    {
        return Attribute::make(
            get: function () {
                $labels = [
                    self::STATUS_PENDING => '待处理',
                    self::STATUS_SUCCESS => '处理成功',
                    self::STATUS_FAILED => '处理失败',
                    self::STATUS_PROCESSING => '处理中',
                ];
                return $labels[$this->status] ?? $this->status;
            },
        );
    }

    protected function methodLabel(): Attribute
    {
        return Attribute::make(
            get: function () {
                $labels = [
                    self::METHOD_BANK_TRANSFER => '银行转账',
                    self::METHOD_ALIPAY => '支付宝',
                    self::METHOD_WECHAT => '微信支付',
                    self::METHOD_UNIONPAY => '银联',
                    self::METHOD_CASH => '现金',
                    self::METHOD_OTHER => '其他',
                ];
                return $labels[$this->payment_method] ?? $this->payment_method;
            },
        );
    }

    protected function affectedDocumentCount(): Attribute
    {
        return Attribute::make(
            get: fn () => is_array($this->affected_documents) ? count($this->affected_documents) : 0,
        );
    }
}
