<?php

namespace App\Services;

use App\Models\Order;
use App\Models\PickingList;
use App\Models\ReturnRequest;
use App\Models\Debt;
use App\Models\Inventory;
use App\Models\Location;
use App\Models\User;
use App\Models\Product;
use Carbon\Carbon;

class DashboardService
{
    public function getOverview()
    {
        $today = now()->toDateString();
        $startOfWeek = now()->startOfWeek();
        $startOfMonth = now()->startOfMonth();

        return [
            'today' => [
                'orders_count' => Order::whereDate('created_at', $today)->count(),
                'orders_amount' => Order::whereDate('created_at', $today)->sum('total_amount'),
                'picking_count' => PickingList::whereDate('created_at', $today)->count(),
                'returns_count' => ReturnRequest::whereDate('created_at', $today)->count(),
            ],
            'week' => [
                'orders_count' => Order::where('created_at', '>=', $startOfWeek)->count(),
                'orders_amount' => Order::where('created_at', '>=', $startOfWeek)->sum('total_amount'),
            ],
            'month' => [
                'orders_count' => Order::where('created_at', '>=', $startOfMonth)->count(),
                'orders_amount' => Order::where('created_at', '>=', $startOfMonth)->sum('total_amount'),
            ],
            'pending' => [
                'orders_count' => Order::whereIn('status', [Order::STATUS_PENDING, Order::STATUS_CONFIRMED])->count(),
                'picking_count' => PickingList::whereIn('status', [PickingList::STATUS_PENDING, PickingList::STATUS_PICKING])->count(),
                'returns_count' => ReturnRequest::whereIn('status', [ReturnRequest::STATUS_PENDING, ReturnRequest::STATUS_PROCESSING])->count(),
                'debt_amount' => Debt::whereIn('status', [Debt::STATUS_UNPAID, Debt::STATUS_PARTIAL, Debt::STATUS_OVERDUE])->sum('remaining_amount'),
            ],
        ];
    }

