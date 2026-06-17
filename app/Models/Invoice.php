<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_PENDING = 'pending';
    const STATUS_ISSUED = 'issued';
    const STATUS_FAILED = 'failed';
    const STATUS_VOIDED = 'voided';

    protected $fillable = [
        'project_id',
        'invoice_no',
        'amount',
        'issue_date',
        'status',
        'error_message',
        'tax_rate',
        'tax_amount',
        'remarks',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'issue_date' => 'date',
        'tax_amount' => 'decimal:2',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeIssued($query)
    {
        return $query->where('status', self::STATUS_ISSUED);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    public function scopeVoided($query)
    {
        return $query->where('status', self::STATUS_VOIDED);
    }

    public function scopeProject($query, $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function scopeInvoiceNo($query, $invoiceNo)
    {
        return $query->where('invoice_no', $invoiceNo);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('issue_date', [$startDate, $endDate]);
    }

    public function scopeHasError($query)
    {
        return $query->whereNotNull('error_message');
    }

    protected function formattedAmount(): Attribute
    {
        return Attribute::make(
            get: fn () => number_format($this->amount, 2, '.', ','),
        );
    }

    protected function formattedTaxAmount(): Attribute
    {
        return Attribute::make(
            get: fn () => number_format($this->tax_amount, 2, '.', ','),
        );
    }

    protected function totalAmount(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->amount + $this->tax_amount,
        );
    }

    protected function formattedTotalAmount(): Attribute
    {
        return Attribute::make(
            get: fn () => number_format($this->total_amount, 2, '.', ','),
        );
    }

    protected function isPending(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === self::STATUS_PENDING,
        );
    }

    protected function isIssued(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === self::STATUS_ISSUED,
        );
    }

    protected function isFailed(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === self::STATUS_FAILED,
        );
    }

    protected function hasError(): Attribute
    {
        return Attribute::make(
            get: fn () => !empty($this->error_message),
        );
    }

    protected function statusLabel(): Attribute
    {
        return Attribute::make(
            get: function () {
                $labels = [
                    self::STATUS_PENDING => '待开票',
                    self::STATUS_ISSUED => '已开票',
                    self::STATUS_FAILED => '开票失败',
                    self::STATUS_VOIDED => '已作废',
                ];
                return $labels[$this->status] ?? $this->status;
            },
        );
    }

    protected function projectName(): Attribute
    {
        return Attribute::make(
            get: fn () => optional($this->project)->name,
        );
    }

    protected function customerName(): Attribute
    {
        return Attribute::make(
            get: fn () => optional($this->project)->customer,
        );
    }
}
