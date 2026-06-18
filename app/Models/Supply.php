<?php

namespace App\Models;

use App\Enums\SupplierRiskLevel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supply extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'category_id',
        'specification',
        'unit',
        'brand',
        'model',
        'description',
        'current_stock',
        'safety_stock',
        'unit_price',
        'currency',
        'is_active',
        'storage_location',
        'barcode',
        'image',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'current_stock' => 'decimal:2',
            'safety_stock' => 'decimal:2',
            'unit_price' => 'decimal:2',
        ];
    }

    public function category()
    {
        return $this->belongsTo(SupplyCategory::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function purchaseRequestItems()
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }

    public function quotationItems()
    {
        return $this->hasMany(QuotationItem::class);
    }

    public function priceHistories()
    {
        return $this->hasMany(PriceHistory::class);
    }

    public function monthlyUsages()
    {
        return $this->hasMany(SupplyMonthlyUsage::class);
    }

    public function specAttachments()
    {
        return $this->hasMany(SupplySpecAttachment::class);
    }

    public function preferredSuppliers()
    {
        return $this->belongsToMany(Supplier::class, 'supply_supplier')
            ->withPivot(['is_preferred', 'last_price', 'last_quotation_date'])
            ->withTimestamps();
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('current_stock', '<=', 'safety_stock');
    }

    public function isLowStock(): bool
    {
        return $this->current_stock <= $this->safety_stock;
    }

    public function updateStock(float $quantity, string $operation = 'add'): void
    {
        if ($operation === 'add') {
            $this->current_stock += $quantity;
        } else {
            $this->current_stock -= $quantity;
        }
        $this->save();
    }
}
