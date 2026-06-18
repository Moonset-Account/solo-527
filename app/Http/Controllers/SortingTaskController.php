<?php

namespace App\Http\Controllers;

use App\Models\Greenhouse;
use App\Models\Order;
use App\Models\SortingTask;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SortingTaskController extends Controller
{
    public function index(Request $request)
    {
        $query = SortingTask::with(['order', 'greenhouse', 'assignedTo']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('task_no', 'like', "%{$search}%")
                    ->orWhereHas('order', function ($subQ) use ($search) {
                        $subQ->where('order_no', 'like', "%{$search}%")
                            ->orWhere('customer_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($greenhouseId = $request->input('greenhouse_id')) {
            $query->where('greenhouse_id', $greenhouseId);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($assignedTo = $request->input('assigned_to')) {
            $query->where('assigned_to', $assignedTo);
        }

        if ($startDate = $request->input('start_date')) {
            $query->whereDate('planned_sort_date', '>=', $startDate);
        }

        if ($endDate = $request->input('end_date')) {
            $query->whereDate('planned_sort_date', '<=', $endDate);
        }

        if ($qualityLevel = $request->input('quality_level')) {
            $query->where('quality_level', $qualityLevel);
        }

        $query->orderBy($request->input('sort_by', 'created_at'), $request->input('sort_direction', 'desc'));

        $sortingTasks = $query->paginate($request->input('per_page', 15))->withQueryString();

        $greenhouses = Greenhouse::orderBy('name')->get(['id', 'name']);
        $orders = Order::orderBy('created_at', 'desc')->limit(100)->get(['id', 'order_no', 'customer_name']);
        $workers = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('SortingTasks/Index', [
            'sortingTasks' => $sortingTasks,
            'greenhouses' => $greenhouses,
            'orders' => $orders,
            'workers' => $workers,
            'filters' => $request->only([
                'search', 'greenhouse_id', 'status', 'assigned_to',
                'start_date', 'end_date', 'quality_level',
            ]),
        ]);
    }

    public function create()
    {
        $greenhouses = Greenhouse::orderBy('name')->get(['id', 'name']);
        $orders = Order::whereIn('status', ['pending', 'confirmed'])->orderBy('created_at', 'desc')->get(['id', 'order_no', 'customer_name', 'product_name', 'quantity']);
        $users = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('SortingTasks/Create', [
            'greenhouses' => $greenhouses,
            'orders' => $orders,
            'users' => $users,
        ]);
    }

    public function edit(SortingTask $sortingTask)
    {
        $greenhouses = Greenhouse::orderBy('name')->get(['id', 'name']);
        $orders = Order::orderBy('created_at', 'desc')->limit(100)->get(['id', 'order_no', 'customer_name', 'product_name', 'quantity']);
        $users = User::orderBy('name')->get(['id', 'name']);

        $task = array_merge($sortingTask->toArray(), [
            'assignee_id' => $sortingTask->assigned_to,
            'scheduled_date' => $sortingTask->planned_sort_date,
            'notes' => $sortingTask->remark,
        ]);

        return Inertia::render('SortingTasks/Edit', [
            'task' => $task,
            'greenhouses' => $greenhouses,
            'orders' => $orders,
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'greenhouse_id' => 'required|exists:greenhouses,id',
            'assignee_id' => 'required|exists:users,id',
            'planned_quantity' => 'required|numeric|min:0',
            'scheduled_date' => 'required|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $sortingTask = SortingTask::create([
            'task_no' => generate_no('TSK'),
            'order_id' => $validated['order_id'],
            'greenhouse_id' => $validated['greenhouse_id'],
            'assigned_to' => $validated['assignee_id'],
            'planned_quantity' => $validated['planned_quantity'],
            'planned_sort_date' => $validated['scheduled_date'],
            'status' => 'pending',
            'remark' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('sorting-tasks.show', $sortingTask)->with('success', '分拣任务创建成功');
    }

    public function show(SortingTask $sortingTask)
    {
        $sortingTask->load([
            'order',
            'greenhouse',
            'assignedTo',
            'discrepancies' => fn($q) => $q->orderBy('created_at', 'desc'),
            'shipment',
            'attachments',
            'comments' => function ($query) {
                $query->with('user')->orderBy('created_at', 'desc');
            },
            'auditLogs' => function ($query) {
                $query->with('user')->orderBy('created_at', 'desc');
            },
        ]);

        $task = array_merge($sortingTask->toArray(), [
            'order_no' => $sortingTask->order?->order_no,
            'order_id' => $sortingTask->order?->id,
            'greenhouse_name' => $sortingTask->greenhouse?->name,
            'assignee_name' => $sortingTask->assignedTo?->name,
        ]);

        $comments = $sortingTask->comments->map(fn($c) => array_merge($c->toArray(), [
            'user_name' => $c->user?->name,
        ]));

        $auditLogs = $sortingTask->auditLogs->map(fn($l) => array_merge($l->toArray(), [
            'user_name' => $l->user?->name,
        ]));

        return Inertia::render('SortingTasks/Show', [
            'task' => $task,
            'discrepancies' => $sortingTask->discrepancies,
            'comments' => $comments,
            'attachments' => $sortingTask->attachments,
            'auditLogs' => $auditLogs,
        ]);
    }

    public function update(Request $request, SortingTask $sortingTask)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'greenhouse_id' => 'required|exists:greenhouses,id',
            'assignee_id' => 'required|exists:users,id',
            'planned_quantity' => 'required|numeric|min:0',
            'actual_quantity' => 'nullable|numeric|min:0',
            'scheduled_date' => 'required|date',
            'status' => 'required|string|in:pending,in_progress,completed,cancelled',
            'notes' => 'nullable|string|max:1000',
        ]);

        $sortingTask->update([
            'order_id' => $validated['order_id'],
            'greenhouse_id' => $validated['greenhouse_id'],
            'assigned_to' => $validated['assignee_id'],
            'planned_quantity' => $validated['planned_quantity'],
            'actual_quantity' => $validated['actual_quantity'] ?? null,
            'planned_sort_date' => $validated['scheduled_date'],
            'status' => $validated['status'],
            'remark' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('sorting-tasks.show', $sortingTask)->with('success', '分拣任务更新成功');
    }

    public function start(SortingTask $sortingTask)
    {
        $sortingTask->update([
            'status' => 'in_progress',
            'actual_start_time' => now(),
        ]);

        return redirect()->back()->with('success', '分拣任务已开始');
    }

    public function complete(Request $request, SortingTask $sortingTask)
    {
        $validated = $request->validate([
            'actual_quantity' => 'required|numeric|min:0',
            'quality_level' => 'required|string|in:grade_a,grade_b,grade_c',
            'remark' => 'nullable|string|max:1000',
        ]);

        $sortingTask->update([
            ...$validated,
            'status' => 'completed',
            'actual_end_time' => now(),
        ]);

        return redirect()->back()->with('success', '分拣任务已完成');
    }
}
