<?php

namespace App\Services;

use App\Enums\BatchStatus;
use App\Enums\ConfigKey;
use App\Models\FailedBatch;
use App\Models\RetryLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BatchProcessingService
{
    public function __construct(
        protected ConfigService $configService,
        protected NotificationService $notificationService,
    ) {}

    public function createBatch(string $batchType, mixed $payload, ?User $creator = null, ?string $channel = null): FailedBatch
    {
        return FailedBatch::create([
            'batch_number' => 'BATCH' . date('YmdHis') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
            'batch_type' => $batchType,
            'channel' => $channel,
            'status' => BatchStatus::PENDING->value,
            'payload' => is_array($payload) ? json_encode($payload) : $payload,
            'retry_count' => 0,
            'max_retries' => $this->configService->getInt(ConfigKey::BATCH_RETRY_MAX_ATTEMPTS, 3),
            'created_by' => $creator?->id,
        ]);
    }

    public function retryBatch(FailedBatch $batch, ?User $operator = null): bool
    {
        if (!$batch->canRetry()) {
            throw new \Exception('该批次无法重试或已达到最大重试次数');
        }

        return DB::transaction(function () use ($batch, $operator) {
            $batch->increment('retry_count');
            $batch->update(['status' => BatchStatus::RETRYING->value]);

            $retryLog = RetryLog::create([
                'failed_batch_id' => $batch->id,
                'retry_number' => $batch->retry_count,
                'status' => BatchStatus::PROCESSING->value,
                'started_at' => now(),
                'retry_by' => $operator?->id,
            ]);

            try {
                $success = $this->executeBatch($batch);

                if ($success) {
                    $retryLog->update([
                        'status' => BatchStatus::COMPLETED->value,
                        'completed_at' => now(),
                        'success_count' => 1,
                        'failed_count' => 0,
                    ]);
                    $batch->update(['status' => BatchStatus::COMPLETED->value]);
                } else {
                    $delay = $this->configService->getInt(ConfigKey::RETRY_INTERVAL_MINUTES, 5);
                    $retryLog->update([
                        'status' => BatchStatus::FAILED->value,
                        'completed_at' => now(),
                        'success_count' => 0,
                        'failed_count' => 1,
                        'error_message' => 'Processing failed',
                    ]);
                    $batch->update([
                        'status' => BatchStatus::FAILED->value,
                        'next_retry_at' => $batch->retry_count < $batch->max_retries
                            ? now()->addMinutes($delay)
                            : null,
                    ]);
                }

                if ($batch->creator) {
                    $this->notificationService->notifyBatchRetryCompleted($batch, $retryLog);
                }

                return $success;
            } catch (\Exception $e) {
                $retryLog->update([
                    'status' => BatchStatus::FAILED->value,
                    'completed_at' => now(),
                    'success_count' => 0,
                    'failed_count' => 1,
                    'error_message' => $e->getMessage(),
                    'error_details' => $e->getTraceAsString(),
                ]);

                $delay = $this->configService->getInt(ConfigKey::RETRY_INTERVAL_MINUTES, 5);
                $batch->update([
                    'status' => BatchStatus::FAILED->value,
                    'error_message' => $e->getMessage(),
                    'next_retry_at' => $batch->retry_count < $batch->max_retries
                        ? now()->addMinutes($delay)
                        : null,
                ]);

                Log::error("Batch retry failed [{$batch->batch_number}]: " . $e->getMessage());
                return false;
            }
        });
    }

    protected function executeBatch(FailedBatch $batch): bool
    {
        return match ($batch->batch_type) {
            'payment' => $this->executePaymentBatch($batch),
            'notification' => $this->executeNotificationBatch($batch),
            'sync' => $this->executeSyncBatch($batch),
            default => true,
        };
    }

    protected function executePaymentBatch(FailedBatch $batch): bool
    {
        $payload = json_decode($batch->payload, true) ?? [];
        $quotationId = $payload['quotation_id'] ?? null;
        if (!$quotationId) {
            return false;
        }

        $quotation = \App\Models\Quotation::find($quotationId);
        if (!$quotation) {
            return false;
        }

        try {
            $quotation->update([
                'payment_status' => 'paid',
                'paid_at' => now(),
                'payment_transaction_id' => 'BATCH_' . $batch->batch_number,
            ]);
            return true;
        } catch (\Exception $e) {
            Log::error("Payment batch execution failed: " . $e->getMessage());
            return false;
        }
    }

    protected function executeNotificationBatch(FailedBatch $batch): bool
    {
        try {
            $payload = json_decode($batch->payload, true) ?? [];
            $channel = $payload['channel'] ?? 'database';
            $recipients = $payload['recipients'] ?? [];
            $title = $payload['title'] ?? 'Notification';
            $content = $payload['content'] ?? '';
            $data = $payload['data'] ?? [];

            return $this->notificationService->sendViaChannel($channel, $recipients, $title, $content, $data);
        } catch (\Exception $e) {
            Log::error("Notification batch execution failed: " . $e->getMessage());
            return false;
        }
    }

    protected function executeSyncBatch(FailedBatch $batch): bool
    {
        try {
            app(FinancialReviewService::class)->syncDiscrepanciesToDashboard();
            return true;
        } catch (\Exception $e) {
            Log::error("Sync batch execution failed: " . $e->getMessage());
            return false;
        }
    }

    public function getBatchStats(): array
    {
        return [
            'total' => FailedBatch::count(),
            'pending' => FailedBatch::where('status', BatchStatus::PENDING->value)->count(),
            'processing' => FailedBatch::where('status', BatchStatus::PROCESSING->value)->count(),
            'completed' => FailedBatch::where('status', BatchStatus::COMPLETED->value)->count(),
            'failed' => FailedBatch::where('status', BatchStatus::FAILED->value)->count(),
            'partially_completed' => FailedBatch::where('status', BatchStatus::PARTIALLY_COMPLETED->value)->count(),
            'retrying' => FailedBatch::where('status', BatchStatus::RETRYING->value)->count(),
            'cancelled' => FailedBatch::where('status', BatchStatus::CANCELLED->value)->count(),
            'can_retry' => FailedBatch::where('status', BatchStatus::FAILED->value)
                ->whereColumn('retry_count', '<', 'max_retries')
                ->count(),
            'total_retries' => RetryLog::count(),
        ];
    }

    public function getRetryHistory(FailedBatch $batch): \Illuminate\Database\Eloquent\Collection
    {
        return $batch->retryLogs()
            ->with('retrier')
            ->latest()
            ->get();
    }
}