    public function getTimeoutAlerts($filters = [])
    {
        $timeoutThreshold = $filters['hours'] ?? 24;
        $status = $filters['status'] ?? null;
        $assignee = $filters['assignee'] ?? null;
        $startDate = $filters['start_date'] ?? null;
        $endDate = $filters['end_date'] ?? null;

        $orderTimeouts = Order::whereIn('status', [Order::STATUS_PENDING, Order::STATUS_CONFIRMED, Order::STATUS_PICKING])
            ->where('created_at', '<', now()->subHours($timeoutThreshold))
            ->when($status, fn($q) => $q->where('status', $status))
            ->when($startDate, fn($q) => $q->where('created_at', '>=', $startDate))
            ->when($endDate, fn($q) => $q->where('created_at', '<=', $endDate))
            ->with('customer', 'salesperson')
            ->get()
            ->map(function ($order) {
                return [
                    'type' => 'order',
                    'id' => $order->id,
                    'no' => $order->order_no,
                    'status' => $order->status_text,
                    'timeout_hours' => now()->diffInHours($order->created_at),
                    'customer' => $order->customer->name ?? '',
                    'assignee' => $order->salesperson->name ?? '',
                    'created_at' => $order->created_at,
                    'urgent_level' => $order->urgent_level,
                ];
            });

        $pickingTimeouts = PickingList::whereIn('status', [PickingList::STATUS_PENDING, PickingList::STATUS_PICKING])
            ->where('created_at', '<', now()->subHours($timeoutThreshold))
            ->when($assignee, fn($q) => $q->where('picker_id', $assignee))
            ->when($startDate, fn($q) => $q->where('created_at', '>=', $startDate))
            ->when($endDate, fn($q) => $q->where('created_at', '<=', $endDate))
            ->with('order.customer', 'picker')
            ->get()
            ->map(function ($picking) {
                return [
                    'type' => 'picking',
                    'id' => $picking->id,
                    'no' => $picking->picking_no,
                    'status' => $picking->status_text,
                    'timeout_hours' => now()->diffInHours($picking->created_at),
                    'customer' => $picking->order->customer->name ?? '',
                    'assignee' => $picking->picker->name ?? '',
                    'created_at' => $picking->created_at,
                    'progress' => $picking->progress,
                ];
            });

        $returnTimeouts = ReturnRequest::whereIn('status', [ReturnRequest::STATUS_PENDING, ReturnRequest::STATUS_PROCESSING])
            ->where('created_at', '<', now()->subHours($timeoutThreshold))
            ->when($startDate, fn($q) => $q->where('created_at', '>=', $startDate))
            ->when($endDate, fn($q) => $q->where('created_at', '<=', $endDate))
            ->with('customer', 'creator')
            ->get()
            ->map(function ($return) {
                return [
                    'type' => 'return',
                    'id' => $return->id,
                    'no' => $return->return_no,
                    'status' => $return->status_text,
                    'timeout_hours' => now()->diffInHours($return->created_at),
                    'customer' => $return->customer->name ?? '',
                    'assignee' => $return->creator->name ?? '',
                    'created_at' => $return->created_at,
                    'return_type' => $return->return_type_text,
                ];
            });

        $debtOverdues = Debt::where('status', Debt::STATUS_OVERDUE)
            ->when($startDate, fn($q) => $q->where('due_date', '>=', $startDate))
            ->when($endDate, fn($q) => $q->where('due_date', '<=', $endDate))
            ->with('customer')
            ->get()
            ->map(function ($debt) {
                return [
                    'type' => 'debt',
                    'id' => $debt->id,
                    'no' => $debt->debt_no,
                    'status' => $debt->status_text,
                    'timeout_days' => now()->diffInDays($debt->due_date),
                    'customer' => $debt->customer->name ?? '',
                    'amount' => $debt->remaining_amount,
                    'due_date' => $debt->due_date,
                    'interest' => $debt->interest_amount,
                ];
            });

        return collect()
            ->merge($orderTimeouts)
            ->merge($pickingTimeouts)
            ->merge($returnTimeouts)
            ->merge($debtOverdues)
            ->sortByDesc('timeout_hours')
            ->values();
    }

    public function getResourceUtilization($filters = [])
    {
        $startDate = $filters['start_date'] ?? now()->startOfWeek()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();

        $pickers = User::role('picker')->get()->map(function ($picker) use ($startDate, $endDate) {
            $completedTasks = PickingList::where('picker_id', $picker->id)
                ->where('status', PickingList::STATUS_COMPLETED)
                ->whereBetween('completed_at', [$startDate, $endDate . ' 23:59:59'])
                ->get();

            $totalItems = $completedTasks->sum('picked_items');
            $totalTime = $completedTasks->sum(function ($task) {
                return $task->started_at && $task->completed_at 
                    ? $task->started_at->diffInMinutes($task->completed_at) 
                    : 0;
            });

            $assignedTasks = PickingList::where('picker_id', $picker->id)
                ->whereBetween('created_at', [$startDate, $endDate . ' 23:59:59'])
                ->count();

            return [
                'user_id' => $picker->id,
                'name' => $picker->name,
                'employee_code' => $picker->employee_code,
                'completed_tasks' => $completedTasks->count(),
                'assigned_tasks' => $assignedTasks,
                'total_items' => $totalItems,
                'total_work_minutes' => $totalTime,
                'avg_items_per_hour' => $totalTime > 0 ? round($totalItems / ($totalTime / 60), 2) : 0,
                'utilization_rate' => $assignedTasks > 0 ? round(($completedTasks->count() / $assignedTasks) * 100, 2) : 0,
                'is_idle' => PickingList::where('picker_id', $picker->id)
                    ->where('status', PickingList::STATUS_PICKING)
                    ->count() === 0,
            ];
        });

        $locations = Location::where('is_active', true)->get()->map(function ($location) {
            return [
                'location_id' => $location->id,
                'code' => $location->code,
                'name' => $location->name,
                'type' => $location->type,
                'capacity' => $location->capacity,
                'used_capacity' => $location->used_capacity,
                'available_capacity' => $location->available_capacity,
                'utilization_rate' => $location->utilization_rate,
            ];
        });

        $lowStockProducts = Product::where('is_active', true)
            ->with('inventories')
            ->get()
            ->filter(function ($product) {
                return $product->is_low_stock;
            })
            ->values()
            ->map(function ($product) {
                return [
                    'product_id' => $product->id,
                    'sku' => $product->sku,
                    'name' => $product->name,
                    'total_stock' => $product->total_stock,
                    'available_stock' => $product->total_available_stock,
                    'warning_stock' => $product->warning_stock,
                    'unit' => $product->unit,
                ];
            });

        return [
            'pickers' => $pickers,
            'locations' => $locations,
            'low_stock_products' => $lowStockProducts,
        ];
    }

