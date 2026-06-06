<?php

namespace App\Jobs;

use App\Models\ImportExportTask;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Inventory;
use App\Models\Location;
use Maatwebsite\Excel\Facades\Excel;

class ImportDataJob implements ShouldQueue
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
            $filePath = Storage::disk('public')->path($this->task->file_path);
            
            $data = Excel::toArray([], $filePath);
            $rows = $data[0] ?? [];
            
            $header = array_shift($rows);
            
            $results = $this->processImport($this->task->module, $rows, $header);
            
            $this->task->update([
                'status' => 'completed',
                'completed_at' => now(),
                'processed_count' => $results['processed'],
                'success_count' => $results['success'],
                'failed_count' => $results['failed'],
                'errors' => $results['errors'],
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

    protected function processImport($module, $rows, $header)
    {
        $processed = 0;
        $success = 0;
        $failed = 0;
        $errors = [];

        switch ($module) {
            case 'customers':
                foreach ($rows as $index => $row) {
                    $processed++;
                    try {
                        $data = array_combine($header, $row);
                        Customer::create([
                            'customer_code' => $data['客户编码'] ?? 'CUS' . date('YmdHis') . $index,
                            'name' => $data['客户名称'] ?? '',
                            'contact_person' => $data['联系人'] ?? null,
                            'phone' => $data['电话'] ?? null,
                            'email' => $data['邮箱'] ?? null,
                            'address' => $data['地址'] ?? null,
                            'credit_limit' => $data['赊账额度'] ?? 0,
                            'is_vip' => ($data['是否VIP'] ?? '') === '是',
                        ]);
                        $success++;
                    } catch (\Exception $e) {
                        $failed++;
                        $errors[] = ['row' => $index + 2, 'message' => $e->getMessage()];
                    }
                }
                break;

            case 'products':
                foreach ($rows as $index => $row) {
                    $processed++;
                    try {
                        $data = array_combine($header, $row);
                        Product::create([
                            'sku' => $data['SKU'] ?? 'SKU' . date('YmdHis') . $index,
                            'barcode' => $data['条码'] ?? null,
                            'name' => $data['商品名称'] ?? '',
                            'category' => $data['分类'] ?? null,
                            'brand' => $data['品牌'] ?? null,
                            'unit' => $data['单位'] ?? null,
                            'cost_price' => $data['成本价'] ?? 0,
                            'standard_price' => $data['标准价'] ?? 0,
                            'wholesale_price' => $data['批发价'] ?? 0,
                            'warning_stock' => $data['预警库存'] ?? 0,
                        ]);
                        $success++;
                    } catch (\Exception $e) {
                        $failed++;
                        $errors[] = ['row' => $index + 2, 'message' => $e->getMessage()];
                    }
                }
                break;

            case 'inventories':
                foreach ($rows as $index => $row) {
                    $processed++;
                    try {
                        $data = array_combine($header, $row);
                        $product = Product::where('sku', $data['SKU'])->first();
                        $location = Location::where('code', $data['仓位编码'])->first();
                        
                        if ($product && $location) {
                            Inventory::updateOrCreate(
                                [
                                    'product_id' => $product->id,
                                    'location_id' => $location->id,
                                    'batch_no' => $data['批次号'] ?? 'DEFAULT',
                                ],
                                [
                                    'quantity' => $data['数量'] ?? 0,
                                    'available_quantity' => $data['数量'] ?? 0,
                                ]
                            );
                        }
                        $success++;
                    } catch (\Exception $e) {
                        $failed++;
                        $errors[] = ['row' => $index + 2, 'message' => $e->getMessage()];
                    }
                }
                break;

            default:
                throw new \Exception("不支持的模块: {$module}");
        }

        return compact('processed', 'success', 'failed', 'errors');
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
