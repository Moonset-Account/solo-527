<?php

namespace App\Services;

use App\Models\NotificationLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    protected $maxRetries;
    protected $retryDelay;

    public function __construct()
    {
        $this->maxRetries = config('notification.retry_times', 3);
        $this->retryDelay = config('notification.retry_delay', 300);
    }

    public function send($channel, $recipient, $subject, $content, $relatedId = null, $relatedType = null)
    {
        $notificationLog = NotificationLog::create([
            'channel' => $channel,
            'recipient' => $recipient,
            'subject' => $subject,
            'content' => $content,
            'status' => 'pending',
            'retry_attempt' => 0,
        ]);

        return $this->attemptSend($notificationLog);
    }

    protected function attemptSend($notificationLog)
    {
        try {
            DB::beginTransaction();

            $result = $this->sendThroughChannel(
                $notificationLog->channel,
                $notificationLog->recipient,
                $notificationLog->subject,
                $notificationLog->content
            );

            if ($result['success']) {
                $notificationLog->update([
                    'status' => 'sent',
                    'sent_at' => now(),
                    'retry_attempt' => $notificationLog->retry_attempt + 1,
                ]);
                DB::commit();
                return ['success' => true, 'log_id' => $notificationLog->id];
            } else {
                throw new \Exception($result['message'] ?? '发送失败');
            }
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->handleFailure($notificationLog, $e->getMessage());
        }
    }

    protected function handleFailure($notificationLog, $errorMessage)
    {
        $notificationLog->update([
            'status' => 'failed',
            'error_message' => $errorMessage,
            'retry_attempt' => $notificationLog->retry_attempt + 1,
        ]);

        Log::error("通知发送失败: {$notificationLog->id}", [
            'channel' => $notificationLog->channel,
            'recipient' => $notificationLog->recipient,
            'error' => $errorMessage,
            'attempt' => $notificationLog->retry_attempt,
        ]);

        if ($notificationLog->retry_attempt < $this->maxRetries) {
            $this->scheduleRetry($notificationLog);
            return ['success' => false, 'retry_scheduled' => true, 'log_id' => $notificationLog->id];
        }

        $this->handleRollback($notificationLog);
        return ['success' => false, 'retry_exhausted' => true, 'log_id' => $notificationLog->id];
    }

    protected function scheduleRetry($notificationLog)
    {
        $delay = $this->retryDelay * pow(2, $notificationLog->retry_attempt - 1);
        
        dispatch(function () use ($notificationLog) {
            $this->retrySend($notificationLog);
        })->delay(now()->addSeconds($delay));
    }

    public function retrySend($notificationLog)
    {
        $notificationLog->update([
            'status' => 'pending',
            'last_retry_at' => now(),
        ]);

        return $this->attemptSend($notificationLog);
    }

    protected function sendThroughChannel($channel, $recipient, $subject, $content)
    {
        switch ($channel) {
            case 'email':
                return $this->sendEmail($recipient, $subject, $content);
            case 'sms':
                return $this->sendSms($recipient, $content);
            case 'wechat':
                return $this->sendWechat($recipient, $content);
            case 'database':
                return ['success' => true];
            default:
                return ['success' => false, 'message' => '不支持的通知渠道'];
        }
    }

    protected function sendEmail($recipient, $subject, $content)
    {
        try {
            \Mail::raw($content, function ($message) use ($recipient, $subject) {
                $message->to($recipient)->subject($subject);
            });
            return ['success' => true];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    protected function sendSms($recipient, $content)
    {
        return ['success' => true];
    }

    protected function sendWechat($recipient, $content)
    {
        return ['success' => true];
    }

    protected function handleRollback($notificationLog)
    {
        Log::critical("通知发送重试次数耗尽，执行回滚策略", [
            'log_id' => $notificationLog->id,
            'channel' => $notificationLog->channel,
            'recipient' => $notificationLog->recipient,
        ]);

        $notificationLog->update([
            'status' => 'failed_permanently',
        ]);

        $adminUsers = \App\Models\User::role('admin')->get();
        foreach ($adminUsers as $admin) {
            \App\Models\NotificationLog::create([
                'channel' => 'database',
                'recipient' => $admin->id,
                'subject' => '通知发送失败告警',
                'content' => "通知 {$notificationLog->id} 发送失败，渠道: {$notificationLog->channel}",
                'status' => 'sent',
                'sent_at' => now(),
            ]);
        }
    }

    public function getFailedNotifications()
    {
        return NotificationLog::whereIn('status', ['failed', 'failed_permanently'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);
    }

    public function retryFailedNotifications($ids = [])
    {
        $query = NotificationLog::where('status', 'failed')
            ->where('retry_attempt', '<', $this->maxRetries);

        if (!empty($ids)) {
            $query->whereIn('id', $ids);
        }

        $notifications = $query->get();
        $results = [];

        foreach ($notifications as $notification) {
            $results[] = $this->retrySend($notification);
        }

        return $results;
    }
}
