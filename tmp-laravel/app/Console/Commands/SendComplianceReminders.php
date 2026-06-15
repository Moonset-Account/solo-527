<?php

namespace App\Console\Commands;

use App\Services\ReminderService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendComplianceReminders extends Command
{
    protected $signature = 'reminders:send';

    protected $description = '发送所有合规提醒（缺口到期、逾期、待审核等）';

    protected $reminderService;

    public function __construct(ReminderService $reminderService)
    {
        parent::__construct();
        $this->reminderService = $reminderService;
    }

    public function handle()
    {
        $this->info('开始发送合规提醒...');

        try {
            $results = $this->reminderService->processAllReminders();

            $this->info('提醒发送完成:');
            $this->line("- 缺口到期提醒: {$results['gap_due']} 条");
            $this->line("- 缺口逾期提醒: {$results['gap_overdue']} 条");
            $this->line("- 检查清单到期: {$results['checklist_due']} 条");
            $this->line("- 待审核提醒: {$results['review_pending']} 条");
            $this->line("- 总计发送: {$results['total_sent']} 条");

            Log::info('合规提醒发送完成', $results);

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('提醒发送失败: ' . $e->getMessage());
            Log::error('合规提醒发送失败: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return self::FAILURE;
        }
    }
}
