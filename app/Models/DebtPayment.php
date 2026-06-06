<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DebtPayment extends Model
{
    protected $fillable = [
        'payment_no',
        'debt_id',
        'customer_id',
        'amount',
        'payment_method',
        'transaction_no',
        'remarks',
        'created_by',
        'confirmed_by',
        'confirmed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'confirmed_at' => 'datetime',
    ];

    const METHOD_CASH = 'cash';
    const METHOD_BANK = 'bank';
    const METHOD_WECHAT = 'wechat';
    const METHOD_ALIPAY = 'alipay';

    public function debt()
    {
        return $this->belongsTo(Debt::class);
    }

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

    public function getPaymentMethodTextAttribute()
    {
        $methodMap = [
            self::METHOD_CASH => '现金',
            self::METHOD_BANK => '银行转账',
            self::METHOD_WECHAT => '微信',
            self::METHOD_ALIPAY => '支付宝',
        ];
        return $methodMap[$this->payment_method] ?? $this->payment_method;
    }

    public function generatePaymentNo()
    {
        return 'DP' . date('YmdHis') . rand(100, 999);
    }
}
