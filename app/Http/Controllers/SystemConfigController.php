<?php

namespace App\Http\Controllers;

use App\Enums\ConfigKey;
use App\Http\Requests\SystemConfig\UpdateSystemConfigRequest;
use App\Models\SystemConfig;
use App\Services\ConfigService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class SystemConfigController extends Controller
{
    public function __construct(protected ConfigService $configService) {}

    public function index()
    {
        $configs = SystemConfig::all()->groupBy('category');

        $categories = [
            'approval' => '审批配置',
            'quotation' => '报价配置',
            'delivery' => '交付配置',
            'supply' => '耗材配置',
            'supplier' => '供应商配置',
            'integration' => '集成配置',
            'system' => '系统配置',
            'financial' => '财务配置',
            'notification' => '通知配置',
        ];

        return Inertia::render('Config/Index', [
            'configs' => $configs,
            'categories' => $categories,
            'config_keys' => array_map(fn ($c) => [
                'key' => $c->value,
                'label' => $c->label(),
                'type' => $c->type(),
                'category' => $c->category(),
            ], ConfigKey::cases()),
        ]);
    }

    public function update(UpdateSystemConfigRequest $request)
    {
        $configs = $request->validated()['configs'] ?? [];

        foreach ($configs as $key => $value) {
            $config = SystemConfig::where('key', $key)->first();
            if ($config) {
                $oldValue = $config->value;
                $config->update([
                    'value' => is_bool($value) ? ($value ? 'true' : 'false') : (string) $value,
                    'updated_by' => auth()->id(),
                ]);

                activity()
                    ->performedOn($config)
                    ->causedBy(auth()->user())
                    ->withProperties([
                        'key' => $key,
                        'old_value' => $oldValue,
                        'new_value' => $value,
                    ])
                    ->log('updated config');
            }
        }

        $this->configService->clearCache();

        return back()->with('success', '系统配置已更新');
    }

    public function activityLog(Request $request)
    {
        $activities = Activity::with(['causer', 'subject'])
            ->when($request->search, function ($q) use ($request) {
                $q->where('description', 'like', "%{$request->search}%")
                    ->orWhere('log_name', 'like', "%{$request->search}%");
            })
            ->when($request->causer_id, fn ($q) => $q->where('causer_id', $request->causer_id))
            ->latest()
            ->paginate(30);

        return Inertia::render('Config/ActivityLog', [
            'activities' => $activities,
            'filters' => $request->only(['search', 'causer_id']),
        ]);
    }
}
