<?php

namespace App\Models;

use App\Enums\SupplierRiskLevel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'tax_number',
        'business_license',
        'contact_person',
        'contact_position',
        'phone',
        'email',
        'address',
        'country',
        'province',
        'city',
        'postal_code',
        'website',
        'bank_name',
        'bank_account',
        'bank_account_name',
        'credit_limit',
        'payment_terms',
        'delivery_terms',
        'risk_level',
        'risk_score',
        'is_blacklisted',
        'blacklist_reason',
        'is_active',
        'rating',
        'total_orders',
        'total_amount',
        'on_time_delivery_rate',
        'quality_rating',
        'registered_at',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_blacklisted' => 'boolean',
            'credit_limit' => 'decimal:2',
            'rating' => 'decimal:2',
            'total_orders' => 'integer',
            'total_amount' => 'decimal:2',
            'on_time_delivery_rate' => 'decimal:2',
            'quality_rating' => 'decimal:2',
            'risk_level' => SupplierRiskLevel::class,
            'risk_score' => 'integer',
            'registered_at' => 'date',
        ];
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function riskLogs()
    {
        return $this->hasMany(SupplierRiskLog::class);
    }

    public function quotations()
    {
        return $this->hasMany(Quotation::class);
    }

    public function supplies()
    {
        return $this->belongsToMany(Supply::class, 'supply_supplier')
            ->withPivot(['is_preferred', 'last_price', 'last_quotation_date'])
            ->withTimestamps();
    }

    public function deliveryConfirmations()
    {
        return $this->hasMany(DeliveryConfirmation::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->where('is_blacklisted', false);
    }

    public function scopeBlacklisted($query)
    {
        return $query->where('is_blacklisted', true);
    }

    public function scopeByRiskLevel($query, SupplierRiskLevel $level)
    {
        return $query->where('risk_level', $level);
    }

    public function isBlacklisted(): bool
    {
        return $this->is_blacklisted;
    }

    public function canQuote(): bool
    {
        return $this->is_active && !$this->is_blacklisted &&
            !in_array($this->risk_level, [SupplierRiskLevel::CRITICAL, SupplierRiskLevel::BLACKLISTED]);
    }

    public function updateRiskLevel(SupplierRiskLevel $level, string $reason, User $operator): void
    {
        $this->risk_level = $level;
        $this->risk_score = $level->score();
        $this->save();

        $this->riskLogs()->create([
            'old_level' => $this->getOriginal('risk_level'),
            'new_level' => $level,
            'reason' => $reason,
            'operator_id' => $operator->id,
        ]);
    }
}
