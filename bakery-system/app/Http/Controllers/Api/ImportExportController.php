<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ImportExportJob;
use App\Models\Product;
use App\Models\Ingredient;
use App\Models\Order;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithValidation;
use Illuminate\Support\Facades\Storage;

class ImportExportController extends Controller
{
    public function index(Request $request)
    {
        $query = ImportExportJob::with('createdBy');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('entity')) {
            $query->where('entity', $request->entity);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $jobs = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json($jobs);
    }

    public function show(ImportExportJob $importExportJob)
    {
        return response()->json($importExportJob->load('createdBy'));
    }

    public function export(Request $request)
    {
        $request->validate([
            'entity' => 'required|in:products,ingredients,orders',
            'filters' => 'nullable|array',
        ]);

        $entity = $request->entity;
        $filters = $request->filters ?? [];

        $job = ImportExportJob::create([
            'type' => ImportExportJob::TYPE_EXPORT,
            'entity' => $entity,
            'status' => ImportExportJob::STATUS_PROCESSING,
            'filters' => $filters,
            'created_by' => $request->user()?->id,
            'started_at' => now(),
        ]);

        try {
            $fileName = "{$entity}_" . now()->format('YmdHis') . '.xlsx';
            $filePath = "exports/{$fileName}";

            $data = $this->getExportData($entity, $filters);
            $total = $data->count();

            $exportClass = new class($data) implements FromCollection, WithHeadings {
                protected $data;
                public function __construct($data) { $this->data = $data; }
                public function collection() { return $this->data; }
                public function headings(): array {
                    if ($this->data->isNotEmpty()) {
                        return array_keys($this->data->first()->toArray());
                    }
                    return [];
                }
            };

            Excel::store($exportClass, $filePath, 'local');

            $job->update([
                'file_path' => $filePath,
                'status' => ImportExportJob::STATUS_COMPLETED,
                'total_records' => $total,
                'processed_records' => $total,
                'completed_at' => now(),
            ]);

            return response()->json([
                'message' => '导出成功',
                'job' => $job,
                'download_url' => Storage::url($filePath),
            ]);
        } catch (\Exception $e) {
            $job->update([
                'status' => ImportExportJob::STATUS_FAILED,
                'error_message' => $e->getMessage(),
                'completed_at' => now(),
            ]);

            return response()->json(['message' => '导出失败: ' . $e->getMessage()], 500);
        }
    }

    public function import(Request $request)
    {
        $request->validate([
            'entity' => 'required|in:products,ingredients',
            'file' => 'required|file|mimes:xlsx,xls,csv',
        ]);

        $entity = $request->entity;
        $file = $request->file('file');

        $job = ImportExportJob::create([
            'type' => ImportExportJob::TYPE_IMPORT,
            'entity' => $entity,
            'status' => ImportExportJob::STATUS_PROCESSING,
            'created_by' => $request->user()?->id,
            'started_at' => now(),
        ]);

        try {
            $fileName = "imports/{$entity}_" . now()->format('YmdHis') . '.' . $file->getClientOriginalExtension();
            $filePath = $file->storeAs('imports', $fileName, 'local');

            $job->file_path = $filePath;
            $job->save();

            $importClass = $this->getImportClass($entity);
            $result = Excel::toArray($importClass, $file);

            $totalRecords = count($result[0]) - 1;
            $processed = 0;
            $failed = 0;

            foreach (array_slice($result[0], 1) as $row) {
                try {
                    $this->processImportRow($entity, $row);
                    $processed++;
                } catch (\Exception $e) {
                    $failed++;
                }
            }

            $job->update([
                'status' => ImportExportJob::STATUS_COMPLETED,
                'total_records' => $totalRecords,
                'processed_records' => $processed,
                'failed_records' => $failed,
                'completed_at' => now(),
            ]);

            return response()->json([
                'message' => '导入完成',
                'job' => $job,
                'summary' => [
                    'total' => $totalRecords,
                    'processed' => $processed,
                    'failed' => $failed,
                ],
            ]);
        } catch (\Exception $e) {
            $job->update([
                'status' => ImportExportJob::STATUS_FAILED,
                'error_message' => $e->getMessage(),
                'completed_at' => now(),
            ]);

            return response()->json(['message' => '导入失败: ' . $e->getMessage()], 500);
        }
    }

    public function download(ImportExportJob $importExportJob)
    {
        if (!$importExportJob->file_path) {
            return response()->json(['message' => '文件不存在'], 404);
        }

        if (!Storage::disk($importExportJob->disk)->exists($importExportJob->file_path)) {
            return response()->json(['message' => '文件已被删除'], 404);
        }

        return Storage::disk($importExportJob->disk)->download($importExportJob->file_path);
    }

    protected function getExportData($entity, $filters)
    {
        switch ($entity) {
            case 'products':
                return Product::select(
                    'id',
                    'name',
                    'description',
                    'size',
                    'price',
                    'deposit',
                    'flavor',
                    'is_active',
                    'preparation_hours',
                    'created_at'
                )->get();
            case 'ingredients':
                return Ingredient::select(
                    'id',
                    'name',
                    'unit',
                    'unit_price',
                    'alert_threshold',
                    'expiry_alert_days',
                    'is_active',
                    'notes',
                    'created_at'
                )->get();
            case 'orders':
                return Order::with('items.product')
                    ->select(
                        'id',
                        'order_number',
                        'customer_name',
                        'customer_phone',
                        'total_amount',
                        'deposit_amount',
                        'balance_amount',
                        'status',
                        'payment_status',
                        'created_at'
                    )
                    ->get()
                    ->map(function ($order) {
                        return [
                            '订单号' => $order->order_number,
                            '客户姓名' => $order->customer_name,
                            '客户电话' => $order->customer_phone,
                            '总金额' => $order->total_amount,
                            '定金' => $order->deposit_amount,
                            '尾款' => $order->balance_amount,
                            '订单状态' => $order->status_label,
                            '支付状态' => $order->payment_status_label,
                            '商品' => $order->items->map(function ($item) {
                                return "{$item->product->name} ({$item->quantity}个)";
                            })->implode(', '),
                            '创建时间' => $order->created_at,
                        ];
                    });
            default:
                return collect();
        }
    }

    protected function getImportClass($entity)
    {
        return new class implements ToModel {
            public function model(array $row) { return null; }
        };
    }

    protected function processImportRow($entity, $row)
    {
        switch ($entity) {
            case 'products':
                if (isset($row[0]) && isset($row[2]) && isset($row[5])) {
                    Product::updateOrCreate(
                        ['name' => $row[0], 'size' => $row[2], 'flavor' => $row[5]],
                        [
                            'description' => $row[1] ?? null,
                            'price' => $row[3] ?? 0,
                            'deposit' => $row[4] ?? 0,
                            'is_active' => true,
                            'preparation_hours' => $row[6] ?? 24,
                        ]
                    );
                }
                break;
            case 'ingredients':
                if (isset($row[0]) && isset($row[1])) {
                    Ingredient::updateOrCreate(
                        ['name' => $row[0]],
                        [
                            'unit' => $row[1],
                            'unit_price' => $row[2] ?? null,
                            'alert_threshold' => $row[3] ?? 10,
                            'expiry_alert_days' => $row[4] ?? 7,
                            'is_active' => true,
                            'notes' => $row[5] ?? null,
                        ]
                    );
                }
                break;
        }
    }
}
