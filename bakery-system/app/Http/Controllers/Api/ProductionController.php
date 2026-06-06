<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionSchedule;
use App\Models\Order;
use Illuminate\Http\Request;

class ProductionController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductionSchedule::with(['order', 'orderItem.product', 'assignedTo']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('scheduled_date')) {
            $query->whereDate('scheduled_at', $request->scheduled_date);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('scheduled_at', [$request->start_date, $request->end_date]);
        }

        if ($request->filled('order_id')) {
            $query->where('order_id', $request->order_id);
        }

        $schedules = $query->orderBy('priority', 'desc')
            ->orderBy('scheduled_at')
            ->paginate($request->get('per_page', 30));

        return response()->json($schedules);
    }

    public function board(Request $request)
    {
        $date = $request->get('date', now()->toDateString());

        $query = ProductionSchedule::with(['order', 'orderItem.product', 'assignedTo'])
            ->whereDate('scheduled_at', $date);

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        $schedules = $query->orderBy('priority', 'desc')
            ->orderBy('scheduled_at')
            ->get();

        $grouped = $schedules->groupBy('status');

        $statuses = [
            ProductionSchedule::STATUS_PENDING => '待开始',
            ProductionSchedule::STATUS_PREPARING => '准备中',
            ProductionSchedule::STATUS_BAKING => '烘焙中',
            ProductionSchedule::STATUS_DECORATING => '装饰中',
            ProductionSchedule::STATUS_COMPLETED => '已完成',
            ProductionSchedule::STATUS_ON_HOLD => '暂停',
        ];

        $board = [];
        foreach ($statuses as $status => $label) {
            $board[$status] = [
                'label' => $label,
                'items' => $grouped->get($status, collect()),
                'count' => $grouped->get($status, collect())->count(),
            ];
        }

        $stats = [
            'total' => $schedules->count(),
            'completed' => $grouped->get(ProductionSchedule::STATUS_COMPLETED, collect())->count(),
            'in_progress' => $schedules->whereIn('status', [
                ProductionSchedule::STATUS_PREPARING,
                ProductionSchedule::STATUS_BAKING,
                ProductionSchedule::STATUS_DECORATING,
            ])->count(),
            'pending' => $grouped->get(ProductionSchedule::STATUS_PENDING, collect())->count(),
        ];

        return response()->json([
            'date' => $date,
            'board' => $board,
            'stats' => $stats,
        ]);
    }

    public function show(ProductionSchedule $productionSchedule)
    {
        return response()->json($productionSchedule->load([
            'order.items.product',
            'orderItem.product',
            'assignedTo',
        ]));
    }

    public function store(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'order_item_id' => 'nullable|exists:order_items,id',
            'assigned_to' => 'nullable|exists:users,id',
            'scheduled_at' => 'required|date',
            'priority' => 'integer|min:0|max:10',
            'notes' => 'nullable|string',
        ]);

        $schedule = ProductionSchedule::create(array_merge(
            $request->all(),
            ['status' => ProductionSchedule::STATUS_PENDING]
        ));

        return response()->json([
            'message' => '生产任务创建成功',
            'schedule' => $schedule,
        ], 201);
    }

    public function update(Request $request, ProductionSchedule $productionSchedule)
    {
        $request->validate([
            'assigned_to' => 'nullable|exists:users,id',
            'status' => 'in:pending,preparing,baking,decorating,completed,on_hold',
            'scheduled_at' => 'date',
            'priority' => 'integer|min:0|max:10',
            'notes' => 'nullable|string',
        ]);

        $productionSchedule->update($request->all());

        if ($request->status === ProductionSchedule::STATUS_PREPARING && !$productionSchedule->started_at) {
            $productionSchedule->update(['started_at' => now()]);
        }

        if ($request->status === ProductionSchedule::STATUS_COMPLETED) {
            $productionSchedule->update(['completed_at' => now()]);
        }

        return response()->json([
            'message' => '生产任务更新成功',
            'schedule' => $productionSchedule,
        ]);
    }

    public function updateStatus(Request $request, ProductionSchedule $productionSchedule)
    {
        $request->validate([
            'status' => 'required|in:pending,preparing,baking,decorating,completed,on_hold',
        ]);

        $data = ['status' => $request->status];

        if ($request->status === ProductionSchedule::STATUS_PREPARING && !$productionSchedule->started_at) {
            $data['started_at'] = now();
        }

        if ($request->status === ProductionSchedule::STATUS_COMPLETED) {
            $data['completed_at'] = now();
        }

        $productionSchedule->update($data);

        return response()->json([
            'message' => '状态更新成功',
            'schedule' => $productionSchedule,
        ]);
    }

    public function assign(Request $request, ProductionSchedule $productionSchedule)
    {
        $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $productionSchedule->update(['assigned_to' => $request->assigned_to]);

        return response()->json([
            'message' => '任务已分配',
            'schedule' => $productionSchedule,
        ]);
    }

    public function destroy(ProductionSchedule $productionSchedule)
    {
        $productionSchedule->delete();

        return response()->json(['message' => '生产任务已删除']);
    }
}
