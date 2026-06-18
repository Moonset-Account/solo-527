<?php

namespace App\Exports;

use App\Models\SortingDiscrepancy;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class SortingDiscrepancyExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
    protected $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function query(): Builder
    {
        $query = SortingDiscrepancy::query()->with(['sortingTask', 'order', 'handledBy']);

        if (!empty($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        if (!empty($this->filters['discrepancy_type'])) {
            $query->where('discrepancy_type', $this->filters['discrepancy_type']);
        }

        if (!empty($this->filters['start_date'])) {
            $query->whereDate('created_at', '>=', $this->filters['start_date']);
        }

        if (!empty($this->filters['end_date'])) {
            $query->whereDate('created_at', '<=', $this->filters['end_date']);
        }

        return $query->orderBy('created_at', 'desc');
    }

    public function headings(): array
    {
        return [
            '任务号',
            '订单号',
            '差异类型',
            '计划数量',
            '实际数量',
            '差异',
            '单位',
            '备注',
            '处理结果',
            '状态',
            '处理人',
            '处理时间',
        ];
    }

    /**
     * @param SortingDiscrepancy $row
     */
    public function map($row): array
    {
        $statusMap = [
            'pending' => '待处理',
            'processing' => '处理中',
            'resolved' => '已解决',
            'closed' => '已关闭',
        ];

        $typeMap = [
            'quantity' => '数量差异',
            'quality' => '质量差异',
            'damage' => '损坏差异',
            'other' => '其他',
        ];

        return [
            $row->sortingTask?->task_no ?? '-',
            $row->order?->order_no ?? '-',
            $typeMap[$row->discrepancy_type] ?? $row->discrepancy_type,
            $row->planned_qty,
            $row->actual_qty,
            $row->difference,
            $row->unit ?? '-',
            $row->remark ?? '-',
            $row->handling_result ?? '-',
            $statusMap[$row->status] ?? $row->status,
            $row->handledBy?->name ?? '-',
            $row->handled_at?->format('Y-m-d H:i:s') ?? '-',
        ];
    }
}
