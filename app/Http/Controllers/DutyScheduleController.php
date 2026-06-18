<?php

namespace App\Http\Controllers;

use App\Models\DutySchedule;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Inertia\Inertia;

class DutyScheduleController extends Controller
{
    public function index(Request $request)
    {
        $query = DutySchedule::with(['user', 'createdBy'])->latest('start_time');

        if ($userId = $request->input('user_id')) {
            $query->byUser($userId);
        }

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($startDate = $request->input('start_date')) {
            $endDate = $request->input('end_date', now()->addMonth());
            $query->byDateRange($startDate, $endDate);
        }

        if ($status = $request->input('status')) {
            if ($status === 'active') {
                $query->active();
            } elseif ($status === 'current') {
                $query->current();
            } elseif ($status === 'upcoming') {
                $query->upcoming();
            }
        }

        $schedules = $query->paginate(20)->withQueryString();

        $users = User::all(['id', 'name', 'email', 'role']);

        $currentDuty = DutySchedule::current()->with('user')->get();

        return Inertia::render('Duty/Index', [
            'schedules' => $schedules,
            'filters' => $request->all(),
            'users' => $users,
            'currentDuty' => $currentDuty,
            'isAdmin' => auth()->user()->isAdmin(),
        ]);
    }

    public function calendar(Request $request)
    {
        $start = $request->input('start', now()->startOfMonth()->toISOString());
        $end = $request->input('end', now()->endOfMonth()->toISOString());

        $schedules = DutySchedule::with('user')
            ->byDateRange($start, $end)
            ->active()
            ->get();

        $events = $schedules->map(function ($schedule) {
            return [
                'id' => $schedule->id,
                'title' => "{$schedule->user->name} ({$schedule->type})",
                'start' => $schedule->start_time->toISOString(),
                'end' => $schedule->end_time->toISOString(),
                'allDay' => false,
                'backgroundColor' => match ($schedule->type) {
                    'primary' => '#3b82f6',
                    'backup' => '#eab308',
                    'on_call' => '#8b5cf6',
                    default => '#6b7280',
                },
                'extendedProps' => [
                    'user_id' => $schedule->user_id,
                    'user_name' => $schedule->user->name,
                    'type' => $schedule->type,
                    'notes' => $schedule->notes,
                ],
            ];
        });

        return Inertia::render('Duty/Calendar', [
            'events' => $events,
            'users' => User::all(['id', 'name', 'email']),
            'isAdmin' => auth()->user()->isAdmin(),
        ]);
    }

    public function create()
    {
        $this->authorize('create', DutySchedule::class);

        return Inertia::render('Duty/Create', [
            'users' => User::all(['id', 'name', 'email', 'role']),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', DutySchedule::class);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'start_time' => 'required|date|after:now',
            'end_time' => 'required|date|after:start_time',
            'type' => 'required|in:primary,backup,on_call',
            'notes' => 'nullable|string',
        ]);

        $validated['created_by'] = auth()->id();
        $validated['is_active'] = true;

        $conflict = DutySchedule::byUser($validated['user_id'])
            ->byDateRange($validated['start_time'], $validated['end_time'])
            ->active()
            ->exists();

        if ($conflict) {
            return back()->withErrors(['user_id' => '该用户在此时间段已有值班安排']);
        }

        $schedule = DutySchedule::create($validated);

        $user = User::find($validated['user_id']);
        Notification::sendToUser(
            $user,
            '新的值班安排',
            "您已被安排值班: {$schedule->start_time->format('Y-m-d H:i')} - {$schedule->end_time->format('Y-m-d H:i')}\n类型: {$schedule->type}\n备注: {$schedule->notes}",
            'duty',
            'info',
            $schedule,
            ['site', 'email']
        );

        Redis::del('dashboard:duty_stats');

        return redirect()->route('duty.index')
            ->with('success', '值班安排创建成功');
    }

