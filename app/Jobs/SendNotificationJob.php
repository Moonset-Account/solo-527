<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Models\NotificationLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 1;
    public $timeout = 60;

    protected $notification;
    protected $maxRetries = 5;
    protected $baseDelay = 30;

    public function __construct(Notification $notification)
    {
        $this->notification = $notification;
    }

    public function handle()
    {
        DB::beginTransaction();
        
        try {
            $log = NotificationLog::create([
                'notification_id' => $this->notification->id,
                'channel' => $this->notification->channel,
                'recipient' => $this->notification->recipient,
                'status' => 'sending',
                'attempt' => $this->notification->retry_count + 1,
            ]);

            $result = $this->sendViaChannel(
                $this->notification->channel,
                $this->notification->recipient,
                $this->notification->title,
                $this->notification->content
            );

            if ($result['success']) {
                $log->update([
                    'status' => 'success',
                    'sent_at' => now(),
                    'response' => $result['response'] ?? null,
                ]);

                $this->notification->update([
                    'status' => 'sent',
                    'sent_at' => now(),
                ]);

                DB::commit();
            } else {
                throw new \Exception($result['error'] ?? '发送失败');
            }
        } catch (\Exception $e) {
            DB::rollBack();

            $retryCount = $this->notification->retry_count + 1;
            
            if (isset($log)) {
                $log->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'failed_at' => now(),
                ]);
            }

            if ($retryCount < $this->maxRetries) {
                $this->notification->increment('retry_count');
                $this->notification->update([
                    'status' => 'retrying',
                    'last_error' => $e->getMessage(),
                ]);

                $delay = $this->calculateDelay($retryCount);
                self::dispatch($this->notification)->delay(now()->addSeconds($delay));
            } else {
                $this->notification->update([
                    'status' => 'failed',
                    'last_error' => $e->getMessage(),
                    'failed_at' => now(),
                ]);

                $this->handleRollback();
            }

            Log::error("Notification send failed: {$e->getMessage()}", [
                'notification_id' => $this->notification->id,
                'retry_count' => $retryCount,
            ]);
        }
    }

    protected function sendViaChannel($channel, $recipient, $title, $content)
    {
        switch ($channel) {
            case 'email':
                return $this->sendEmail($recipient, $title, $content);
            case 'sms':
                return $this->sendSms($recipient, $title, $content);
            case 'wechat':
                return $this->sendWechat($recipient, $title, $content);
            case 'system':
                return ['success' => true, 'response' => '系统通知已发送'];
            default:
                return ['success' => false, 'error' => '不支持的通知渠道'];
        }
    }

    protected function sendEmail($recipient, $title, $content)
    {
        try {
            if (filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
                return ['success' => true, 'response' => '邮件发送模拟成功'];
            }
            return ['success' => false, 'error' => '邮箱格式不正确'];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    protected function sendSms($recipient, $title, $content)
    {
        try {
            if (preg_match('/^1[3-9]\d{9}$/', $recipient)) {
                return ['success' => true, 'response' => '短信发送模拟成功'];
            }
            return ['success' => false, 'error' => '手机号格式不正确'];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    protected function sendWechat($recipient, $title, $content)
    {
        try {
            return ['success' => true, 'response' => '微信通知发送模拟成功'];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    protected function calculateDelay($attempt)
    {
        return $this->baseDelay * pow(2, $attempt - 1);
    }

    protected function handleRollback()
    {
        if ($this->notification->related_type && $this->notification->related_id) {
            Log::warning("Notification failed permanently, rollback needed for: {$this->notification->related_type}:{$this->notification->related_id}");
        }
    }
}
