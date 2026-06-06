<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StatementItem extends Model
{
    protected $fillable = [
        'statement_id',
        'item_type',
        'related_id',
        'related_no',
        'transaction_date',
        'debit',
        'credit',
        'balance',
        'description',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
        'balance' => 'decimal:2',
    ];

    const TYPE_ORDER = 'order';
    const TYPE_RETURN = 'return';
    const TYPE_PAYMENT = 'payment';
    const TYPE_ADJUSTMENT = 'adjustment';

    public function statement()
    {
        return $this->belongsTo(Statement::class);
    }

    public function getItemTypeTextAttribute()
    {
        $typeMap = [
            self::TYPE_ORDER => '订单',
            self::TYPE_RETURN => '退货',
            self::TYPE_PAYMENT => '收款',
            self::TYPE_ADJUSTMENT => '调整',
        ];
        return $typeMap[$this->item_type] ?? $this->item_type;
    }
}
