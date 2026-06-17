<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Project extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_ACTIVE = 'active';
    const STATUS_COMPLETED = 'completed';
    const STATUS_SUSPENDED = 'suspended';
    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'name',
        'customer',
        'amount',
        'project_manager',
        'description',
        'start_date',
        'end_date',
        'status',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function reconciliationItems()
    {
        return $this->hasMany(ReconciliationItem::class);
    }

    public function cashFlows()
    {
        return $this->hasMany(CashFlow::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function collectionRecords()
    {
        return $this->hasMany(CollectionRecord::class);
    }

    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopeByCustomer($query, $customer)
    {
        return $query->where('customer', 'like', "%{$customer}%");
    }

    public function scopeByManager($query, $manager)
    {
        return $query->where('project_manager', $manager);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('start_date', [$startDate, $endDate])
            ->orWhereBetween('end_date', [$startDate, $endDate]);
    }

    protected function formattedAmount(): Attribute
    {
        return Attribute::make(
            get: fn () => number_format($this->amount, 2, '.', ','),
        );
    }

    protected function receivableTotal(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->reconciliationItems()->sum('receivable_amount'),
        );
    }

    protected function receivedTotal(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->reconciliationItems()->sum('received_amount'),
        );
    }

    protected function differenceTotal(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->reconciliationItems()->sum('difference_amount'),
        );
    }

    protected function isCompleted(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === self::STATUS_COMPLETED,
        );
    }
}
