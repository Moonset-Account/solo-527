<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\ProductionSchedule;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\PickupSlot;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $startDate = $request->get('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        $ordersQuery = Order::whereBetween('created_at', [$startDate, $endDate . ' 23:59:59']);

        $totalOrders = (clone $ordersQuery)->count();
        $totalRevenue = (clone $ordersQuery)->where('payment_status', '!=', Order::PAYMENT_UNPAID)->sum('total_amount');
        $avgOrderValue = $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0;

        $ordersByStatus = Order::selectRaw('status, COUNT(*) as count')
            ->whereBetween('created_at', [$startDate, $endDate . ' 23:59:59'])
            ->groupBy('status')
            ->pluck('count', 'status');

        $pickupSlots = PickupSlot::where('date', $endDate)
            ->withCount('orders')
            ->orderBy('start_time')
            ->get();

        $upcomingPickups = Order::with(['pickupSlot', 'items.product'])
            ->whereIn('status', [Order::STATUS_READY, Order::STATUS_IN_PRODUCTION])
            ->whereHas('pickupSlot', function ($q) {
                $q->where('date', now()->toDateString())
                    ->orWhere('date', now()->addDay()->toDateString());
            })
            ->orderBy('pickup_slot_id')
            ->get();

        return response()->json([
            'summary' => [
                'total_orders' => $totalOrders,
                'total_revenue' => round($totalRevenue, 2),
                'avg_order_value' => $avgOrderValue,
                'pending_orders' => Order::where('status', Order::STATUS_PENDING)->count(),
                'in_production' => Order::where('status', Order::STATUS_IN_PRODUCTION)->count(),
                'ready_pickup' => Order::where('status', Order::STATUS_READY)->count(),
            ],
            'orders_by_status' => $ordersByStatus,
            'today_pickup_slots' => $pickupSlots,
            'upcoming_pickups' => $upcomingPickups,
        ]);
    }

    public function orderBoard(Request $request)
    {
        $date = $request->get('date', now()->toDateString());

        $statuses = [
            Order::STATUS_PENDING => '待确认',
            Order::STATUS_CONFIRMED => '已确认',
            Order::STATUS_IN_PRODUCTION => '生产中',
            Order::STATUS_READY => '待取货',
            Order::STATUS_PICKED_UP => '已完成',
        ];

        $query = Order::with(['items.product', 'pickupSlot', 'assignedTo'])
            ->whereHas('pickupSlot', function ($q) use ($date) {
                $q->where('date', $date);
            });

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('size')) {
            $query->whereHas('items.product', function ($q) use ($request) {
                $q->where('size', $request->size);
            });
        }

        $orders = $query->orderBy('pickup_slot_id')->get();

        $board = [];
        foreach ($statuses as $status => $label) {
            $board[$status] = [
                'label' => $label,
                'orders' => $orders->where('status', $status)->values(),
                'count' => $orders->where('status', $status)->count(),
            ];
        }

        return response()->json([
            'date' => $date,
            'board' => $board,
            'total' => $orders->count(),
        ]);
    }

    public function inventoryAlerts()
    {
        $lowStockIngredients = Ingredient::with('stocks')
            ->where('is_active', true)
            ->get()
            ->filter(function ($ingredient) {
                return $ingredient->is_low_stock;
            })
            ->values();

        $expiringSoon = IngredientStock::with('ingredient')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', now()->addDays(7))
            ->where('expiry_date', '>=', now())
            ->where('quantity', '>', 0)
            ->orderBy('expiry_date')
            ->get();

        $expired = IngredientStock::with('ingredient')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<', now())
            ->where('quantity', '>', 0)
            ->orderBy('expiry_date')
            ->get();

        return response()->json([
            'low_stock' => $lowStockIngredients,
            'expiring_soon' => $expiringSoon,
            'expired' => $expired,
            'alerts_count' => $lowStockIngredients->count() + $expiringSoon->count() + $expired->count(),
        ]);
    }

    public function productionStats(Request $request)
    {
        $date = $request->get('date', now()->toDateString());

        $schedules = ProductionSchedule::whereDate('scheduled_at', $date)
            ->with('orderItem.product', 'assignedTo')
            ->get();

        $byStatus = $schedules->groupBy('status')->map(function ($group) {
            return $group->count();
        });

        $byAssignee = $schedules->groupBy('assigned_to')->map(function ($group) {
            return [
                'name' => optional($group->first()->assignedTo)->name ?? '未分配',
                'count' => $group->count(),
                'completed' => $group->where('status', ProductionSchedule::STATUS_COMPLETED)->count(),
            ];
        })->values();

        $avgCompletionTime = 0;
        $completedSchedules = $schedules->where('status', ProductionSchedule::STATUS_COMPLETED);
        if ($completedSchedules->count() > 0) {
            $totalMinutes = $completedSchedules->sum(function ($schedule) {
                if ($schedule->started_at && $schedule->completed_at) {
                    return $schedule->started_at->diffInMinutes($schedule->completed_at);
                }
                return 0;
            });
            $avgCompletionTime = round($totalMinutes / $completedSchedules->count(), 2);
        }

        return response()->json([
            'date' => $date,
            'by_status' => $byStatus,
            'by_assignee' => $byAssignee,
            'total' => $schedules->count(),
            'completed' => $completedSchedules->count(),
            'avg_completion_minutes' => $avgCompletionTime,
        ]);
    }
}
