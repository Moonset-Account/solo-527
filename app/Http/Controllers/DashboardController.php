<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $startDate = $request->input('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());
        $assigneeId = $request->input('assignee_id');

        $cacheKey = "dashboard:{$startDate}:{$endDate}:{$assigneeId}";
        $data = Cache::tags(['dashboard'])->remember($cacheKey, 300, function () use ($startDate, $endDate, $assigneeId) {
            return $this->computeDashboardData($startDate, $endDate, $assigneeId);
        });

        $operators = User::whereIn('role', ['admin', 'operator'])
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->toArray();

        return Inertia::render('Dashboard/Index', [
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'assignee_id' => $assigneeId ? (int) $assigneeId : null,
            ],
            'operators' => $operators,
            'stats' => $data['stats'],
            'sourceConversion' => $data['sourceConversion'],
            'qualityReport' => $data['qualityReport'],
            'statusTrend' => $data['statusTrend'],
            'contractPendingList' => $data['contractPendingList'],
        ]);
    }

    private function computeDashboardData(string $startDate, string $endDate, ?int $assigneeId): array
    {
        $baseQuery = Lead::query()
            ->filterByPeriod($startDate, $endDate)
            ->byAssignee($assigneeId);

        $stats = $this->getStats(clone $baseQuery);
        $sourceConversion = $this->getSourceConversion(clone $baseQuery);
        $qualityReport = $this->getQualityReport(clone $baseQuery, $startDate, $endDate, $assigneeId);
        $statusTrend = $this->getStatusTrend($startDate, $endDate, $assigneeId);
        $contractPendingList = $this->getContractPendingList(clone $baseQuery);

        return compact('stats', 'sourceConversion', 'qualityReport', 'statusTrend', 'contractPendingList');
    }

    private function getStats($query): array
    {
        $statsQuery = (clone $query);
        $total = (clone $statsQuery)->count();
        $contacted = (clone $statsQuery)->whereIn('status', ['contacted', 'consulting', 'quoted', 'contract_pending', 'signed', 'treatment', 'completed'])->count();
        $quoted = (clone $statsQuery)->whereIn('status', ['quoted', 'contract_pending', 'signed', 'treatment', 'completed'])->count();
        $signed = (clone $statsQuery)->whereIn('status', ['signed', 'treatment', 'completed'])->count();
        $lost = (clone $statsQuery)->where('status', 'lost')->count();
        $totalRevenue = (clone $statsQuery)->whereIn('status', ['signed', 'treatment', 'completed'])->sum('contract_amount');
        $ocean = (clone $statsQuery)->where('is_in_ocean', true)->count();

        return [
            'total' => $total,
            'contacted' => $contacted,
            'quoted' => $quoted,
            'signed' => $signed,
            'lost' => $lost,
            'ocean' => $ocean,
            'contactRate' => $total > 0 ? round($contacted / $total * 100, 1) : 0,
            'quoteRate' => $contacted > 0 ? round($quoted / $contacted * 100, 1) : 0,
            'signRate' => $quoted > 0 ? round($signed / $quoted * 100, 1) : 0,
            'conversionRate' => $total > 0 ? round($signed / $total * 100, 1) : 0,
            'lostRate' => $total > 0 ? round($lost / $total * 100, 1) : 0,
            'totalRevenue' => round($totalRevenue ?? 0, 2),
            'avgOrderValue' => $signed > 0 ? round(($totalRevenue ?? 0) / $signed, 2) : 0,
        ];
    }

    private function getSourceConversion($query): array
    {
        $sourceLabels = Lead::getSourceLabels();
        $results = (clone $query)
            ->select(
                'source',
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN status IN ('contacted', 'consulting', 'quoted', 'contract_pending', 'signed', 'treatment', 'completed') THEN 1 ELSE 0 END) as contacted"),
                DB::raw("SUM(CASE WHEN status IN ('quoted', 'contract_pending', 'signed', 'treatment', 'completed') THEN 1 ELSE 0 END) as quoted"),
                DB::raw("SUM(CASE WHEN status IN ('signed', 'treatment', 'completed') THEN 1 ELSE 0 END) as signed"),
                DB::raw("SUM(CASE WHEN status IN ('signed', 'treatment', 'completed') THEN contract_amount ELSE 0 END) as revenue"),
                DB::raw("SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost")
            )
            ->groupBy('source')
            ->orderBy('total', 'desc')
            ->get();

        return $results->map(function ($row) use ($sourceLabels) {
            $total = (int) $row->total;
            $contacted = (int) $row->contacted;
            $quoted = (int) $row->quoted;
            $signed = (int) $row->signed;
            return [
                'source' => $row->source,
                'source_label' => $sourceLabels[$row->source] ?? $row->source,
                'total' => $total,
                'contacted' => $contacted,
                'quoted' => $quoted,
                'signed' => $signed,
                'lost' => (int) $row->lost,
                'contact_rate' => $total > 0 ? round($contacted / $total * 100, 1) : 0,
                'quote_rate' => $contacted > 0 ? round($quoted / $contacted * 100, 1) : 0,
                'sign_rate' => $quoted > 0 ? round($signed / $quoted * 100, 1) : 0,
                'conversion_rate' => $total > 0 ? round($signed / $total * 100, 1) : 0,
                'revenue' => round((float) $row->revenue, 2),
                'avg_revenue' => $signed > 0 ? round((float) $row->revenue / $signed, 2) : 0,
            ];
        })->toArray();
    }

    private function getQualityReport($query, string $startDate, string $endDate, ?int $assigneeId): array
    {
        $qualityLabels = Lead::getQualityLabels();
        $results = (clone $query)
            ->select(
                'quality',
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN status IN ('signed', 'treatment', 'completed') THEN 1 ELSE 0 END) as signed"),
                DB::raw("SUM(CASE WHEN status IN ('signed', 'treatment', 'completed') THEN contract_amount ELSE 0 END) as revenue")
            )
            ->groupBy('quality')
            ->orderBy('quality')
            ->get();

        $qualityBreakdown = $results->map(function ($row) use ($qualityLabels) {
            $total = (int) $row->total;
            $signed = (int) $row->signed;
            return [
                'quality' => $row->quality,
                'quality_label' => $qualityLabels[$row->quality] ?? $row->quality,
                'total' => $total,
                'signed' => $signed,
                'conversion_rate' => $total > 0 ? round($signed / $total * 100, 1) : 0,
                'avg_amount' => $signed > 0 ? round((float) $row->revenue / $signed, 2) : 0,
            ];
        })->toArray();

        $contractPendingDetails = Lead::query()
            ->filterByPeriod($startDate, $endDate)
            ->byAssignee($assigneeId)
            ->where('status', 'contract_pending')
            ->with(['assignee:id,name', 'owner:id,name', 'quoteVersion:id,version,name'])
            ->select([
                'id', 'name', 'phone', 'quality', 'source',
                'contract_pending_explanation', 'contract_amount',
                'assignee_id', 'owner_id', 'quote_version_id', 'created_at'
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($lead) {
                return [
                    'id' => $lead->id,
                    'name' => $lead->name,
                    'phone' => $lead->phone,
                    'quality' => $lead->quality,
                    'quality_label' => $lead->quality_label,
                    'source' => $lead->source,
                    'source_label' => $lead->source_label,
                    'contract_pending_explanation' => $lead->contract_pending_explanation,
                    'contract_amount' => $lead->contract_amount ? round((float) $lead->contract_amount, 2) : null,
                    'assignee_name' => $lead->assignee->name ?? null,
                    'owner_name' => $lead->owner->name ?? null,
                    'quote_version' => $lead->quoteVersion ? "{$lead->quoteVersion->version} {$lead->quoteVersion->name}" : null,
                    'created_at' => $lead->created_at?->toDateTimeString(),
                ];
            })
            ->toArray();

        return [
            'qualityBreakdown' => $qualityBreakdown,
            'contractPendingDetails' => $contractPendingDetails,
            'contractPendingExplanation' => [
                'title' => '合同待确认说明',
                'description' => '指已完成报价和方案沟通，客户正在内部讨论或走审批流程，距离签约只有时间差的阶段。该阶段通常需要负责人每2天跟进一次，明确客户决策节点和疑虑点。',
                'followUpTip' => '跟进要点：确认决策人、付款方式、方案细节、对比竞品、时间预期。'
            ]
        ];
    }

    private function getStatusTrend(string $startDate, string $endDate, ?int $assigneeId): array
    {
        $start = now()->parse($startDate);
        $end = now()->parse($endDate);
        $days = $start->diffInDays($end);
        $format = $days > 60 ? '%Y-%m' : '%Y-%m-%d';
        $groupCol = DB::raw("DATE_FORMAT(created_at, '{$format}') as period");

        $trend = Lead::query()
            ->filterByPeriod($startDate, $endDate)
            ->byAssignee($assigneeId)
            ->select([
                $groupCol,
                DB::raw('COUNT(*) as new_leads'),
                DB::raw("SUM(CASE WHEN status IN ('signed', 'treatment', 'completed') THEN 1 ELSE 0 END) as signed"),
            ])
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->toArray();

        return $trend;
    }

    private function getContractPendingList($query): array
    {
        return (clone $query)
            ->where('status', 'contract_pending')
            ->with(['assignee:id,name', 'responseNodes' => function ($q) {
                $q->with('operator:id,name')->orderBy('created_at', 'desc')->limit(3);
            }])
            ->select([
                'id', 'name', 'phone', 'quality', 'contract_amount',
                'assignee_id', 'contract_pending_explanation', 'updated_at'
            ])
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($lead) {
                return [
                    'id' => $lead->id,
                    'name' => $lead->name,
                    'phone' => $lead->phone,
                    'quality' => $lead->quality,
                    'quality_label' => $lead->quality_label,
                    'contract_amount' => $lead->contract_amount ? round((float) $lead->contract_amount, 2) : null,
                    'contract_pending_explanation' => $lead->contract_pending_explanation,
                    'assignee_name' => $lead->assignee->name ?? null,
                    'updated_at' => $lead->updated_at?->toDateTimeString(),
                    'latest_nodes' => $lead->responseNodes->map(function ($node) {
                        return [
                            'node_type' => $node->node_type,
                            'node_type_label' => $node->node_type_label,
                            'content' => $node->content,
                            'operator_name' => $node->operator->name ?? null,
                            'created_at' => $node->created_at?->toDateTimeString(),
                        ];
                    })->toArray(),
                ];
            })
            ->toArray();
    }
}
