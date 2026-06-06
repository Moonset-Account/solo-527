<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'size',
        'price',
        'deposit',
        'flavor',
        'is_active',
        'preparation_hours',
        'image',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'deposit' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function recipes()
    {
        return $this->hasMany(Recipe::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
}
