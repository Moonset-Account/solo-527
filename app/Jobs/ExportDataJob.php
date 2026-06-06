<?php

namespace App\Jobs;

use App\Models\ImportExportTask;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ExportDataJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 300;

    protected $task;

    public function __construct(ImportExportTask $task)
    {
        $this->task = $task;
    }

    public function handle()
    {
        $this->task->update([
            'status' => 'processing',
            'started_at' => now(),
        ]);

        try {
            $data = $this->getExportData($this->task->module, $this->task->filters ?? []);
            
            $fileName = 'exports/' . $this->task->task_no . '.xlsx';
            
            $exporter = new class($data) implements FromCollection, WithHeadings {
                protected $data;
                public function __construct($data) {
                    $this->data = $data;
                }
                public function collection() {
                    return collect($this->data['rows']);
                }
                public function headings(): array {
                    return $this->data['headers'];
                }
            };
            
            Excel::store($exporter, $fileName, 'public');
            
            $this->task->update([
                'status' => 'completed',
                'completed_at' => now(),
                'file_path' => $fileName,
                'processed_count' => count($data['rows']),
                'success_count' => count($data['rows']),
                'original_file_name' => $this->task->module . '_' . date('YmdHis') . '.xlsx',
            ]);
        } catch (\Exception $e) {
            $this->task->update([
                'status' => 'failed',
                'failed_at' => now(),
                'errors' => [['message' => $e->getMessage()]],
            ]);
            
            throw $e;
        }
    }

    protected function getExportData($module, $filters)
    {
        switch ($module) {
            case 'customers':
                $query = \App\Models\Customer::query();
                if (!empty($filters['keyword'])) {
                    $query->where('name', 'like', "%{$filters['keyword']}%");
                }
                $customers = $query->get();
                return [
                    'headers' => ['客户编码', '客户名称', '联系人', '电话', '邮箱', '地址', '赊账额度', '当前欠款', '是否VIP', '创建时间'],
                    'rows' => $customers->map(function ($item) {
                        return [
                            $item->customer_code,
                            $item->name,
                            $item->contact_person,
                            $item->phone,
                            $item->email,
                            $item->address,
                            $item->credit_limit,
                            $item->current_debt,
                            $item->is_vip ? '是' : '否',
                            $item->created_at->format('Y-m-d H:i:s'),
                        ];
                    })->toArray(),
                ];

            case 'products':
                $query = \App\Models\Product::query();
                if (!empty($filters['keyword'])) {
                    $query->where('name', 'like', "%{$filters['keyword']}%");
                }
                $products = $query->get();
                return [
                    'headers' => ['SKU', '条码', '商品名称', '分类', '品牌', '单位', '成本价', '标准价', '批发价', '总库存', '创建时间'],
                    'rows' => $products->map(function ($item) {
                        return [
                            $item->sku,
                            $item->barcode,
                            $item->name,
                            $item->category,
                            $item->brand,
                            $item->unit,
                            $item->cost_price,
                            $item->standard_price,
                            $item->wholesale_price,
                            $item->total_stock,
                            $item->created_at->format('Y-m-d H:i:s'),
                        ];
                    })->toArray(),
                ];

            case 'orders':
                $query = \App\Models\Order::with('customer');
                if (!empty($filters['status'])) {
                    $query->where('status', $filters['status']);
                }
                $orders = $query->get();
                return [
                    'headers' => ['订单编号', '客户名称', '订单金额', '状态', '付款状态', '业务员', '下单时间'],
                    'rows' => $orders->map(function ($item) {
                        return [
                            $item->order_no,
                            $item->customer->name ?? '',
                            $item->total_amount,
                            $item->status_text,
                            $item->payment_status === 'paid' ? '已付款' : '未付款',
                            $item->salesperson->name ?? '',
                            $item->created_at->format('Y-m-d H:i:s'),
                        ];
                    })->toArray(),
                ];

            case 'debts':
                $query = \App\Models\Debt::with('customer');
                if (!empty($filters['status'])) {
                    $query->where('status', $filters['status']);
                }
                $debts = $query->get();
                return [
                    'headers' => ['欠款编号', '客户名称', '欠款金额', '剩余金额', '状态', '到期日期', '创建时间'],
                    'rows' => $debts->map(function ($item) {
                        return [
                            $item->debt_no,
                            $item->customer->name ?? '',
                            $item->amount,
                            $item->remaining_amount,
                            $item->status_text,
                            $item->due_date,
                            $item->created_at->format('Y-m-d H:i:s'),
                        ];
                    })->toArray(),
                ];

            default:
                throw new \Exception("不支持的模块: {$module}");
        }
    }

    public function failed(\Throwable $exception)
    {
        $this->task->update([
            'status' => 'failed',
            'failed_at' => now(),
            'errors' => [['message' => $exception->getMessage()]],
        ]);
    }
}
