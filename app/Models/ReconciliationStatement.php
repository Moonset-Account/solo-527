<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class ReconciliationStatement extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    protected $fillable = [
        'period',
        'upload_date',
        'status',
        'uploaded_by',
        'file_path',
        'remarks',
    ];

    protected $casts = [
        'upload_date' => 'date',
    ];

    public function reconciliationItems()
    {
        return $this->hasMany(ReconciliationItem::class);
    }

    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeProcessing($query)
    {
        return $query->where('status', self::STATUS_PROCESSING);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopeByPeriod($query, $period)
    {
        return $query->where('period', $period);
    }

    public function scopeByUploader($query, $uploader)
    {
        return $query->where('uploaded_by', $uploader);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('upload_date', [$startDate, $endDate]);
    }

    protected function totalReceivable(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->reconciliationItems()->sum('receivable_amount'),
        );
    }

    protected function totalReceived(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->reconciliationItems()->sum('received_amount'),
        );
    }

    protected function totalDifference(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->reconciliationItems()->sum('difference_amount'),
        );
    }

    protected function formattedTotalReceivable(): Attribute
    {
        return Attribute::make(
            get: fn () => number_format($this->total_receivable, 2, '.', ','),
        );
    }

    protected function formattedTotalReceived(): Attribute
    {
        return Attribute::make(
            get: fn () => number_format($this->total_received, 2, '.', ','),
        );
    }

    protected function formattedTotalDifference(): Attribute
    {
        return Attribute::make(
            get: fn () => number_format($this->total_difference, 2, '.', ','),
        );
    }

    protected function itemCount(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->reconciliationItems()->count(),
        );
    }

    protected function isCompleted(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === self::STATUS_COMPLETED,
        );
    }
}
