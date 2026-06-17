<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class ReconciliationItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'project_id',
        'reconciliation_statement_id',
        'receivable_amount',
        'received_amount',
        'difference_amount',
        'remarks',
    ];

    protected $casts = [
        'receivable_amount' => 'decimal:2',
        'received_amount' => 'decimal:2',
        'difference_amount' => 'decimal:2',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function reconciliationStatement()
    {
        return $this->belongsTo(ReconciliationStatement::class);
    }

    public function reconciliationDifferences()
    {
        return $this->hasMany(ReconciliationDifference::class);
    }

    public function scopeProject($query, $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function scopeStatement($query, $statementId)
    {
        return $query->where('reconciliation_statement_id', $statementId);
    }

    public function scopeHasDifference($query)
    {
        return $query->where('difference_amount', '!=', 0);
    }

    public function scopeNoDifference($query)
    {
        return $query->where('difference_amount', 0);
    }

    public function scopeReceivableGreaterThan($query, $amount)
    {
        return $query->where('receivable_amount', '>=', $amount);
    }

    public function scopeReceivedGreaterThan($query, $amount)
    {
        return $query->where('received_amount', '>=', $amount);
    }

    protected function formattedReceivableAmount(): Attribute
    {
        return Attribute::make(
            get: fn () => number_format($this->receivable_amount, 2, '.', ','),
        );
    }

    protected function formattedReceivedAmount(): Attribute
    {
        return Attribute::make(
            get: fn () => number_format($this->received_amount, 2, '.', ','),
        );
    }

    protected function formattedDifferenceAmount(): Attribute
    {
        return Attribute::make(
            get: fn () => number_format($this->difference_amount, 2, '.', ','),
        );
    }

    protected function hasDifference(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->difference_amount != 0,
        );
    }

    protected function differenceCount(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->reconciliationDifferences()->count(),
        );
    }

    protected function unresolvedDifferenceCount(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->reconciliationDifferences()->where('status', '!=', 'resolved')->count(),
        );
    }

    protected function collectionRate(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->receivable_amount == 0) {
                    return 0;
                }
                return round(($this->received_amount / $this->receivable_amount) * 100, 2);
            },
        );
    }
}
