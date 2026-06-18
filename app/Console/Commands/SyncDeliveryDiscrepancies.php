<?php

namespace App\Console\Commands;

use App\Enums\ConfigKey;
use App\Services\ConfigService;
use App\Services\FinancialReviewService;
use Illuminate\Console\Command;

class SyncDeliveryDiscrepancies extends Command
{
    protected $signature = 'sync:delivery-discrepancies';

    protected $description = '将财务复核结果同步到交付差异看板';

    public function __construct(
        protected ConfigService $configService,
        protected FinancialReviewService $financialService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        if (!$this->configService->getBoolean(ConfigKey::DELIVERY_DISCREPANCY_SYNC_ENABLED->value, true)) {
            $this->warn('交付差异看板同步已在系统配置中禁用');
            return self::SUCCESS;
        }

        $this->info('开始同步交付差异数据...');

        $count = $this->financialService->syncDiscrepanciesToDashboard();

        $this->info("同步完成: {$count} 条差异记录已同步");

        return self::SUCCESS;
    }
}
