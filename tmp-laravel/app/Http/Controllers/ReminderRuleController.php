<?php

namespace App\Http\Controllers;

use App\Models\ReminderRule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReminderRuleController extends Controller
{
    public function index(Request $request)
    {
        $query = ReminderRule::with('createdBy')
            ->when($request->input('search'), function ($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->when($request->input('type'), function ($q, $type) {
                $q->where('type', $type);
            })
            ->when($request->input('is_enabled'), function ($q, $isEnabled) {
                $q->where('is_enabled', $isEnabled === 'true');
            })
            ->orderBy('created_at', 'desc');

        $rules = $query->paginate(15)->withQueryString();

        $types = [
            'gap_due' => '缺口到期提醒',
            'gap_overdue' => '缺口逾期提醒',
            'checklist_due' => '检查清单到期提醒',
            'review_pending' => '待审核提醒',
        ];

        return Inertia::render('ReminderRules/Index', [
            'rules' => $rules,
            'types' => $types,
            'filters' => $request->all(),
        ]);
    }

    public function create()
    {
        return Inertia::render('ReminderRules/Create', [
            'types' => [
                'gap_due' => '缺口到期提醒',
                'gap_overdue' => '缺口逾期提醒',
                'checklist_due' => '检查清单到期提醒',
                'review_pending' => '待审核提醒',
            ],
            'triggerConditions' => [
                'before_due' => '到期前',
                'after_due' => '到期后',
                'immediate' => '立即',
                'daily' => '每日',
            ],
            'timeUnits' => [
                'minute' => '分钟',
                'hour' => '小时',
                'day' => '天',
                'week' => '周',
            ],
            'channels' => [
                'email' => '邮件',
                'in_app' => '站内通知',
                'sms' => '短信',
            ],
            'priorities' => [
                'low' => '低',
                'normal' => '普通',
                'high' => '高',
                'urgent' => '紧急',
            ],
            'roles' => [
                'admin' => '管理员',
                'compliance_manager' => '合规经理',
                'project_secretary' => '项目秘书',
                'user' => '普通用户',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:gap_due,gap_overdue,checklist_due,review_pending',
            'trigger_condition' => 'required|in:before_due,after_due,immediate,daily',
            'trigger_value' => 'required|integer|min:0',
            'time_unit' => 'required|in:minute,hour,day,week',
            'channel' => 'required|in:email,in_app,sms',
            'recipient_roles' => 'nullable|array',
            'recipient_roles.*' => 'string',
            'recipient_user_ids' => 'nullable|array',
            'recipient_user_ids.*' => 'exists:users,id',
            'template' => 'nullable|string',
            'is_enabled' => 'boolean',
            'priority' => 'required|in:low,normal,high,urgent',
            'max_reminders' => 'integer|min:0',
            'reminder_interval_hours' => 'integer|min:1',
        ]);

        $rule = ReminderRule::create([
            ...$validated,
            'created_by' => auth()->id(),
            'is_enabled' => $validated['is_enabled'] ?? true,
        ]);

        return redirect()->route('reminder-rules.show', $rule)
            ->with('success', '提醒规则创建成功');
    }

    public function show(ReminderRule $reminderRule)
    {
        $reminderRule->load(['createdBy', 'reminderLogs' => function ($q) {
            $q->orderBy('created_at', 'desc')->limit(20);
        }]);

        return Inertia::render('ReminderRules/Show', [
            'rule' => $reminderRule,
        ]);
    }

    public function edit(ReminderRule $reminderRule)
    {
        return Inertia::render('ReminderRules/Edit', [
            'rule' => $reminderRule,
            'types' => [
                'gap_due' => '缺口到期提醒',
                'gap_overdue' => '缺口逾期提醒',
                'checklist_due' => '检查清单到期提醒',
                'review_pending' => '待审核提醒',
            ],
            'triggerConditions' => [
                'before_due' => '到期前',
                'after_due' => '到期后',
                'immediate' => '立即',
                'daily' => '每日',
            ],
            'timeUnits' => [
                'minute' => '分钟',
                'hour' => '小时',
                'day' => '天',
                'week' => '周',
            ],
            'channels' => [
                'email' => '邮件',
                'in_app' => '站内通知',
                'sms' => '短信',
            ],
            'priorities' => [
                'low' => '低',
                'normal' => '普通',
                'high' => '高',
                'urgent' => '紧急',
            ],
            'roles' => [
                'admin' => '管理员',
                'compliance_manager' => '合规经理',
                'project_secretary' => '项目秘书',
                'user' => '普通用户',
            ],
        ]);
    }

    public function update(Request $request, ReminderRule $reminderRule)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:gap_due,gap_overdue,checklist_due,review_pending',
            'trigger_condition' => 'required|in:before_due,after_due,immediate,daily',
            'trigger_value' => 'required|integer|min:0',
            'time_unit' => 'required|in:minute,hour,day,week',
            'channel' => 'required|in:email,in_app,sms',
            'recipient_roles' => 'nullable|array',
            'recipient_roles.*' => 'string',
            'recipient_user_ids' => 'nullable|array',
            'recipient_user_ids.*' => 'exists:users,id',
            'template' => 'nullable|string',
            'is_enabled' => 'boolean',
            'priority' => 'required|in:low,normal,high,urgent',
            'max_reminders' => 'integer|min:0',
            'reminder_interval_hours' => 'integer|min:1',
        ]);

        $reminderRule->update([
            ...$validated,
            'is_enabled' => $validated['is_enabled'] ?? true,
        ]);

        return redirect()->route('reminder-rules.show', $reminderRule)
            ->with('success', '提醒规则更新成功');
    }

    public function toggle(ReminderRule $reminderRule)
    {
        $reminderRule->update(['is_enabled' => !$reminderRule->is_enabled]);

        return back()->with('success', $reminderRule->is_enabled ? '已启用' : '已禁用');
    }

    public function destroy(ReminderRule $reminderRule)
    {
        $reminderRule->delete();

        return redirect()->route('reminder-rules.index')
            ->with('success', '提醒规则已删除');
    }
}
