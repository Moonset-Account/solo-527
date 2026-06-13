<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExportController extends Controller
{
    public function leads(Request $request): BinaryFileResponse
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'status' => 'nullable|array',
            'quality' => 'nullable|string|in:A,B,C,D',
            'source' => 'nullable|array',
            'assignee_id' => 'nullable|integer|exists:users,id',
            'search' => 'nullable|string|max:100',
        ]);

        $query = Lead::query()
            ->with(['owner:id,name', 'assignee:id,name', 'quoteVersion:id,version,name', 'churnReason:id,name,category'])
            ->filterByPeriod($validated['start_date'] ?? null, $validated['end_date'] ?? null)
            ->byStatus($validated['status'] ?? null)
            ->byQuality($validated['quality'] ?? null)
            ->bySource($validated['source'] ?? null)
            ->byAssignee($validated['assignee_id'] ?? null);

        if (!empty($validated['search'])) {
            $search = "%{$validated['search']}%";
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)->orWhere('phone', 'like', $search);
            });
        }

        $leads = $query->orderBy('created_at', 'desc')->get();

        $fileName = '线索明细_' . now()->format('YmdHis') . '.xlsx';

        return Excel::download(new class($leads) implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithEvents {
            protected $leads;

            public function __construct($leads)
            {
                $this->leads = $leads;
            }

            public function collection()
            {
                return $this->leads;
            }

            public function headings(): array
            {
                return [
                    'ID', '客户姓名', '电话', '性别', '年龄', '来源', '来源标签',
                    '状态', '状态标签', '质量级别', '质量标签',
                    '意向说明', '预算下限', '预算上限', '合同金额',
                    '报价版本', '流失原因', '责任人', '创建人',
                    '下次跟进', '签约时间', '是否公海',
                    '合同待确认说明', '创建时间', '更新时间'
                ];
            }

            public function map($lead): array
            {
                return [
                    $lead->id,
                    $lead->name,
                    $lead->phone,
                    $lead->gender_label,
                    $lead->age,
                    $lead->source,
                    $lead->source_label,
                    $lead->status,
                    $lead->status_label,
                    $lead->quality,
                    $lead->quality_label,
                    $lead->intention,
                    $lead->budget_min,
                    $lead->budget_max,
                    $lead->contract_amount,
                    $lead->quoteVersion ? "{$lead->quoteVersion->version} {$lead->quoteVersion->name}" : '',
                    $lead->churnReason ? "{$lead->churnReason->category}/{$lead->churnReason->name}" : '',
                    $lead->assignee->name ?? '',
                    $lead->owner->name ?? '',
                    $lead->next_follow_at?->toDateTimeString(),
                    $lead->signed_at?->toDateTimeString(),
                    $lead->is_in_ocean ? '是' : '否',
                    $lead->contract_pending_explanation,
                    $lead->created_at?->toDateTimeString(),
                    $lead->updated_at?->toDateTimeString(),
                ];
            }

            public function styles(Worksheet $sheet)
            {
                return [
                    1 => ['font' => ['bold' => true]],
                ];
            }

            public function registerEvents(): array
            {
                return [
                    AfterSheet::class => function (AfterSheet $event) {
                        $event->sheet->getDelegate()->freezePane('A2');
                    },
                ];
            }
        }, $fileName);
    }

    public function leadQuality(Request $request): BinaryFileResponse
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'quality' => 'nullable|string|in:A,B,C,D',
            'assignee_id' => 'nullable|integer|exists:users,id',
        ]);

        $startDate = $validated['start_date'] ?? now()->subDays(30)->toDateString();
        $endDate = $validated['end_date'] ?? now()->toDateString();

        $query = Lead::query()
            ->with(['assignee:id,name', 'responseNodes.operator:id,name'])
            ->filterByPeriod($startDate, $endDate)
            ->byAssignee($validated['assignee_id'] ?? null)
            ->byQuality($validated['quality'] ?? null);

        $leads = $query->orderBy('quality')->orderBy('created_at', 'desc')->get();

        $summaryByQuality = $leads->groupBy('quality')->map(function ($group, $q) {
            $total = $group->count();
            $signed = $group->whereIn('status', ['signed', 'treatment', 'completed'])->count();
            $revenue = $group->whereIn('status', ['signed', 'treatment', 'completed'])->sum('contract_amount');
            return [
                'quality' => $q,
                'quality_label' => Lead::getQualityLabels()[$q] ?? $q,
                'total' => $total,
                'signed' => $signed,
                'conversion_rate' => $total > 0 ? round($signed / $total * 100, 1) . '%' : '0%',
                'revenue' => round((float) $revenue, 2),
                'avg_amount' => $signed > 0 ? round((float) $revenue / $signed, 2) : 0,
            ];
        })->values();

        $contractPendingLeads = $leads->where('status', 'contract_pending')->values();

        $fileName = '线索质量报表_' . now()->format('YmdHis') . '.xlsx';

        return Excel::download(new class($leads, $summaryByQuality, $contractPendingLeads, $startDate, $endDate) implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithEvents {
            protected $leads;
            protected $summary;
            protected $contractPending;
            protected $startDate;
            protected $endDate;
            protected $mode;

            public function __construct($leads, $summary, $contractPending, $startDate, $endDate)
            {
                $this->leads = $leads;
                $this->summary = $summary;
                $this->contractPending = $contractPending;
                $this->startDate = $startDate;
                $this->endDate = $endDate;
                $this->mode = 'summary';
            }

            public function collection()
            {
                $rows = collect();
                $rows->push([
                    '线索质量报表',
                    "统计周期：{$this->startDate} 至 {$this->endDate}",
                    '', '', '', '', '', ''
                ]);
                $rows->push([]);
                $rows->push([
                    '一、质量分级汇总'
                ]);
                $rows->push(['质量级别', '总数量', '已签约数', '签约转化率', '签约总金额', '平均客单价']);
                foreach ($this->summary as $row) {
                    $rows->push([
                        $row['quality_label'],
                        $row['total'],
                        $row['signed'],
                        $row['conversion_rate'],
                        $row['revenue'],
                        $row['avg_amount'],
                    ]);
                }
                $rows->push([]);
                $rows->push([
                    '二、合同待确认明细（含解释、响应节点、责任人）'
                ]);
                $rows->push([
                    '客户', '电话', '质量', '来源', '合同金额(元)',
                    '待确认解释', '责任人', '最近响应节点', '节点操作人', '节点时间',
                ]);
                foreach ($this->contractPending as $lead) {
                    $latestNode = $lead->responseNodes->last();
                    $rows->push([
                        $lead->name,
                        $lead->phone,
                        $lead->quality_label,
                        $lead->source_label,
                        $lead->contract_amount,
                        $lead->contract_pending_explanation,
                        $lead->assignee->name ?? '未分配',
                        $latestNode ? ($latestNode->node_type_label . '：' . mb_substr($latestNode->content, 0, 50)) : '',
                        $latestNode->operator->name ?? '',
                        $latestNode?->created_at?->toDateTimeString(),
                    ]);
                }
                $rows->push([]);
                $rows->push([
                    '三、全量线索质量明细（保留完整响应节点链路）'
                ]);
                $rows->push([
                    'ID', '客户', '电话', '质量', '质量标签', '来源', '来源标签',
                    '状态', '状态标签', '合同金额', '责任人', '合同待确认解释',
                    '流失原因', '创建时间', '响应节点数', '节点链路摘要',
                ]);
                foreach ($this->leads as $lead) {
                    $nodesSummary = $lead->responseNodes->map(function ($n) {
                        $op = $n->operator->name ?? '';
                        return "[{$n->created_at?->format('m-d H:i')}][{$n->node_type_label}][{$op}] " . mb_substr($n->content, 0, 30);
                    })->implode(' | ');
                    $rows->push([
                        $lead->id,
                        $lead->name,
                        $lead->phone,
                        $lead->quality,
                        $lead->quality_label,
                        $lead->source,
                        $lead->source_label,
                        $lead->status,
                        $lead->status_label,
                        $lead->contract_amount,
                        $lead->assignee->name ?? '',
                        $lead->contract_pending_explanation,
                        $lead->churnReason?->name ?? '',
                        $lead->created_at?->toDateTimeString(),
                        $lead->responseNodes->count(),
                        $nodesSummary,
                    ]);
                }

                return $rows;
            }

            public function headings(): array
            {
                return [];
            }

            public function map($row): array
            {
                return $row;
            }

            public function styles(Worksheet $sheet)
            {
                $boldRows = [1, 3, 4, 8, 9, 12 + $this->contractPending->count() + 1, 12 + $this->contractPending->count() + 2];
                $styles = [];
                foreach ($boldRows as $r) {
                    $styles[$r] = ['font' => ['bold' => true]];
                }
                return $styles;
            }

            public function registerEvents(): array
            {
                return [
                    AfterSheet::class => function (AfterSheet $event) {
                        $event->sheet->getDelegate()->mergeCells('A1:H1');
                        $event->sheet->getDelegate()->mergeCells('A3:H3');
                        $event->sheet->getDelegate()->mergeCells('A8:J8');
                        $pendingStart = 12 + ($this->contractPending->count() ?? 0) + 1;
                        $event->sheet->getDelegate()->mergeCells("A{$pendingStart}:P{$pendingStart}");
                    },
                ];
            }
        }, $fileName);
    }
}
