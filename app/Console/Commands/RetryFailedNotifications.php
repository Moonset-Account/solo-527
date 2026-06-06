<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\NotificationService;

class RetryFailedNotifications extends Command
{
    protected $signature = 'notifications:retry-failed';
    protected $description = '重试发送失败的通知';

    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    public function handle()
    {
        $this->info('开始重试失败的通知...');

        $count = $this->notificationService->retryFailedNotifications();

        if ($count > 0) {
            $this->info("已尝试重新发送 {$count} 条通知");
        } else {
            $this->info('没有需要重试的通知');
        }

        return Command::SUCCESS;
    }
}
