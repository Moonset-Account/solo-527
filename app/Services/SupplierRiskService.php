<?php

namespace App\Services;

use App\Enums\SupplierRiskLevel;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SupplierRiskService
{
    public function __construct(
        protected NotificationService $notificationService,
        protected ConfigService $configService,
    ) {}

    public function calculateRiskScore(Supplier $supplier): int
    {
        $score = 0;

        if ($supplier->on_time_delivery_rate !== null) {
            if ($supplier->on_time_delivery_rate < 70) {
                $score += 2;
            } elseif ($supplier->on_time_delivery_rate < 85) {
                $score += 1;
            }
        }

        if ($supplier->quality_rating !== null) {
            if ($supplier->quality_rating < 3) {
                $score += 2;
            } elseif ($supplier->quality_rating < 4) {
                $score += 1;
            }
        }

        $ninetyDaysAgo = now()->subDays(90);
        $recentRejections = \App\Models\Quotation::where('supplier_id', $supplier->id)
            ->where('status', 'rejected')
            ->where('created_at', '>=', $ninetyDaysAgo)
            ->count();

        if ($recentRejections >= 5) {
            $score += 2;
        } elseif ($recentRejections >= 2) {
            $score += 1;
        }

        if (!$supplier->cooperation_since || now()->diffInDays($supplier->cooperation_since) < 180) {
            $score += 1;
        }

        if ($supplier->is_blacklisted) {
            $score += 2;
        }

        return min($score, 5);
    }

    public function determineRiskLevel(int $score): SupplierRiskLevel
    {
        return match (true) {
            $score >= 5 => SupplierRiskLevel::BLACKLISTED,
            $score >= 4 => SupplierRiskLevel::CRITICAL,
            $score >= 3 => SupplierRiskLevel::HIGH,
            $score >= 1 => SupplierRiskLevel::MEDIUM,
            default => SupplierRiskLevel::LOW,
        };
    }

    public function assessSupplierRisk(Supplier $supplier, ?User $operator = null): Supplier
    {
        return DB::transaction(function () use ($supplier, $operator) {
            $score = $this->calculateRiskScore($supplier);
            $newLevel = $this->determineRiskLevel($score);

            if ($newLevel->value !== $supplier->risk_level) {
                $supplier->riskLogs()->create([
                    'old_level' => $supplier->risk_level,
                    'new_level' => $newLevel->value,
                    'risk_score' => $score,
                    'reason' => "自动风险评估: 得分 {$score}",
                    'assessed_by' => $operator?->id,
                ]);

                $supplier->update(['risk_level' => $newLevel->value, 'risk_score' => $score]);

                if ($operator) {
                    $this->notificationService->notifySupplierRiskChanged($supplier, $operator);
                }
            }

            return $supplier->fresh();
        });
    }

    public function assessAllSuppliers(): array
    {
        $results = [
            'high' => 0,
            'medium' => 0,
            'low' => 0,
            'none' => 0,
        ];

        Supplier::active()->chunk(50, function ($suppliers) use (&$results) {
            foreach ($suppliers as $supplier) {
                $level = $supplier->risk_level;
                if ($level === SupplierRiskLevel::HIGH->value || $level === SupplierRiskLevel::CRITICAL->value || $level === SupplierRiskLevel::BLACKLISTED->value) {
                    $results['high']++;
                } elseif ($level === SupplierRiskLevel::MEDIUM->value) {
                    $results['medium']++;
                } elseif ($level === SupplierRiskLevel::LOW->value) {
                    $results['low']++;
                } else {
                    $results['none']++;
                }

                try {
                    $this->assessSupplierRisk($supplier);
                } catch (\Exception $e) {
                }
            }
        });

        return $results;
    }

    public function getDetailedRiskAnalysis(Supplier $supplier): array
    {
        $score = $this->calculateRiskScore($supplier);
        $level = $this->determineRiskLevel($score);

        return [
            'score' => $score,
            'level' => $level->value,
            'level_label' => $level->label(),
            'factors' => [
                'on_time_delivery_rate' => $supplier->on_time_delivery_rate,
                'quality_rating' => $supplier->quality_rating,
                'cooperation_days' => $supplier->cooperation_since ? now()->diffInDays($supplier->cooperation_since) : null,
                'is_blacklisted' => $supplier->is_blacklisted,
            ],
            'recent_quotations' => [
                'total' => \App\Models\Quotation::where('supplier_id', $supplier->id)->count(),
                'accepted' => \App\Models\Quotation::where('supplier_id', $supplier->id)->whereIn('status', ['reviewed', 'active'])->count(),
                'rejected' => \App\Models\Quotation::where('supplier_id', $supplier->id)->where('status', 'rejected')->count(),
            ],
        ];
    }

    public function getSupplierRiskStats(): array
    {
        return [
            'total' => Supplier::count(),
            SupplierRiskLevel::LOW->value => Supplier::where('risk_level', SupplierRiskLevel::LOW->value)->count(),
            SupplierRiskLevel::MEDIUM->value => Supplier::where('risk_level', SupplierRiskLevel::MEDIUM->value)->count(),
            SupplierRiskLevel::HIGH->value => Supplier::where('risk_level', SupplierRiskLevel::HIGH->value)->count(),
            SupplierRiskLevel::CRITICAL->value => Supplier::where('risk_level', SupplierRiskLevel::CRITICAL->value)->count(),
            SupplierRiskLevel::BLACKLISTED->value => Supplier::where('risk_level', SupplierRiskLevel::BLACKLISTED->value)->orWhere('is_blacklisted', true)->count(),
            'active' => Supplier::where('is_active', true)->count(),
        ];
    }
}
