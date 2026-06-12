<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$director = App\Models\User::where('email', 'director@example.com')->first();
$indicator = App\Models\Indicator::first();
$analyst = App\Models\User::where('email', 'analyst@example.com')->first();
Auth::login($director);

$auditService = app(App\Services\AuditService::class);

echo "=== 验证 1: 告警规则停用/启用 + 审计留痕 ===\n";
$order = App\Models\BusinessOrder::create([
    'order_no' => 'BO-' . now()->format('Ymd') . '-DEACT' . rand(1000, 9999),
    'title' => '停用测试工单',
    'status' => 'pending',
    'created_by' => $director->id,
]);

$rule = App\Models\AlertRule::create([
    'business_order_id' => $order->id,
    'indicator_id' => $indicator->id,
    'condition_type' => 'gt',
    'threshold_value' => 100,
    'notify_user_ids' => [$director->id],
    'is_active' => true,
]);
echo "创建告警规则 id={$rule->id}, is_active={$rule->is_active}\n";

// 测试停用
$oldValues = $rule->toArray();
Illuminate\Support\Facades\DB::transaction(function () use ($rule, $oldValues, $auditService) {
    $rule->update(['is_active' => false]);
    $auditService->log('deactivate', 'alert_rule', $rule->id, $oldValues, $rule->fresh()->toArray());
});

$deactivateLog = App\Models\AuditLog::where('entity_type', 'alert_rule')
    ->where('entity_id', $rule->id)
    ->where('action', 'deactivate')
    ->latest()
    ->first();

$rule->refresh();
echo "停用后 is_active: {$rule->is_active}\n";
if ($deactivateLog) {
    echo "审计日志 #{$deactivateLog->id}:\n";
    echo "  old is_active: " . ($deactivateLog->old_values['is_active'] ?? 'NULL') . "\n";
    echo "  new is_active: " . ($deactivateLog->new_values['is_active'] ?? 'NULL') . "\n";
    $ok = ($deactivateLog->old_values['is_active'] ?? null) == 1 && ($deactivateLog->new_values['is_active'] ?? null) == 0;
    echo "  ✅ old/new 留痕正确: " . ($ok ? "YES" : "NO - FAIL!") . "\n";
} else {
    echo "❌ 无审计日志\n";
}

// 测试启用
$oldValues2 = $rule->toArray();
Illuminate\Support\Facades\DB::transaction(function () use ($rule, $oldValues2, $auditService) {
    $rule->update(['is_active' => true]);
    $auditService->log('activate', 'alert_rule', $rule->id, $oldValues2, $rule->fresh()->toArray());
});

$activateLog = App\Models\AuditLog::where('entity_type', 'alert_rule')
    ->where('entity_id', $rule->id)
    ->where('action', 'activate')
    ->latest()
    ->first();

$rule->refresh();
echo "启用后 is_active: {$rule->is_active}\n";
if ($activateLog) {
    echo "  ✅ 启用留痕正确: " . ((($activateLog->old_values['is_active'] ?? null) == 0) ? "YES" : "NO - FAIL!") . "\n";
}

echo "\n=== 验证 2: 维度配置停用/启用 + 审计留痕 ===\n";
$dim = App\Models\Dimension::create([
    'business_order_id' => $order->id,
    'name' => '测试维度',
    'code' => 'TEST_DIM',
    'values_json' => ['A', 'B'],
    'is_active' => true,
]);
echo "创建维度 id={$dim->id}, is_active={$dim->is_active}\n";

$oldDim = $dim->toArray();
Illuminate\Support\Facades\DB::transaction(function () use ($dim, $oldDim, $auditService) {
    $dim->update(['is_active' => false]);
    $auditService->log('deactivate', 'dimension', $dim->id, $oldDim, $dim->fresh()->toArray());
});

$dimLog = App\Models\AuditLog::where('entity_type', 'dimension')
    ->where('entity_id', $dim->id)
    ->where('action', 'deactivate')
    ->latest()
    ->first();

