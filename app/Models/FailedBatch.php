<?php

namespace App\Models;

use App\Enums\BatchStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FailedBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_number',
        'batch_type',
        'status',
        'total_items',
        'success_count',
        'failed_count',
        'payload',
        'error_message',
        'error_trace',
        'retry_count',
        'max_retries',
        'started_at',
        'completed_at',
        'failed_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => BatchStatus::class,
            'total_items' => 'integer',
            'success_count' => 'integer',
            'failed_count' => 'integer',
            'payload' => 'array',
            'error_trace' => 'array',
            'retry_count' => 'integer',
            'max_retries' => 'integer',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    public function retryLogs()
    {
        return $this->hasMany(RetryLog::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('batch_type', $type);
    }

    public function scopeByStatus($query, BatchStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', BatchStatus::FAILED);
    }

    public function scopeRetrying($query)
    {
        return $query->where('status', BatchStatus::RETRYING);
    }

    public function scopeCanRetry($query, int $maxRetries = 3)
    {
        return $query->whereIn('status', [BatchStatus::FAILED, BatchStatus::PARTIALLY_COMPLETED])
            ->whereColumn('retry_count', '<', 'max_retries');
    }

    public function isFailed(): bool
    {
        return $this->status === BatchStatus::FAILED;
    }

    public function isProcessing(): bool
    {
        return $this->status === BatchStatus::PROCESSING;
    }

    public function isCompleted(): bool
    {
        return $this->status === BatchStatus::COMPLETED;
    }

    public function canRetry(int $maxRetries = null): bool
    {
        $max = $maxRetries ?? $this->max_retries ?? 3;
        return in_array($this->status, [BatchStatus::FAILED, BatchStatus::PARTIALLY_COMPLETED])
            && $this->retry_count < $max;
    }

    public function markFailed(string $errorMessage, array $errorTrace = []): bool
    {
        $this->status = BatchStatus::FAILED;
        $this->error_message = $errorMessage;
        $this->error_trace = $errorTrace;
        $this->failed_at = now();
        return $this->save();
    }

    public function markProcessing(): bool
    {
        $this->status = BatchStatus::PROCESSING;
        $this->started_at = now();
        return $this->save();
    }

    public function markCompleted(int $successCount, int $failedCount): bool
    {
        $this->status = $failedCount > 0 ? BatchStatus::PARTIALLY_COMPLETED : BatchStatus::COMPLETED;
        $this->success_count = $successCount;
        $this->failed_count = $failedCount;
        $this->completed_at = now();
        return $this->save();
    }

    public function incrementRetry(): void
    {
        $this->retry_count++;
        $this->status = BatchStatus::RETRYING;
        $this->save();
    }

    public function generateBatchNumber(): string
    {
        $date = now()->format('Ymd');
        $prefix = 'BATCH';
        $last = self::where('batch_number', 'like', "{$prefix}{$date}%")
            ->latest('id')
            ->first();

        $sequence = $last ? (int) substr($last->batch_number, -4) + 1 : 1;

        return "{$prefix}{$date}" . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
