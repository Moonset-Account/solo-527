<?php

namespace App\Models;

use App\Enums\BatchStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RetryLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'failed_batch_id',
        'retry_number',
        'status',
        'started_at',
        'completed_at',
        'failed_at',
        'error_message',
        'error_trace',
        'success_count',
        'failed_count',
        'retry_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => BatchStatus::class,
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'failed_at' => 'datetime',
            'error_trace' => 'array',
            'success_count' => 'integer',
            'failed_count' => 'integer',
            'retry_number' => 'integer',
        ];
    }

    public function failedBatch()
    {
        return $this->belongsTo(FailedBatch::class);
    }

    public function retrier()
    {
        return $this->belongsTo(User::class, 'retry_by');
    }

    public function scopeByBatch($query, int $batchId)
    {
        return $query->where('failed_batch_id', $batchId);
    }

    public function scopeSuccessful($query)
    {
        return $query->where('status', BatchStatus::COMPLETED);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', BatchStatus::FAILED);
    }

    public function isSuccessful(): bool
    {
        return $this->status === BatchStatus::COMPLETED;
    }

    public function isFailed(): bool
    {
        return $this->status === BatchStatus::FAILED;
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

    public function markFailed(string $errorMessage, array $errorTrace = []): bool
    {
        $this->status = BatchStatus::FAILED;
        $this->error_message = $errorMessage;
        $this->error_trace = $errorTrace;
        $this->failed_at = now();
        return $this->save();
    }

    public function getDuration(): ?int
    {
        if (!$this->started_at) {
            return null;
        }

        $endTime = $this->completed_at ?? $this->failed_at ?? now();
        return $endTime->diffInSeconds($this->started_at);
    }
}
