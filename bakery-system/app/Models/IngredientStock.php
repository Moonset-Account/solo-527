<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class IngredientStock extends Model
{
    use HasFactory;

    protected $fillable = [
        'ingredient_id',
        'quantity',
        'expiry_date',
        'batch_number',
        'supplier',
        'unit_cost',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_cost' => 'decimal:2',
            'expiry_date' => 'date',
        ];
    }

    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function getIsExpiringSoonAttribute()
    {
        if (!$this->expiry_date) {
            return false;
        }
        return $this->expiry_date->isToday() ||
               $this->expiry_date->isTomorrow() ||
               ($this->expiry_date->diffInDays(now()) <= optional($this->ingredient)->expiry_alert_days);
    }

    public function getIsExpiredAttribute()
    {
        if (!$this->expiry_date) {
            return false;
        }
        return $this->expiry_date->isPast();
    }
}