    public function edit(DutySchedule $schedule)
    {
        $this->authorize('update', $schedule);

        return Inertia::render('Duty/Edit', [
            'schedule' => $schedule->load('user', 'createdBy'),
            'users' => User::all(['id', 'name', 'email', 'role']),
        ]);
    }

    public function update(Request $request, DutySchedule $schedule)
    {
        $this->authorize('update', $schedule);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'type' => 'required|in:primary,backup,on_call',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $conflict = DutySchedule::byUser($validated['user_id'])
            ->byDateRange($validated['start_time'], $validated['end_time'])
            ->where('id', '!=', $schedule->id)
            ->active()
            ->exists();

        if ($conflict) {
            return back()->withErrors(['user_id' => '该用户在此时间段已有值班安排']);
        }

        $oldValues = $schedule->toArray();
        $schedule->update($validated);

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'duty_schedule_updated',
            'model_type' => DutySchedule::class,
            'model_id' => $schedule->id,
            'description' => '值班安排已更新',
            'old_values' => $oldValues,
            'new_values' => $validated,
        ]);

        Redis::del('dashboard:duty_stats');

        return redirect()->route('duty.index')
            ->with('success', '值班安排更新成功');
    }

    public function destroy(DutySchedule $schedule)
    {
        $this->authorize('delete', $schedule);

        $schedule->delete();

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'duty_schedule_deleted',
            'model_type' => DutySchedule::class,
            'model_id' => $schedule->id,
            'description' => '值班安排已删除',
            'old_values' => $schedule->toArray(),
        ]);

        Redis::del('dashboard:duty_stats');

        return back()->with('success', '值班安排已删除');
    }

    public function swap(Request $request)
    {
        $this->authorize('create', DutySchedule::class);

        $validated = $request->validate([
            'schedule_id' => 'required|exists:duty_schedules,id',
            'new_user_id' => 'required|exists:users,id',
            'reason' => 'required|string',
        ]);

        $schedule = DutySchedule::find($validated['schedule_id']);
        $oldUser = $schedule->user;
        $newUser = User::find($validated['new_user_id']);

        $oldValues = $schedule->toArray();
        $schedule->update(['user_id' => $validated['new_user_id']]);

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'duty_schedule_swapped',
            'model_type' => DutySchedule::class,
            'model_id' => $schedule->id,
            'description' => "值班人员已从 {$oldUser->name} 更换为 {$newUser->name}",
            'old_values' => $oldValues,
            'new_values' => ['user_id' => $validated['new_user_id'], 'reason' => $validated['reason']],
        ]);

        Notification::sendToUser(
            $oldUser,
            '值班安排变更',
            "您的值班安排已被更换: {$schedule->start_time->format('Y-m-d H:i')} - {$schedule->end_time->format('Y-m-d H:i')}\n原因: {$validated['reason']}",
            'duty',
            'warning',
            $schedule,
            ['site', 'email']
        );

        Notification::sendToUser(
            $newUser,
            '新的值班安排',
            "您已被安排值班: {$schedule->start_time->format('Y-m-d H:i')} - {$schedule->end_time->format('Y-m-d H:i')}\n类型: {$schedule->type}",
            'duty',
            'info',
            $schedule,
            ['site', 'email']
        );

        Redis::del('dashboard:duty_stats');

        return back()->with('success', '值班人员已更换');
    }

    public function mySchedule()
    {
        $schedules = auth()->user()->dutySchedules()
            ->with('createdBy')
            ->where('end_time', '>=', now())
            ->orderBy('start_time')
            ->paginate(20);

        $pastSchedules = auth()->user()->dutySchedules()
            ->with('createdBy')
            ->where('end_time', '<', now())
            ->orderBy('start_time', 'desc')
            ->paginate(10, ['*'], 'past');

        return Inertia::render('Duty/MySchedule', [
            'schedules' => $schedules,
            'pastSchedules' => $pastSchedules,
        ]);
    }
}
