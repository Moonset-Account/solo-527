<?php

namespace App\Exports;

use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class OrderExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
    protected $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function query(): Builder
    {
        $query = Order::query()->with('greenhouse');

        if (!empty($this->filters['greenhouse_id'])) {
            $query->where('greenhouse_id', $this->filters['greenhouse_id']);
        }

        if (!empty($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
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
            '订单号',
            '大棚',
            '客户',
            '产品',
            '规格',
            '数量',
            '单价',
            '总金额',
            '状态',
            '预计发货日',
            '创建时间',
        ];
    }

    /**
     * @param Order $row
     */
    public function map($row): array
    {
        $statusMap = [
            'pending' => '待处理',
            'confirmed' => '已确认',
            'sorting' => '分拣中',
            'shipped' => '已发货',
            'completed' => '已完成',
            'cancelled' => '已取消',
        ];

        return [
            $row->order_no,
            $row->greenhouse?->name ?? '-',
            $row->customer_name,
            $row->product_name,
            $row->product_spec ?? '-',
            $row->quantity . ($row->unit ?? ''),
            $row->unit_price,
            $row->total_amount,
            $statusMap[$row->status] ?? $row->status,
            $row->expected_delivery_date?->format('Y-m-d') ?? '-',
            $row->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
