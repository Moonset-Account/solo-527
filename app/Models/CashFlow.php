<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class CashFlow extends Model
{
    use HasFactory, SoftDeletes;

    const TYPE_INCOME = 'income';
    const TYPE_EXPENSE = 'expense';

    const METHOD_BANK_TRANSFER = 'bank_transfer';
    const METHOD_CASH = 'cash';
    const METHOD_CHECK = 'check';
    const METHOD_ALIPAY = 'alipay';
    const METHOD_WECHAT = 'wechat';
    const METHOD_OTHER = 'other';

    protected $fillable = [
        'project_id',
        'type',
        'amount',
        'transaction_date',
        'payment_method',
        'transaction_no',
        'remarks',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'transaction_date' => 'date',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function scopeType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeIncome($query)
    {
        return $query->where('type', self::TYPE_INCOME);
    }

    public function scopeExpense($query)
    {
        return $query->where('type', self::TYPE_EXPENSE);
    }

    public function scopeProject($query, $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function scopePaymentMethod($query, $method)
    {
        return $query->where('payment_method', $method);
    }

    public function scopeTransactionNo($query, $transactionNo)
    {
        return $query->where('transaction_no', $transactionNo);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }

    public function scopeAmountGreaterThan($query, $amount)
    {
        return $query->where('amount', '>=', $amount);
    }

    public function scopeAmountLessThan($query, $amount)
    {
        return $query->where('amount', '<=', $amount);
    }

    protected function formattedAmount(): Attribute
    {
        return Attribute::make(
            get: fn () => number_format($this->amount, 2, '.', ','),
        );
    }

    protected function signedAmount(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->type === self::TYPE_INCOME ? $this->amount : -$this->amount,
        );
    }

    protected function formattedSignedAmount(): Attribute
    {
        return Attribute::make(
            get: fn () => ($this->type === self::TYPE_INCOME ? '+' : '-') . number_format(abs($this->amount), 2, '.', ','),
        );
    }

    protected function isIncome(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->type === self::TYPE_INCOME,
        );
    }

    protected function isExpense(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->type === self::TYPE_EXPENSE,
        );
    }

    protected function typeLabel(): Attribute
    {
        return Attribute::make(
            get: function () {
                $labels = [
                    self::TYPE_INCOME => '收款',
                    self::TYPE_EXPENSE => '付款',
                ];
                return $labels[$this->type] ?? $this->type;
            },
        );
    }

    protected function methodLabel(): Attribute
    {
        return Attribute::make(
            get: function () {
                $labels = [
                    self::METHOD_BANK_TRANSFER => '银行转账',
                    self::METHOD_CASH => '现金',
                    self::METHOD_CHECK => '支票',
                    self::METHOD_ALIPAY => '支付宝',
                    self::METHOD_WECHAT => '微信支付',
                    self::METHOD_OTHER => '其他',
                ];
                return $labels[$this->payment_method] ?? $this->payment_method;
            },
        );
    }
}
