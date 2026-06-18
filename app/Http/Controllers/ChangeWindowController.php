<?php

namespace App\Http\Controllers;

use App\Models\ChangeWindow;
use App\Models\Notification;
use App\Models\SavedQuery;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChangeWindowController extends Controller
{
    public function index(Request $request)
    {
        $query = ChangeWindow::with(['createdBy', 'approvedBy'])->latest('start_time');

        if ($keyword = $request->input('keyword')) {
            $query->search($keyword);
        }

        if ($status = $request->input('status')) {
            $query->byStatus($status);
        }

        if ($priority = $request->input('priority')) {
            $query->byPriority($priority);
        }

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($startDate = $request->input('start_date')) {
            $endDate = $request->input('end_date', now()->addMonth());
            $query->byDateRange($startDate, $endDate);
        }

        $windows = $query->paginate(20)->withQueryString();

        $savedQueries = SavedQuery::accessible($request->user())
            ->byModel(ChangeWindow::class)
            ->ordered()
            ->get();

        $upcoming = ChangeWindow::upcoming(24)->get();
        $active = ChangeWindow::active()->get();

        return Inertia::render('ChangeWindows/Index', [
            'windows' => $windows,
            'filters' => $request->all(),
            'savedQueries' => $savedQueries,
            'upcoming' => $upcoming,
            'active' => $active,
            'isAdmin' => auth()->user()->isAdmin(),
        ]);
    }

    public function calendar(Request $request)
    {
        $start = $request->input('start', now()->startOfMonth()->toISOString());
        $end = $request->input('end', now()->endOfMonth()->toISOString());

        $windows = ChangeWindow::byDateRange($start, $end)->get();

        $events = $windows->map(function ($window) {
            return [
                'id' => $window->id,
                'title' => $window->title,
                'start' => $window->start_time->toISOString(),
                'end' => $window->end_time->toISOString(),
                'allDay' => false,
                'backgroundColor' => match ($window->status) {
                    'scheduled' => '#3b82f6',
                    'in_progress' => '#eab308',
                    'completed' => '#22c55e',
                    'cancelled' => '#6b7280',
                    'failed' => '#ef4444',
                    default => '#6b7280',
                },
                'extendedProps' => [
                    'priority' => $window->priority,
                    'type' => $window->type,
                    'created_by' => $window->createdBy?->name,
                    'status' => $window->status,
                ],
            ];
        });

        return Inertia::render('ChangeWindows/Calendar', [
            'events' => $events,
            'isAdmin' => auth()->user()->isAdmin(),
        ]);
    }

    public function create()
    {
        return Inertia::render('ChangeWindows/Create', [
            'users' => User::all(['id', 'name', 'email', 'role']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'required|date|after:now',
            'end_time' => 'required|date|after:start_time',
            'type' => 'required|in:planned,emergency,routine',
            'priority' => 'required|in:low,medium,high,critical',
            'change_request_id' => 'nullable|string|max:255',
            'affected_systems' => 'nullable|string',
            'rollback_plan' => 'nullable|string',
        ]);

        $validated['created_by'] = auth()->id();
        $validated['status'] = 'scheduled';

        $window = ChangeWindow::create($validated);

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'change_window_created',
            'model_type' => ChangeWindow::class,
            'model_id' => $window->id,
            'description' => "创建了变更窗口 #{$window->id}: {$window->title}",
            'new_values' => $validated,
        ]);

        $admins = User::whereIn('role', ['admin', 'manager'])->get();
        foreach ($admins as $admin) {
            Notification::sendToUser(
                $admin,
                '新的变更窗口待审批',
                "创建人: " . auth()->user()->name . "\n标题: {$window->title}\n时间: {$window->start_time->format('Y-m-d H:i')} - {$window->end_time->format('Y-m-d H:i')}",
                'system',
                $window->priority === 'critical' ? 'critical' : 'warning',
                $window,
                ['site', 'email']
            );
        }

        return redirect()->route('change-windows.index')
            ->with('success', '变更窗口创建成功');
    }

    public function show(ChangeWindow $window)
    {
        $window->load(['createdBy', 'approvedBy']);

        return Inertia::render('ChangeWindows/Show', [
            'window' => $window,
            'isAdmin' => auth()->user()->isAdmin(),
        ]);
    }

    public function edit(ChangeWindow $window)
    {
        $this->authorize('update', $window);

        return Inertia::render('ChangeWindows/Edit', [
            'window' => $window,
            'users' => User::all(['id', 'name', 'email', 'role']),
        ]);
    }

    public function update(Request $request, ChangeWindow $window)
    {
        $this->authorize('update', $window);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'type' => 'required|in:planned,emergency,routine',
            'priority' => 'required|in:low,medium,high,critical',
            'change_request_id' => 'nullable|string|max:255',
            'affected_systems' => 'nullable|string',
            'rollback_plan' => 'nullable|string',
            'status' => 'required|in:scheduled,in_progress,completed,cancelled,failed',
        ]);

        $oldValues = $window->toArray();
        $window->update($validated);

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'change_window_updated',
            'model_type' => ChangeWindow::class,
            'model_id' => $window->id,
            'description' => "更新了变更窗口 #{$window->id}",
            'old_values' => $oldValues,
            'new_values' => $validated,
        ]);

        return redirect()->route('change-windows.index')
            ->with('success', '变更窗口更新成功');
    }

    public function approve(ChangeWindow $window)
    {
        $this->authorize('update', $window);

        $window->approve(auth()->user());

        Notification::sendToUser(
            $window->createdBy,
            '变更窗口已批准',
            "您的变更窗口已批准\n标题: {$window->title}\n时间: {$window->start_time->format('Y-m-d H:i')}",
            'system',
            'info',
            $window,
            ['site', 'email']
        );

        return back()->with('success', '变更窗口已批准');
    }

    public function start(ChangeWindow $window)
    {
        $this->authorize('update', $window);

        $window->start();

        return back()->with('success', '变更窗口已开始');
    }

    public function complete(ChangeWindow $window)
    {
        $this->authorize('update', $window);

        $window->complete();

        return back()->with('success', '变更窗口已完成');
    }

    public function cancel(Request $request, ChangeWindow $window)
    {
        $this->authorize('update', $window);

        $validated = $request->validate([
            'reason' => 'required|string',
        ]);

        $window->cancel($validated['reason']);

        Notification::sendToUser(
            $window->createdBy,
            '变更窗口已取消',
            "您的变更窗口已取消\n标题: {$window->title}\n原因: {$validated['reason']}",
            'system',
            'warning',
            $window,
            ['site', 'email']
        );

        return back()->with('success', '变更窗口已取消');
    }

    public function destroy(ChangeWindow $window)
    {
        $this->authorize('delete', $window);

        $windowTitle = $window->title;
        $window->delete();

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'change_window_deleted',
            'model_type' => ChangeWindow::class,
            'model_id' => $window->id,
            'description' => "删除了变更窗口: {$windowTitle}",
            'old_values' => ['title' => $windowTitle],
        ]);

        return back()->with('success', '变更窗口已删除');
    }

    public function export(Request $request)
    {
        $query = ChangeWindow::with(['createdBy', 'approvedBy']);

        if ($keyword = $request->input('keyword')) {
            $query->search($keyword);
        }

        if ($status = $request->input('status')) {
            $query->byStatus($status);
        }

        if ($priority = $request->input('priority')) {
            $query->byPriority($priority);
        }

        $windows = $query->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="change_windows.csv"',
        ];

        $callback = function () use ($windows) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', '标题', '类型', '优先级', '状态', '开始时间', '结束时间', '创建人', '审批人']);

            foreach ($windows as $window) {
                fputcsv($file, [
                    $window->id,
                    $window->title,
                    $window->type,
                    $window->priority,
                    $window->status,
                    $window->start_time,
                    $window->end_time,
                    $window->createdBy?->name ?? '',
                    $window->approvedBy?->name ?? '',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
