<?php

namespace App\Http\Controllers;

use App\Models\OceanRule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OceanRuleController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'is_active' => 'nullable|boolean',
        ]);

        $query = OceanRule::query();

        if (isset($validated['is_active'])) {
            $query->where('is_active', (bool) $validated['is_active']);
        }

        $rules = $query
            ->orderBy('is_active', 'desc')
            ->orderBy('id')
            ->get()
            ->map(function ($rule) {
                return [
                    'id' => $rule->id,
                    'name' => $rule->name,
                    'days_unassigned' => (int) $rule->days_unassigned,
                    'days_no_follow' => (int) $rule->days_no_follow,
                    'description' => $rule->description,
                    'is_active' => (bool) $rule->is_active,
                    'created_at' => $rule->created_at?->toDateTimeString(),
                ];
            })
            ->toArray();

        $conditionsExplained = [
            [
                'condition' => '长期未分配',
                'trigger' => '线索创建后 N 天内未分配责任人',
                'recommendation' => '建议设置 7 天内必须分配责任人，避免线索冷却。',
            ],
            [
                'condition' => '长期无跟进',
                'trigger' => '距上次跟进记录超过 N 天',
                'recommendation' => '建议设置 15 天内至少跟进一次，保持客户热度。',
            ],
            [
                'condition' => '状态为“新线索”超过 N 天',
                'trigger' => '状态一直停留在“新线索”未推进',
                'recommendation' => '建议设置 3 天，督促快速响应。',
            ],
        ];

        return Inertia::render('References/OceanRules', [
            'filters' => [
                'is_active' => $validated['is_active'] ?? null,
            ],
            'rules' => $rules,
            'conditionsExplained' => $conditionsExplained,
        ]);
    }
}