    public function getWorkflowStats($filters = [])
    {
        $startDate = $filters['start_date'] ?? now()->startOfMonth()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();
        $assignee = $filters['assignee'] ?? null;

        $orderStats = Order::whereBetween('created_at', [$startDate, $endDate . ' 23:59:59'])
            ->when($assignee, fn($q) => $q->where('salesperson_id', $assignee))
            ->selectRaw('status, count(*) as count, sum(total_amount) as amount')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $orderAmountStats = Order::whereBetween('created_at', [$startDate, $endDate . ' 23:59:59'])
            ->when($assignee, fn($q) => $q->where('salesperson_id', $assignee))
            ->selectRaw('status, sum(total_amount) as amount')
            ->groupBy('status')
            ->pluck('amount', 'status')
            ->toArray();

        $pickingStats = PickingList::whereBetween('created_at', [$startDate, $endDate . ' 23:59:59'])
            ->when($assignee, fn($q) => $q->where('picker_id', $assignee))
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $returnStats = ReturnRequest::whereBetween('created_at', [$startDate, $endDate . ' 23:59:59'])
            ->selectRaw('status, count(*) as count, sum(refund_amount) as amount')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $debtStats = Debt::whereBetween('created_at', [$startDate, $endDate . ' 23:59:59'])
            ->selectRaw('status, count(*) as count, sum(remaining_amount) as amount')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $avgTimes = [
            'order_to_picking' => $this->calculateAvgTime(
                Order::whereBetween('confirmed_at', [$startDate, $endDate . ' 23:59:59'])
                    ->whereNotNull('confirmed_at')
                    ->join('picking_lists', 'orders.id', '=', 'picking_lists.order_id')
                    ->whereNotNull('picking_lists.created_at')
                    ->selectRaw('AVG(EXTRACT(EPOCH FROM (picking_lists.created_at - orders.confirmed_at))/3600) as avg_hours')
                    ->value('avg_hours')
            ),
            'picking_duration' => $this->calculateAvgTime(
                PickingList::whereBetween('completed_at', [$startDate, $endDate . ' 23:59:59'])
                    ->whereNotNull('started_at')
                    ->whereNotNull('completed_at')
                    ->selectRaw('AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/3600) as avg_hours')
                    ->value('avg_hours')
            ),
            'return_processing' => $this->calculateAvgTime(
                ReturnRequest::whereBetween('approved_at', [$startDate, $endDate . ' 23:59:59'])
                    ->whereNotNull('approved_at')
                    ->whereNotNull('created_at')
                    ->selectRaw('AVG(EXTRACT(EPOCH FROM (approved_at - created_at))/3600) as avg_hours')
                    ->value('avg_hours')
            ),
        ];

        return [
            'orders' => $orderStats,
            'orders_amount' => $orderAmountStats,
            'pickings' => $pickingStats,
            'returns' => $returnStats,
            'debts' => $debtStats,
            'avg_times' => $avgTimes,
        ];
    }

    protected function calculateAvgTime($value)
    {
        return $value ? round($value, 2) : 0;
    }
}
