<?php

namespace App\Console\Commands;

use App\Enums\ConfigKey;
use App\Services\ConfigService;
use App\Services\SupplierRiskService;
use Illuminate\Console\Command;

class AssessSupplierRisk extends Command
{
    protected $signature = 'suppliers:assess-risk';

    protected $description = '自动评估所有供应商的风险等级';

    public function __construct(
        protected ConfigService $configService,
        protected SupplierRiskService $riskService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        if (!$this->configService->getBoolean(ConfigKey::SUPPLIER_RISK_ASSESSMENT_ENABLED->value, true)) {
            $this->warn('供应商风险评估已在系统配置中禁用');
            return self::SUCCESS;
        }

        $this->info('开始评估供应商风险等级...');

        $results = $this->riskService->assessAllSuppliers();

        $this->info("评估完成:");
        $this->line("  高风险: {$results['high']}");
        $this->line("  中风险: {$results['medium']}");
        $this->line("  低风险: {$results['low']}");
        $this->line("  无风险: {$results['none']}");

        return self::SUCCESS;
    }
}
