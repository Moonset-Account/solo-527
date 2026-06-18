<?php

namespace App\Http\Controllers;

use App\Models\EscalationRule;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EscalationRuleController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', EscalationRule::class);

        $rules = EscalationRule::with('createdBy')
            ->orderBy('alert_level')
            ->orderBy('level')
            ->get();

        return Inertia::render('Escalation/Index', [
            'rules' => $rules,
            'users' => User::all(['id', 'name', 'email', 'role']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', EscalationRule::class);

        return Inertia::render('Escalation/Create', [
            'users' => User::all(['id', 'name', 'email', 'role']),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', EscalationRule::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'alert_level' => 'required|in:critical,warning,info',
            'wait_minutes' => 'required|integer|min:1|max:1440',
            'level' => 'required|integer|min:1|max:5',
            'notify_type' => 'required|in:role,user,team,all',
            'notify_value' => 'nullable|string',
            'notification_channels' => 'nullable|array',
            'is_enabled' => 'boolean',
        ]);

        $validated['created_by'] = auth()->id();
        $validated['notification_channels'] = $validated['notification_channels'] ?? ['site', 'email'];

        EscalationRule::create($validated);

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'escalation_rule_created',
            'model_type' => EscalationRule::class,
            'description' => "创建了升级规则: {$validated['name']}",
            'new_values' => $validated,
        ]);

        return redirect()->route('escalation.index')
            ->with('success', '升级规则创建成功');
    }

    public function edit(EscalationRule $rule)
    {
        $this->authorize('update', $rule);

        return Inertia::render('Escalation/Edit', [
            'rule' => $rule->load('createdBy'),
            'users' => User::all(['id', 'name', 'email', 'role']),
        ]);
    }

    public function update(Request $request, EscalationRule $rule)
    {
        $this->authorize('update', $rule);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'alert_level' => 'required|in:critical,warning,info',
            'wait_minutes' => 'required|integer|min:1|max:1440',
            'level' => 'required|integer|min:1|max:5',
            'notify_type' => 'required|in:role,user,team,all',
            'notify_value' => 'nullable|string',
            'notification_channels' => 'nullable|array',
            'is_enabled' => 'boolean',
        ]);

        $oldValues = $rule->toArray();
        $rule->update($validated);

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'escalation_rule_updated',
            'model_type' => EscalationRule::class,
            'model_id' => $rule->id,
            'description' => "更新了升级规则: {$rule->name}",
            'old_values' => $oldValues,
            'new_values' => $validated,
        ]);

        return redirect()->route('escalation.index')
            ->with('success', '升级规则更新成功');
    }

    public function toggle(EscalationRule $rule)
    {
        $this->authorize('update', $rule);

        $rule->update(['is_enabled' => ! $rule->is_enabled]);

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'escalation_rule_toggled',
            'model_type' => EscalationRule::class,
            'model_id' => $rule->id,
            'description' => $rule->is_enabled ? "启用了升级规则: {$rule->name}" : "禁用了升级规则: {$rule->name}",
            'new_values' => ['is_enabled' => $rule->is_enabled],
        ]);

        return back()->with('success', '规则状态已更新');
    }

    public function destroy(EscalationRule $rule)
    {
        $this->authorize('delete', $rule);

        $ruleName = $rule->name;
        $rule->delete();

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'escalation_rule_deleted',
            'model_type' => EscalationRule::class,
            'model_id' => $rule->id,
            'description' => "删除了升级规则: {$ruleName}",
            'old_values' => ['name' => $ruleName],
        ]);

        return back()->with('success', '升级规则已删除');
    }

    public function runEscalationCheck()
    {
        $this->authorize('create', EscalationRule::class);

        $alerts = \App\Models\Alert::open()->get();
        $rules = EscalationRule::enabled()->orderBy('level')->get();

        $escalatedCount = 0;

        foreach ($alerts as $alert) {
            foreach ($rules as $rule) {
                if ($rule->shouldNotify($alert)) {
                    $users = $rule->getNotifyUsers();

                    foreach ($users as $user) {
                        \App\Models\Notification::sendToUser(
                            $user,
                            "告警升级通知 #{$alert->id}",
                            "告警: {$alert->title}\n级别: {$alert->level}\n升级级别: {$rule->level}\n已等待: {$rule->wait_minutes} 分钟",
                            'escalation',
                            'critical',
                            $alert,
                            $rule->getChannelsArray()
                        );
                    }

                    $alert->update([
                        'escalation_level' => $rule->level,
                        'escalated_at' => now(),
                    ]);

                    $escalatedCount++;
                    break;
                }
            }
        }

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'escalation_check_run',
            'description' => "手动执行升级检查，共升级 {$escalatedCount} 个告警",
            'new_values' => ['escalated_count' => $escalatedCount],
        ]);

        return back()->with('success', "升级检查完成，共升级 {$escalatedCount} 个告警");
    }
}
