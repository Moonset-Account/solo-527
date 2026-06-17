<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectPayment;
use App\Models\ProjectInvoice;
use App\Models\CollectionRecord;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Carbon\Carbon;

class CashFlowService
{
    public function __construct(
        protected Project $projectModel,
        protected ProjectPayment $paymentModel,
        protected ProjectInvoice $invoiceModel,
        protected CollectionRecord $collectionModel
    ) {}

    public function forecastCashFlow(int $projectId, int $months = 12): Collection
    {
        $project = $this->projectModel->findOrFail($projectId);
        $forecast = collect();

        $startDate = now()->startOfMonth();
        $endDate = now()->addMonths($months)->endOfMonth();

        $historicalPayments = $this->paymentModel
            ->where('project_id', $projectId)
            ->where('payment_date', '>=', now()->subMonths(12))
            ->orderBy('payment_date')
            ->get();

        $monthlyTrend = $this->calculateMonthlyTrend($historicalPayments);
        $unpaidInvoices = $this->invoiceModel
            ->where('project_id', $projectId)
            ->where('status', '!=', ProjectInvoice::STATUS_PAID)
            ->where('due_date', '<=', $endDate)
            ->orderBy('due_date')
            ->get();

        $contractMilestones = $project->contractMilestones()
            ->whereNull('paid_at')
            ->where('due_date', '<=', $endDate)
            ->orderBy('due_date')
            ->get();

        for ($i = 0; $i < $months; $i++) {
            $monthStart = $startDate->copy()->addMonths($i);
            $monthEnd = $monthStart->copy()->endOfMonth();

            $incoming = $this->calculateIncomingForMonth($unpaidInvoices, $contractMilestones, $monthStart, $monthEnd, $monthlyTrend);
            $outgoing = $this->calculateOutgoingForMonth($project, $monthStart, $monthEnd);
            $netCashFlow = $incoming - $outgoing;

            $previousForecast = $forecast->last();
            $openingBalance = $previousForecast ? $previousForecast['closing_balance'] : $this->getOpeningBalance($projectId);
            $closingBalance = $openingBalance + $netCashFlow;

            $forecast->push([
                'month' => $monthStart->format('Y-m'),
                'month_name' => $monthStart->format('Y年m月'),
                'opening_balance' => $openingBalance,
                'incoming' => $incoming,
                'outgoing' => $outgoing,
                'net_cash_flow' => $netCashFlow,
                'closing_balance' => $closingBalance,
                'details' => [
                    'invoice_payments' => $incoming * 0.7,
                    'milestone_payments' => $incoming * 0.2,
                    'other_income' => $incoming * 0.1,
                    'operating_expenses' => $outgoing * 0.6,
                    'material_costs' => $outgoing * 0.3,
                    'other_expenses' => $outgoing * 0.1,
                ],
                'risk_level' => $this->assessRiskLevel($closingBalance, $netCashFlow),
            ]);
        }

        return $forecast;
    }

