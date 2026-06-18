<?php

namespace App\Console\Commands;

use App\Enums\ConfigKey;
use App\Models\Quotation;
use App\Models\QuotationExpiryReminder;
use App\Services\ConfigService;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class CheckQuotationExpiry extends Command
{
    protected $signature = 'quotations:check-expiry';

    protected $description = '检查即将过期和已过期的报价单，并发送提醒给财务复核人';

    public function __construct(
        protected ConfigService $configService,
        protected NotificationService $notificationService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $reminderDays = (int) $this->configService->get(ConfigKey::QUOTATION_EXPIRY_REMINDER_DAYS->value, 7);
        $expiryDays = (int) $this->configService->get(ConfigKey::QUOTATION_EXPIRY_DAYS->value, 30);

        $today = now();
        $reminderDate = $today->copy()->addDays($reminderDays);
        $expiredDate = $today->copy();

        $expiringQuotations = Quotation::where('status', 'active')
            ->where('valid_until', '<=', $reminderDate)
            ->where('valid_until', '>', $expiredDate)
            ->get();

        $expiredQuotations = Quotation::where('status', 'active')
            ->where('valid_until', '<=', $expiredDate)
            ->update(['status' => 'expired']);

        $this->info("已标记 {$expiredQuotations} 个过期报价单");
        $this->info("即将过期报价单: {$expiringQuotations->count()} 个");

        foreach ($expiringQuotations as $quotation) {
            $daysLeft = $today->diffInDays($quotation->valid_until);

            QuotationExpiryReminder::create([
                'quotation_id' => $quotation->id,
                'reminder_type' => $daysLeft <= 0 ? 'expired' : 'expiring',
                'days_left' => $daysLeft,
                'sent_at' => now(),
            ]);

            $this->notificationService->sendQuotationExpiryNotification($quotation, $daysLeft);

            $this->line("  - 报价单 #{$quotation->id} ({$daysLeft}天后过期) 已发送提醒");
        }

        return self::SUCCESS;
    }
}
