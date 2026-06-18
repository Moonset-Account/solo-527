<?php

namespace App\Console\Commands;

use App\Enums\BatchStatus;
use App\Enums\ConfigKey;
use App\Models\FailedBatch;
use App\Services\BatchProcessingService;
use App\Services\ConfigService;
use Illuminate\Console\Command;

class RetryFailedBatches extends Command
{
    protected $signature = 'batches:retry-failed';

    protected $description = '自动重试失败的批次任务';

    public function __construct(
        protected ConfigService $configService,
        protected BatchProcessingService $batchService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $maxAttempts = (int) $this->configService->get(ConfigKey::BATCH_RETRY_MAX_ATTEMPTS->value, 3);

        $failedBatches = FailedBatch::where('status', BatchStatus::FAILED->value)
            ->where('retry_count', '<', $maxAttempts)
            ->whereNull('next_retry_at')
            ->orWhere('next_retry_at', '<=', now())
            ->get();

        $this->info("待重试批次: {$failedBatches->count()} 个");

        $successCount = 0;
        foreach ($failedBatches as $batch) {
            try {
                $result = $this->batchService->retryBatch($batch);

                if ($result) {
                    $successCount++;
                    $this->info("  ✓ 批次 #{$batch->id} 重试成功");
                } else {
                    $this->warn("  ✗ 批次 #{$batch->id} 重试失败 ({$batch->retry_count}/{$maxAttempts})");
                }
            } catch (\Exception $e) {
                $this->error("  ✗ 批次 #{$batch->id} 异常: {$e->getMessage()}");
            }
        }

        $this->info("重试完成: 成功 {$successCount}/{$failedBatches->count()}");

        return self::SUCCESS;
    }
}