    public function getPaymentSchedule(int $projectId): Collection
    {
        $project = $this->projectModel->findOrFail($projectId);

        $payments = $this->paymentModel
            ->where('project_id', $projectId)
            ->orderBy('payment_date', 'desc')
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'type' => 'payment',
                    'date' => $payment->payment_date->format('Y-m-d'),
                    'amount' => $payment->amount,
                    'description' => $payment->description,
                    'status' => $payment->status,
                    'invoice_no' => $payment->invoice?->invoice_no,
                    'payer' => $payment->payer_name,
                    'is_reconciled' => $payment->is_reconciled,
                    'created_at' => $payment->created_at,
                ];
            });

        $invoices = $this->invoiceModel
            ->where('project_id', $projectId)
            ->whereIn('status', [ProjectInvoice::STATUS_ISSUED, ProjectInvoice::STATUS_OVERDUE])
            ->orderBy('due_date', 'asc')
            ->get()
            ->map(function ($invoice) {
                return [
                    'id' => $invoice->id,
                    'type' => 'invoice',
                    'date' => $invoice->due_date->format('Y-m-d'),
                    'amount' => $invoice->total_amount,
                    'description' => '发票待收款 - ' . $invoice->invoice_no,
                    'status' => $invoice->status,
                    'invoice_no' => $invoice->invoice_no,
                    'payer' => $invoice->client_name,
                    'is_reconciled' => false,
                    'created_at' => $invoice->created_at,
                    'is_overdue' => $invoice->status === ProjectInvoice::STATUS_OVERDUE,
                    'days_overdue' => $invoice->status === ProjectInvoice::STATUS_OVERDUE
                        ? now()->diffInDays($invoice->due_date)
                        : 0,
                ];
            });

        $milestones = $project->contractMilestones()
            ->whereNull('paid_at')
            ->orderBy('due_date', 'asc')
            ->get()
            ->map(function ($milestone) {
                return [
                    'id' => $milestone->id,
                    'type' => 'milestone',
                    'date' => $milestone->due_date->format('Y-m-d'),
                    'amount' => $milestone->amount,
                    'description' => '合同节点 - ' . $milestone->name,
                    'status' => $milestone->status,
                    'invoice_no' => null,
                    'payer' => $milestone->project->client_name,
                    'is_reconciled' => false,
                    'created_at' => $milestone->created_at,
                ];
            });

        return $payments->merge($invoices)->merge($milestones)
            ->sortByDesc('date')
            ->values();
    }

    public function getCollectionRhythm(int $projectId): array
    {
        $project = $this->projectModel->findOrFail($projectId);

        $allInvoices = $this->invoiceModel
            ->where('project_id', $projectId)
            ->with('payments')
            ->get();

        $paidInvoices = $allInvoices->where('status', ProjectInvoice::STATUS_PAID);
        $overdueInvoices = $allInvoices->where('status', ProjectInvoice::STATUS_OVERDUE);

        $averageCollectionDays = $this->calculateAverageCollectionDays($paidInvoices);
        $collectionRate = $this->calculateCollectionRate($allInvoices);

        $agingReport = $this->generateAgingReport($allInvoices);

        $collectionEfforts = $this->collectionModel
            ->where('project_id', $projectId)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'date' => $record->created_at->format('Y-m-d'),
                    'type' => $record->type,
                    'content' => $record->content,
                    'result' => $record->result,
                    'next_follow_up' => $record->next_follow_up?->format('Y-m-d'),
                    'operator' => $record->operator?->name,
                ];
            });

        return [
            'summary' => [
                'total_invoiced' => $allInvoices->sum('total_amount'),
                'total_received' => $allInvoices->sum('paid_amount'),
                'total_outstanding' => $allInvoices->sum('total_amount') - $allInvoices->sum('paid_amount'),
                'overdue_amount' => $overdueInvoices->sum(function ($invoice) {
                    return $invoice->total_amount - $invoice->paid_amount;
                }),
                'average_collection_days' => $averageCollectionDays,
                'collection_rate' => $collectionRate,
                'invoice_count' => $allInvoices->count(),
                'paid_count' => $paidInvoices->count(),
                'overdue_count' => $overdueInvoices->count(),
            ],
            'aging_report' => $agingReport,
            'collection_trend' => $this->calculateCollectionTrend($projectId),
            'recent_efforts' => $collectionEfforts,
            'recommendations' => $this->generateCollectionRecommendations($project, $overdueInvoices, $averageCollectionDays),
        ];
    }

    protected function calculateMonthlyTrend(Collection $historicalPayments): array
    {
        if ($historicalPayments->isEmpty()) {
            return ['base' => 0, 'growth_rate' => 0];
        }

        $monthlyTotals = $historicalPayments->groupBy(function ($payment) {
            return $payment->payment_date->format('Y-m');
        })->map->sum('amount')->values();

        $base = $monthlyTotals->avg();
        $growthRate = 0;

        if ($monthlyTotals->count() >= 2) {
            $firstHalf = $monthlyTotals->slice(0, (int) ($monthlyTotals->count() / 2))->avg();
            $secondHalf = $monthlyTotals->slice((int) ($monthlyTotals->count() / 2))->avg();
            $growthRate = $firstHalf > 0 ? (($secondHalf - $firstHalf) / $firstHalf) : 0;
        }

        return ['base' => $base, 'growth_rate' => $growthRate];
    }

    protected function calculateIncomingForMonth(Collection $unpaidInvoices, Collection $milestones, Carbon $monthStart, Carbon $monthEnd, array $trend): float
    {
        $invoicePayments = $unpaidInvoices
            ->whereBetween('due_date', [$monthStart, $monthEnd])
            ->sum('total_amount') * 0.85;

        $milestonePayments = $milestones
            ->whereBetween('due_date', [$monthStart, $monthEnd])
            ->sum('amount') * 0.9;

        $baseForecast = $trend['base'] * (1 + $trend['growth_rate']);

        return round(max($invoicePayments + $milestonePayments, $baseForecast * 0.5), 2);
    }

    protected function calculateOutgoingForMonth(Project $project, Carbon $monthStart, Carbon $monthEnd): float
    {
        $monthlyBudget = $project->monthly_budget ?? 0;
        $expenses = $project->expenses()
            ->whereBetween('expense_date', [$monthStart, $monthEnd])
            ->sum('amount');

        return round(max($expenses, $monthlyBudget * 0.8), 2);
    }

    protected function getOpeningBalance(int $projectId): float
    {
        return $this->paymentModel
            ->where('project_id', $projectId)
            ->sum('amount') -
        $this->projectModel->findOrFail($projectId)->expenses()->sum('amount');
    }

    protected function assessRiskLevel(float $closingBalance, float $netCashFlow): string
    {
        if ($closingBalance < 0 || $netCashFlow < -10000) {
            return 'high';
        } elseif ($closingBalance < 50000 || $netCashFlow < 0) {
            return 'medium';
        }

        return 'low';
    }

    protected function calculateAverageCollectionDays(Collection $paidInvoices): float
    {
        if ($paidInvoices->isEmpty()) {
            return 0;
        }

        $totalDays = $paidInvoices->sum(function ($invoice) {
            if ($invoice->paid_at && $invoice->issue_date) {
                return $invoice->paid_at->diffInDays($invoice->issue_date);
            }
            return 0;
        });

        return round($totalDays / $paidInvoices->count(), 1);
    }

    protected function calculateCollectionRate(Collection $invoices): float
    {
        $totalInvoiced = $invoices->sum('total_amount');
        if ($totalInvoiced == 0) {
            return 0;
        }

        $totalPaid = $invoices->sum('paid_amount');
        return round(($totalPaid / $totalInvoiced) * 100, 2);
    }

    protected function generateAgingReport(Collection $invoices): array
    {
        $today = now();

        $buckets = [
            'current' => ['label' => '当期', 'amount' => 0, 'count' => 0],
            '1_30' => ['label' => '逾期1-30天', 'amount' => 0, 'count' => 0],
            '31_60' => ['label' => '逾期31-60天', 'amount' => 0, 'count' => 0],
            '61_90' => ['label' => '逾期61-90天', 'amount' => 0, 'count' => 0],
            '91_180' => ['label' => '逾期91-180天', 'amount' => 0, 'count' => 0],
            'over_180' => ['label' => '逾期180天以上', 'amount' => 0, 'count' => 0],
        ];

        foreach ($invoices as $invoice) {
            $outstanding = $invoice->total_amount - $invoice->paid_amount;
            if ($outstanding <= 0) {
                continue;
            }

            $daysOverdue = $today->diffInDays($invoice->due_date, false);

            if ($daysOverdue <= 0) {
                $bucket = 'current';
            } elseif ($daysOverdue <= 30) {
                $bucket = '1_30';
            } elseif ($daysOverdue <= 60) {
                $bucket = '31_60';
            } elseif ($daysOverdue <= 90) {
                $bucket = '61_90';
            } elseif ($daysOverdue <= 180) {
                $bucket = '91_180';
            } else {
                $bucket = 'over_180';
            }

            $buckets[$bucket]['amount'] += $outstanding;
            $buckets[$bucket]['count']++;
        }

        return $buckets;
    }

    protected function calculateCollectionTrend(int $projectId): Collection
    {
        $trend = collect();

        for ($i = 11; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $monthStart = $month->copy()->startOfMonth();
            $monthEnd = $month->copy()->endOfMonth();

            $received = $this->paymentModel
                ->where('project_id', $projectId)
                ->whereBetween('payment_date', [$monthStart, $monthEnd])
                ->sum('amount');

            $invoiced = $this->invoiceModel
                ->where('project_id', $projectId)
                ->whereBetween('issue_date', [$monthStart, $monthEnd])
                ->sum('total_amount');

            $trend->push([
                'month' => $month->format('Y-m'),
                'month_name' => $month->format('m月'),
                'invoiced' => $invoiced,
                'received' => $received,
                'collection_rate' => $invoiced > 0 ? round(($received / $invoiced) * 100, 2) : 0,
            ]);
        }

        return $trend;
    }

    protected function generateCollectionRecommendations(Project $project, Collection $overdueInvoices, float $averageCollectionDays): array
    {
        $recommendations = collect();

        if ($overdueInvoices->count() > 0) {
            $highValueOverdue = $overdueInvoices->filter(function ($invoice) {
                return ($invoice->total_amount - $invoice->paid_amount) > 50000;
            });

            if ($highValueOverdue->count() > 0) {
                $recommendations->push([
                    'priority' => 'high',
                    'type' => 'high_value',
                    'title' => '大额逾期款项催收',
                    'description' => sprintf('有 %d 笔大额逾期款项（单笔下限5万），建议立即启动专项催收', $highValueOverdue->count()),
                    'amount' => $highValueOverdue->sum(function ($invoice) {
                        return $invoice->total_amount - $invoice->paid_amount;
                    }),
                ]);
            }

            $longOverdue = $overdueInvoices->filter(function ($invoice) {
                return now()->diffInDays($invoice->due_date) > 90;
            });

            if ($longOverdue->count() > 0) {
                $recommendations->push([
                    'priority' => 'high',
                    'type' => 'long_overdue',
                    'title' => '长期逾期款项处理',
                    'description' => sprintf('有 %d 笔款项逾期超过90天，建议考虑法律途径或坏账计提', $longOverdue->count()),
                    'amount' => $longOverdue->sum(function ($invoice) {
                        return $invoice->total_amount - $invoice->paid_amount;
                    }),
                ]);
            }
        }

        if ($averageCollectionDays > 60) {
            $recommendations->push([
                'priority' => 'medium',
                'type' => 'collection_efficiency',
                'title' => '催收效率提升',
                'description' => sprintf('平均回款周期 %.1f 天，超过行业平均水平，建议优化催收流程', $averageCollectionDays),
                'amount' => 0,
            ]);
        }

        return $recommendations->all();
    }
}
