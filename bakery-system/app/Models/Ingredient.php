<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Ingredient extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'unit',
        'unit_price',
        'alert_threshold',
        'expiry_alert_days',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function stocks()
    {
        return $this->hasMany(IngredientStock::class);
    }

    public function recipeIngredients()
    {
        return $this->hasMany(RecipeIngredient::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function getTotalStockAttribute()
    {
        return $this->stocks()->sum('quantity');
    }

    public function getIsLowStockAttribute()
    {
        return $this->total_stock <= $this->alert_threshold;
    }

    public function getExpiringSoonStocksAttribute()
    {
        return $this->stocks()
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', now()->addDays($this->expiry_alert_days))
            ->where('expiry_date', '>=', now())
            ->orderBy('expiry_date')
            ->get();
    }
}
