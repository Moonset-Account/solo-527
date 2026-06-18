<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\SortingDiscrepancy;
use App\Models\SortingTask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SortingDiscrepancyController extends Controller
{
    public function index(Request $request)
    {
        $query = SortingDiscrepancy::with(['sortingTask', 'order', 'handledBy']);

        if ($sortingTaskId = $request->input('sorting_task_id')) {
            $query->where('sorting_task_id', $sortingTaskId);
        }

        if ($orderId = $request->input('order_id')) {
            $query->where('order_id', $orderId);
        }

        if ($discrepancyType = $request->input('discrepancy_type')) {
            $query->where('discrepancy_type', $discrepancyType);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($startDate = $request->input('start_date')) {
            $query->whereDate('created_at', '>=', $startDate);
        }

        if ($endDate = $request->input('end_date')) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $query->orderBy($request->input('sort_by', 'created_at'), $request->input('sort_direction', 'desc'));

        $discrepancies = $query->paginate($request->input('per_page', 15))->withQueryString();

        $sortingTasks = SortingTask::orderBy('created_at', 'desc')->limit(100)->get(['id', 'task_no']);
        $orders = Order::orderBy('created_at', 'desc')->limit(100)->get(['id', 'order_no', 'customer_name']);

        return Inertia::render('SortingDiscrepancies/Index', [
            'discrepancies' => $discrepancies,
            'sortingTasks' => $sortingTasks,
            'orders' => $orders,
            'filters' => $request->only([
                'sorting_task_id', 'order_id', 'discrepancy_type', 'status',
                'start_date', 'end_date',
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sorting_task_id' => 'required|exists:sorting_tasks,id',
            'order_id' => 'required|exists:orders,id',
            'discrepancy_type' => 'required|string|in:quantity,quality,damage,other',
            'planned_qty' => 'required|numeric|min:0',
            'actual_qty' => 'required|numeric|min:0',
            'difference' => 'required|numeric',
            'unit' => 'required|string|max:20',
            'remark' => 'nullable|string|max:1000',
        ]);

        $validated['status'] = 'pending';

        $discrepancy = SortingDiscrepancy::create($validated);

        return redirect()->back()->with('success', '差异记录创建成功');
    }

    public function update(Request $request, SortingDiscrepancy $sortingDiscrepancy)
    {
        $validated = $request->validate([
            'discrepancy_type' => 'required|string|in:quantity,quality,damage,other',
            'planned_qty' => 'required|numeric|min:0',
            'actual_qty' => 'required|numeric|min:0',
            'difference' => 'required|numeric',
            'unit' => 'required|string|max:20',
            'remark' => 'nullable|string|max:1000',
        ]);

        $sortingDiscrepancy->update($validated);

        return redirect()->back()->with('success', '差异记录更新成功');
    }

    public function handle(Request $request, SortingDiscrepancy $sortingDiscrepancy)
    {
        $validated = $request->validate([
            'remark' => 'required|string|max:1000',
            'handling_result' => 'required|string|in:refund,rework,accept,reject',
            'social_impact' => 'nullable|array',
            'social_impact.*' => 'string',
        ]);

        $sortingDiscrepancy->update([
            ...$validated,
            'status' => 'handled',
            'handled_by' => Auth::id(),
            'handled_at' => now(),
        ]);

        return redirect()->back()->with('success', '差异已处理');
    }
}