if ($dimLog) {
    echo "  old is_active: " . ($dimLog->old_values['is_active'] ?? 'NULL') . "\n";
    echo "  new is_active: " . ($dimLog->new_values['is_active'] ?? 'NULL') . "\n";
    echo "  ✅ 维度停用留痕: " . ((($dimLog->old_values['is_active'] ?? null) == 1) ? "YES" : "NO - FAIL!") . "\n";
} else {
    echo "❌ 无审计日志\n";
}

echo "\n=== 验证 3: 复盘节奏停用/启用 + 审计留痕 ===\n";
$rhythm = App\Models\ReviewRhythm::create([
    'indicator_id' => $indicator->id,
    'rhythm_type' => 'monthly',
    'next_review_date' => now()->addDays(30)->toDateString(),
    'responsible_user_id' => $director->id,
    'notes' => '测试复盘',
    'is_active' => true,
]);
echo "创建复盘节奏 id={$rhythm->id}, is_active={$rhythm->is_active}\n";

$oldRhythm = $rhythm->toArray();
Illuminate\Support\Facades\DB::transaction(function () use ($rhythm, $oldRhythm, $auditService) {
    $rhythm->update(['is_active' => false]);
    $auditService->log('deactivate', 'review_rhythm', $rhythm->id, $oldRhythm, $rhythm->fresh()->toArray());
});

$rhythmLog = App\Models\AuditLog::where('entity_type', 'review_rhythm')
    ->where('entity_id', $rhythm->id)
    ->where('action', 'deactivate')
    ->latest()
    ->first();

if ($rhythmLog) {
    echo "  old is_active: " . ($rhythmLog->old_values['is_active'] ?? 'NULL') . "\n";
    echo "  new is_active: " . ($rhythmLog->new_values['is_active'] ?? 'NULL') . "\n";
    echo "  ✅ 复盘节奏停用留痕: " . ((($rhythmLog->old_values['is_active'] ?? null) == 1) ? "YES" : "NO - FAIL!") . "\n";
} else {
    echo "❌ 无审计日志\n";
}

echo "\n=== 验证 4: 路由中已无 destroy 删除入口 ===\n";
$routes = collect(Illuminate\Support\Facades\Route::getRoutes()->getRoutes())
    ->filter(function ($r) {
        $uri = $r->uri();
        return (str_contains($uri, 'alert-rules') || str_contains($uri, 'dimensions') || str_contains($uri, 'review-rhythms'))
            && str_contains($uri, '{');
    })
    ->map(function ($r) {
        return implode('|', $r->methods()) . ' ' . $r->uri();
    })
    ->values();

echo "相关路由:\n";
$hasDestroy = false;
foreach ($routes as $route) {
    echo "  $route\n";
    if (str_contains($route, 'DELETE')) {
        $hasDestroy = true;
    }
}
echo "  ✅ 无 DELETE 路由（已全部改为软停用）: " . (!$hasDestroy ? "YES" : "NO - FAIL!") . "\n";

echo "\n=== 验证 5: 三类资源权限中停用权限已分配 ===\n";
echo "  alert_rule.deactivate: " . ($director->hasPermission('alert_rule.deactivate') ? "✅ 有" : "❌ 无") . "\n";
echo "  dimension.deactivate: " . ($director->hasPermission('dimension.deactivate') ? "✅ 有" : "❌ 无") . "\n";
echo "  review_rhythm.deactivate: " . ($director->hasPermission('review_rhythm.deactivate') ? "✅ 有" : "❌ 无") . "\n";
echo "  分析师 alert_rule.deactivate: " . ($analyst->hasPermission('alert_rule.deactivate') ? "✅ 有" : "❌ 无") . "\n";
echo "  分析师 dimension.deactivate: " . ($analyst->hasPermission('dimension.deactivate') ? "✅ 有" : "❌ 无") . "\n";
echo "  分析师 review_rhythm.deactivate: " . ($analyst->hasPermission('review_rhythm.deactivate') ? "✅ 有" : "❌ 无") . "\n";

echo "\n=== 所有验证完成 ===\n";
