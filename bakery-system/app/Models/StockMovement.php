<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StockMovement extends Model
{
    use HasFactory;

    const TYPE_IN = 'in';
    const TYPE_OUT = 'out';
    const TYPE_ADJUST = 'adjust';
    const TYPE_EXPIRED = 'expired';
    const TYPE_WASTE = 'waste';

    protected $fillable = [
        'ingredient_id',
        'ingredient_stock_id',
        'order_id',
        'quantity',
        'type',
        'reason',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
        ];
    }

    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function ingredientStock()
    {
        return $this->belongsTo(IngredientStock::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getTypeLabelAttribute()
    {
        $labels = [
            self::TYPE_IN => '入库',
            self::TYPE_OUT => '出库',
            self::TYPE_ADJUST => '调整',
            self::TYPE_EXPIRED => '过期',
            self::TYPE_WASTE => '损耗',
        ];
        return $labels[$this->type] ?? $this->type;
    }
}
