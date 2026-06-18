<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApprovalFlow extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'entity_type',
        'is_default',
        'is_active',
        'min_amount',
        'max_amount',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'min_amount' => 'decimal:2',
            'max_amount' => 'decimal:2',
        ];
    }

    public function steps()
    {
        return $this->hasMany(ApprovalFlowStep::class)->orderBy('step_order');
    }

    public function purchaseRequests()
    {
        return $this->hasMany(PurchaseRequest::class);
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
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeForEntity($query, string $entityType)
    {
        return $query->where('entity_type', $entityType);
    }

    public function scopeForAmount($query, float $amount)
    {
        return $query->where(function ($q) use ($amount) {
            $q->whereNull('min_amount')->orWhere('min_amount', '<=', $amount);
        })->where(function ($q) use ($amount) {
            $q->whereNull('max_amount')->orWhere('max_amount', '>=', $amount);
        });
    }

    public function hasSteps(): bool
    {
        return $this->steps()->count() > 0;
    }

    public function getFirstStep(): ?ApprovalFlowStep
    {
        return $this->steps()->orderBy('step_order')->first();
    }

    public function getNextStep(int $currentOrder): ?ApprovalFlowStep
    {
        return $this->steps()->where('step_order', '>', $currentOrder)->orderBy('step_order')->first();
    }
}
