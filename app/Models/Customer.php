<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'customer_code',
        'name',
        'contact_person',
        'phone',
        'email',
        'address',
        'id_card',
        'business_license',
        'credit_limit',
        'current_debt',
        'is_vip',
        'payment_terms',
        'remarks',
        'salesperson_id',
        'is_active',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'current_debt' => 'decimal:2',
        'is_vip' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function salesperson()
    {
        return $this->belongsTo(User::class, 'salesperson_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function priceLists()
    {
        return $this->hasMany(CustomerPriceList::class);
    }

    public function debts()
    {
        return $this->hasMany(Debt::class);
    }

    public function debtPayments()
    {
        return $this->hasMany(DebtPayment::class);
    }

    public function returns()
    {
        return $this->hasMany(ReturnRequest::class);
    }

    public function statements()
    {
        return $this->hasMany(Statement::class);
    }

    public function getAvailableCreditAttribute()
    {
        return max(0, $this->credit_limit - $this->current_debt);
    }

    public function getIsOverCreditLimitAttribute()
    {
        return $this->current_debt > $this->credit_limit;
    }

    public function getProductPrice($productId, $quantity = 1)
    {
        $priceList = $this->priceLists()
            ->where('product_id', $productId)
            ->where('min_quantity', '<=', $quantity)
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('effective_date')
                    ->orWhere('effective_date', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('expiry_date')
                    ->orWhere('expiry_date', '>=', now());
            })
            ->orderBy('min_quantity', 'desc')
            ->first();

        if ($priceList) {
            return $priceList->price;
        }

        $product = Product::find($productId);
        return $product ? ($this->is_vip ? $product->wholesale_price : $product->standard_price) : 0;
    }
}
