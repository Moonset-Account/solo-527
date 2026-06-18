<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PriceHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'supply_id',
        'supplier_id',
        'old_price',
        'new_price',
        'price_change',
        'change_percentage',
        'currency',
        'effective_date',
        'reason',
        'source_type',
        'source_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'old_price' => 'decimal:2',
            'new_price' => 'decimal:2',
            'price_change' => 'decimal:2',
            'change_percentage' => 'decimal:2',
            'effective_date' => 'date',
        ];
    }

    public function supply()
    {
        return $this->belongsTo(Supply::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeBySupply($query, int $supplyId)
    {
        return $query->where('supply_id', $supplyId);
    }

    public function scopeBySupplier($query, int $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    public function scopeRecent($query, int $limit = 10)
    {
        return $query->latest('effective_date')->limit($limit);
    }

    public function isIncrease(): bool
    {
        return $this->price_change > 0;
    }

    public function isDecrease(): bool
    {
        return $this->price_change < 0;
    }

    public function calculateChange(): void
    {
        $this->price_change = $this->new_price - $this->old_price;
        if ($this->old_price > 0) {
            $this->change_percentage = ($this->price_change / $this->old_price) * 100;
        }
    }

    protected static function booted()
    {
        static::saving(function ($history) {
            $history->calculateChange();
        });
    }
}
