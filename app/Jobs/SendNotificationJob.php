<?php

namespace App\Jobs;

use App\Models\FailedBatch;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [60, 180, 360];

    public function __construct(
        protected string $channel,
        protected array $recipients,
        protected string $title,
        protected string $content,
        protected array $data = [],
    ) {}

    public function handle(NotificationService $service): void
    {
        try {
            $result = $service->sendViaChannel(
                $this->channel,
                $this->recipients,
                $this->title,
                $this->content,
                $this->data
            );

            if (!$result) {
                $this->fail(new \RuntimeException("Notification channel [{$this->channel}] returned failure"));
            }
        } catch (\Exception $e) {
            Log::error("SendNotificationJob failed: {$e->getMessage()}", [
                'channel' => $this->channel,
                'recipients' => $this->recipients,
                'exception' => $e,
            ]);
            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        FailedBatch::create([
            'batch_type' => 'notification',
            'channel' => $this->channel,
            'payload' => json_encode([
                'recipients' => $this->recipients,
                'title' => $this->title,
                'content' => $this->content,
                'data' => $this->data,
            ]),
            'error_message' => $exception->getMessage(),
            'status' => 'failed',
            'retry_count' => 0,
            'next_retry_at' => now()->addHour(),
        ]);
    }
}
