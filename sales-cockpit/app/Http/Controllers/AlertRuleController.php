<?php

namespace App\Http\Controllers;

use App\Models\AlertRule;
use App\Services\AuditService;
use Illuminate\Support\Facades\DB;

class AlertRuleController extends Controller
{
    public function store()
    {
        if (!request()->user()->hasPermission('alert_rule.create')) {
            abort(403);
        }

        $validated = request()->validate([
            'business_order_id' => ['required', 'integer', 'exists:business_orders,id'],
            'indicator_id' => ['required', 'integer', 'exists:indicators,id'],
            'condition_type' => ['required', 'string', 'in:gt,lt,eq,gte,lte,between'],
            'threshold_value' => ['required', 'numeric'],
            'threshold_value_max' => ['nullable', 'numeric'],
            'notify_user_ids' => ['required', 'array'],
            'notify_user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        DB::transaction(function () use ($validated) {
            $rule = AlertRule::create([
                'business_order_id' => $validated['business_order_id'],
                'indicator_id' => $validated['indicator_id'],
                'condition_type' => $validated['condition_type'],
                'threshold_value' => $validated['threshold_value'],
                'threshold_value_max' => $validated['threshold_value_max'],
                'notify_user_ids' => $validated['notify_user_ids'],
                'is_active' => true,
            ]);

            app(AuditService::class)->log(
                'create',
                'alert_rule',
                $rule->id,
                null,
                $rule->toArray(),
            );
        });

        return redirect()->back()->with('message', '告警规则创建成功');
    }

    public function update(AlertRule $alertRule)
    {
        if (!request()->user()->hasPermission('alert_rule.update')) {
            abort(403);
        }

        $validated = request()->validate([
            'business_order_id' => ['required', 'integer', 'exists:business_orders,id'],
            'indicator_id' => ['required', 'integer', 'exists:indicators,id'],
            'condition_type' => ['required', 'string', 'in:gt,lt,eq,gte,lte,between'],
            'threshold_value' => ['required', 'numeric'],
            'threshold_value_max' => ['nullable', 'numeric'],
            'notify_user_ids' => ['required', 'array'],
            'notify_user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $oldValues = $alertRule->toArray();

        DB::transaction(function () use ($alertRule, $validated) {
            $alertRule->update($validated);

            app(AuditService::class)->log(
                'update',
                'alert_rule',
                $alertRule->id,
                $oldValues,
                $alertRule->fresh()->toArray(),
            );
        });

        return redirect()->back()->with('message', '告警规则更新成功');
    }

    public function destroy(AlertRule $alertRule)
    {
        if (!request()->user()->hasPermission('alert_rule.delete')) {
            abort(403);
        }

        DB::transaction(function () use ($alertRule) {
            $oldValues = $alertRule->toArray();
            $alertRule->delete();

            app(AuditService::class)->log(
                'delete',
                'alert_rule',
                $oldValues['id'],
                $oldValues,
                null,
            );
        });

        return redirect()->back()->with('message', '告警规则已删除');
    }
}
