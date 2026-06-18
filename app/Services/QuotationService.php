<?php

namespace App\Services;

use App\Enums\ConfigKey;
use App\Models\Quotation;
use App\Models\User;

class QuotationService
{
    public function __construct(protected ConfigService $configService) {}

    public function getQuotationStats(?User $user = null): array
    {
        $query = Quotation::query();

        if ($user && $user->isSupplier()) {
            $query->where('supplier_id', $user->supplier_id);
        }

        $reminderDays = $this->configService->getInt(ConfigKey::QUOTATION_EXPIRY_REMINDER_DAYS, 7);

        return [
            'total' => (clone $query)->count(),
            'draft' => (clone $query)->where('status', 'draft')->count(),
            'active' => (clone $query)->where('status', 'active')->count(),
            'expiring' => (clone $query)
                ->where('status', 'active')
                ->where('valid_until', '<=', now()->addDays($reminderDays))
                ->where('valid_until', '>=', now())
                ->count(),
            'expired' => (clone $query)->where('status', 'expired')->count(),
            'reviewed' => (clone $query)->where('status', 'reviewed')->count(),
            'rejected' => (clone $query)->where('status', 'rejected')->count(),
            'total_amount' => (clone $query)->whereIn('status', ['active', 'reviewed'])->sum('total_amount'),
        ];
    }
}
