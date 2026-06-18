<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class QuotationItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'quotation_id',
        'request_item_id',
        'supply_id',
        'supply_code',
        'supply_name',
        'specification',
        'brand',
        'unit',
        'quantity',
        'unit_price',
        'tax_rate',
        'tax_amount',
        'subtotal',
        'amount',
        'manufacturer',
        'origin',
        'production_date',
        'expiry_date',
        'batch_no',
        'remark',
        'sort',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:4',
            'tax_rate' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'amount' => 'decimal:2',
            'production_date' => 'date',
            'expiry_date' => 'date',
            'sort' => 'integer',
        ];
    }

    public function quotation()
    {
        return $this->belongsTo(Quotation::class);
    }

    public function purchaseRequestItem()
    {
        return $this->belongsTo(PurchaseRequestItem::class, 'request_item_id');
    }

    public function supply()
    {
        return $this->belongsTo(Supply::class);
    }

    public function calculateAmounts(): array
    {
        $qty = $this->quantity ?? 0;
        $price = $this->unit_price ?? 0;
        $subtotal = $qty * $price;
        $taxRate = $this->tax_rate ?? 0;
        $tax = $taxRate > 0 ? $subtotal * ($taxRate / 100) : 0;

        return [
            'subtotal' => $subtotal,
            'tax_amount' => $tax,
            'amount' => $subtotal + $tax,
        ];
    }

    protected static function booted()
    {
        static::saving(function ($item) {
            $amounts = $item->calculateAmounts();
            $item->subtotal = $amounts['subtotal'];
            $item->tax_amount = $amounts['tax_amount'];
            $item->amount = $amounts['amount'];
        });

        static::saved(function ($item) {
            if ($item->quotation) {
                $item->quotation->updateAmounts();
            }
        });

        static::deleted(function ($item) {
            if ($item->quotation) {
                $item->quotation->updateAmounts();
            }
        });
    }
}
