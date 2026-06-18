<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'delivery_confirmation_id',
        'supply_id',
        'supply_name',
        'specification',
        'unit',
        'expected_quantity',
        'received_quantity',
        'unit_price',
        'total_price',
        'batch_no',
        'production_date',
        'expiry_date',
        'remark',
    ];

    protected function casts(): array
    {
        return [
            'expected_quantity' => 'decimal:2',
            'received_quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
            'production_date' => 'date',
            'expiry_date' => 'date',
        ];
    }

    public function deliveryConfirmation()
    {
        return $this->belongsTo(DeliveryConfirmation::class);
    }

    public function supply()
    {
        return $this->belongsTo(Supply::class);
    }
}
