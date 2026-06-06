<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerPriceList extends Model
{
    protected $fillable = [
        'customer_id',
        'product_id',
        'price',
        'min_quantity',
        'effective_date',
        'expiry_date',
        'is_active',
        'remarks',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'effective_date' => 'date',
        'expiry_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function getIsValidAttribute()
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->effective_date && $this->effective_date > now()->toDateString()) {
            return false;
        }

        if ($this->expiry_date && $this->expiry_date < now()->toDateString()) {
            return false;
        }

        return true;
    }
}
