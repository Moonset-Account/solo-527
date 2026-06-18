<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplyMonthlyUsage extends Model
{
    use HasFactory;

    protected $fillable = [
        'supply_id',
        'year',
        'month',
        'usage_quantity',
        'usage_amount',
        'purchase_quantity',
        'purchase_amount',
        'opening_stock',
        'closing_stock',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'month' => 'integer',
            'usage_quantity' => 'decimal:2',
            'usage_amount' => 'decimal:2',
            'purchase_quantity' => 'decimal:2',
            'purchase_amount' => 'decimal:2',
            'opening_stock' => 'decimal:2',
            'closing_stock' => 'decimal:2',
        ];
    }

    public function supply()
    {
        return $this->belongsTo(Supply::class);
    }

    public function scopeBySupply($query, int $supplyId)
    {
        return $query->where('supply_id', $supplyId);
    }

    public function scopeByYear($query, int $year)
    {
        return $query->where('year', $year);
    }

    public function scopeByMonth($query, int $month)
    {
        return $query->where('month', $month);
    }

    public function scopeDateRange($query, int $startYear, int $startMonth, int $endYear, int $endMonth)
    {
        return $query->where(function ($q) use ($startYear, $startMonth, $endYear, $endMonth) {
            $q->where(function ($sub) use ($startYear, $startMonth) {
                $sub->where('year', $startYear)->where('month', '>=', $startMonth);
            })->orWhere(function ($sub) use ($endYear, $endMonth) {
                $sub->where('year', $endYear)->where('month', '<=', $endMonth);
            })->orWhere(function ($sub) use ($startYear, $endYear) {
                $sub->whereBetween('year', [$startYear + 1, $endYear - 1]);
            });
        });
    }
}
