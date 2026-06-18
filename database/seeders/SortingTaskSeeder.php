<?php

namespace Database\Seeders;

use App\Models\Greenhouse;
use App\Models\Order;
use App\Models\SortingDiscrepancy;
use App\Models\SortingTask;
use App\Models\User;
use Illuminate\Database\Seeder;

class SortingTaskSeeder extends Seeder
{
    public function run(): void
    {
        $orders = Order::whereIn('status', ['confirmed', 'sorting', 'shipped', 'completed'])->get();
        $greenhouses = Greenhouse::where('status', 'active')->get();
        $operator = User::where('email', 'operator@example.com')->first();
        $manager = User::where('email', 'manager@example.com')->first();

        $statuses = ['pending', 'processing', 'completed'];
        $qualityLevels = ['excellent', 'good', 'fair', 'poor'];
        $discrepancyTypes = ['quantity', 'quality', 'damage', 'other'];
        $discrepancyStatuses = ['pending', 'processing', 'resolved', 'closed'];

        foreach ($orders as $index => $order) {
            $plannedQuantity = $order->quantity;
            $actualQuantity = $plannedQuantity - rand(0, max(5, (int)($plannedQuantity * 0.1)));
            $hasDiscrepancy = rand(0, 100) < 40;

            $task = SortingTask::create([
                'task_no' => 'SORT-' . date('Ymd') . '-' . str_pad($index + 1, 4, '0', STR_PAD_LEFT),
                'order_id' => $order->id,
                'greenhouse_id' => $order->greenhouse_id ?? $greenhouses->random()->id,
                'assigned_to' => $operator?->id,
                'planned_quantity' => $plannedQuantity,
                'actual_quantity' => $actualQuantity,
                'planned_sort_date' => now()->addDays($index - 5),
                'actual_start_time' => now()->addDays($index - 5)->addHours(rand(8, 10)),
                'actual_end_time' => now()->addDays($index - 5)->addHours(rand(12, 16)),
                'status' => $statuses[array_rand($statuses)],
                'quality_level' => $qualityLevels[array_rand($qualityLevels)],
                'remark' => $index % 2 === 0 ? '分拣正常完成' : null,
            ]);

            if ($hasDiscrepancy) {
                $plannedQty = $plannedQuantity;
                $actualQty = $actualQuantity;
                $difference = $actualQty - $plannedQty;
                $discrepancyType = $discrepancyTypes[array_rand($discrepancyTypes)];
                $discrepancyStatus = $discrepancyStatuses[array_rand($discrepancyStatuses)];

                SortingDiscrepancy::create([
                    'sorting_task_id' => $task->id,
                    'order_id' => $order->id,
                    'discrepancy_type' => $discrepancyType,
                    'planned_qty' => $plannedQty,
                    'actual_qty' => $actualQty,
                    'difference' => $difference,
                    'unit' => $order->unit,
                    'remark' => $discrepancyType === 'quantity' ? '实际分拣数量不足' : ($discrepancyType === 'quality' ? '部分产品质量不达标' : '运输过程中造成损坏'),
                    'handling_result' => in_array($discrepancyStatus, ['resolved', 'closed']) ? '已与客户协商，补发短缺产品' : null,
                    'social_impact' => null,
                    'handled_by' => in_array($discrepancyStatus, ['resolved', 'closed']) ? $manager?->id : null,
                    'handled_at' => in_array($discrepancyStatus, ['resolved', 'closed']) ? now() : null,
                    'status' => $discrepancyStatus,
                ]);
            }
        }
    }
}
