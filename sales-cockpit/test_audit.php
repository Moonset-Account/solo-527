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

echo "=== Test 1: AlertRule update 事务闭包 oldValues 捕获 ===\n";
$order = App\Models\BusinessOrder::create([
    'order_no' => 'BO-' . now()->format('Ymd') . '-TST' . rand(1000, 9999),
    'title' => '审计测试工单',
    'description' => '测试审计日志留痕',
    'status' => 'processing',
    'handler_id' => $director->id,
    'handled_at' => now(),
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
echo "Created AlertRule id={$rule->id}, condition_type={$rule->condition_type}, threshold={$rule->threshold_value}\n";

$oldValues = $rule->toArray();
$newData = [
    'business_order_id' => $order->id,
    'indicator_id' => $indicator->id,
    'condition_type' => 'lte',
    'threshold_value' => 50,
    'threshold_value_max' => null,
    'notify_user_ids' => [$director->id, $analyst->id],
];

Illuminate\Support\Facades\DB::transaction(function () use ($rule, $newData, $oldValues, $auditService) {
    $rule->update($newData);
    $auditService->log('update', 'alert_rule', $rule->id, $oldValues, $rule->fresh()->toArray());
});

$rule->refresh();
echo "Updated AlertRule: condition_type={$rule->condition_type}, threshold={$rule->threshold_value}\n";

$auditLog = App\Models\AuditLog::where('entity_type', 'alert_rule')
    ->where('entity_id', $rule->id)
    ->where('action', 'update')
    ->orderBy('id', 'desc')
    ->first();

if ($auditLog) {
    echo "Audit log #{$auditLog->id} found\n";
    echo "  oldValues condition_type: " . ($auditLog->old_values['condition_type'] ?? 'NULL') . "\n";
    echo "  oldValues threshold: " . ($auditLog->old_values['threshold_value'] ?? 'NULL') . "\n";
    echo "  newValues condition_type: " . ($auditLog->new_values['condition_type'] ?? 'NULL') . "\n";
    echo "  newValues threshold: " . ($auditLog->new_values['threshold_value'] ?? 'NULL') . "\n";
    $oldOk = ($auditLog->old_values['condition_type'] ?? null) === 'gt' && ($auditLog->old_values['threshold_value'] ?? null) == 100;
    $newOk = ($auditLog->new_values['condition_type'] ?? null) === 'lte' && ($auditLog->new_values['threshold_value'] ?? null) == 50;
    echo "  ✅ oldValues 正确: " . ($oldOk ? "YES" : "NO - FAIL!") . "\n";
    echo "  ✅ newValues 正确: " . ($newOk ? "YES" : "NO - FAIL!") . "\n";
} else {
    echo "❌ No audit log found!\n";
}

echo "\n=== Test 2: Dimension update 事务闭包 oldValues 捕获 ===\n";
$dim = App\Models\Dimension::create([
    'business_order_id' => $order->id,
    'name' => '地区',
    'code' => 'REGION',
    'values_json' => ['华北', '华东'],
    'is_active' => true,
]);
echo "Created Dimension id={$dim->id}, name={$dim->name}, code={$dim->code}\n";

$oldValues = $dim->toArray();
$newData = [
    'business_order_id' => $order->id,
    'name' => '销售区域',
    'code' => 'SALES_REGION',
    'values_json' => ['华北', '华东', '华南', '西南'],
];

Illuminate\Support\Facades\DB::transaction(function () use ($dim, $newData, $oldValues, $auditService) {
    $dim->update($newData);
    $auditService->log('update', 'dimension', $dim->id, $oldValues, $dim->fresh()->toArray());
});

$dimAudit = App\Models\AuditLog::where('entity_type', 'dimension')
    ->where('entity_id', $dim->id)
    ->where('action', 'update')
    ->orderBy('id', 'desc')
    ->first();

if ($dimAudit) {
    echo "  oldValues name/code: " . ($dimAudit->old_values['name'] ?? 'NULL') . "/" . ($dimAudit->old_values['code'] ?? 'NULL') . "\n";
    echo "  newValues name/code: " . ($dimAudit->new_values['name'] ?? 'NULL') . "/" . ($dimAudit->new_values['code'] ?? 'NULL') . "\n";
    $ok = ($dimAudit->old_values['name'] ?? null) === '地区' && ($dimAudit->new_values['name'] ?? null) === '销售区域';
    echo "  ✅ old/new 留痕正确: " . ($ok ? "YES" : "NO - FAIL!") . "\n";
} else {
    echo "❌ No audit log found!\n";
}

echo "\n=== Test 3: DatasetPermission deactivate 事务闭包 oldValues 捕获 ===\n";
$perm = App\Models\DatasetPermission::create([
    'business_order_id' => $order->id,
    'user_id' => $analyst->id,
    'dataset_name' => '销售明细数据集',
    'expires_at' => now()->addDays(30),
    'granted_by' => $director->id,
    'is_active' => true,
]);
echo "Created DatasetPermission id={$perm->id}, is_active={$perm->is_active}\n";

$oldValues = $perm->toArray();

Illuminate\Support\Facades\DB::transaction(function () use ($perm, $oldValues, $auditService) {
    $perm->update(['is_active' => false]);
    $auditService->log('deactivate', 'dataset_permission', $perm->id, $oldValues, $perm->fresh()->toArray());
});

$perm->refresh();
echo "After deactivate: is_active={$perm->is_active}\n";

$permAudit = App\Models\AuditLog::where('entity_type', 'dataset_permission')
    ->where('entity_id', $perm->id)
    ->where('action', 'deactivate')
    ->orderBy('id', 'desc')
    ->first();

if ($permAudit) {
    echo "  oldValues is_active: " . ($permAudit->old_values['is_active'] ?? 'NULL') . "\n";
    echo "  newValues is_active: " . ($permAudit->new_values['is_active'] ?? 'NULL') . "\n";
    $ok = ($permAudit->old_values['is_active'] ?? null) == 1 && ($permAudit->new_values['is_active'] ?? null) == 0;
    echo "  ✅ old/new 留痕正确: " . ($ok ? "YES" : "NO - FAIL!") . "\n";
} else {
    echo "❌ No audit log found!\n";
}

echo "\n=== Test 4: ReviewRhythm update 事务闭包 oldValues 捕获 ===\n";
$rhythm = App\Models\ReviewRhythm::create([
    'indicator_id' => $indicator->id,
    'rhythm_type' => 'weekly',
    'next_review_date' => now()->addDays(7)->toDateString(),
    'responsible_user_id' => $director->id,
    'notes' => '周复盘',
    'is_active' => true,
]);
echo "Created ReviewRhythm id={$rhythm->id}, rhythm_type={$rhythm->rhythm_type}, notes={$rhythm->notes}\n";

$oldValues = $rhythm->toArray();
$newData = [
    'indicator_id' => $indicator->id,
    'rhythm_type' => 'monthly',
    'next_review_date' => now()->addDays(30)->toDateString(),
    'responsible_user_id' => $director->id,
    'notes' => '月复盘',
];

Illuminate\Support\Facades\DB::transaction(function () use ($rhythm, $newData, $oldValues, $auditService) {
    $rhythm->update($newData);
    $auditService->log('update', 'review_rhythm', $rhythm->id, $oldValues, $rhythm->fresh()->toArray());
});

$rhythmAudit = App\Models\AuditLog::where('entity_type', 'review_rhythm')
    ->where('entity_id', $rhythm->id)
    ->where('action', 'update')
    ->orderBy('id', 'desc')
    ->first();

if ($rhythmAudit) {
    echo "  oldValues rhythm/notes: " . ($rhythmAudit->old_values['rhythm_type'] ?? 'NULL') . "/" . ($rhythmAudit->old_values['notes'] ?? 'NULL') . "\n";
    echo "  newValues rhythm/notes: " . ($rhythmAudit->new_values['rhythm_type'] ?? 'NULL') . "/" . ($rhythmAudit->new_values['notes'] ?? 'NULL') . "\n";
    $ok = ($rhythmAudit->old_values['rhythm_type'] ?? null) === 'weekly' && ($rhythmAudit->new_values['rhythm_type'] ?? null) === 'monthly';
    echo "  ✅ old/new 留痕正确: " . ($ok ? "YES" : "NO - FAIL!") . "\n";
} else {
    echo "❌ No audit log found!\n";
}

echo "\n=== Test 5: AlertTriggeredNotification condition_type 映射 ===\n";
$notification = new App\Notifications\AlertTriggeredNotification($rule, $indicator->indicatorValues()->first());
$reflection = new ReflectionMethod($notification, 'toMail');
$reflection->setAccessible(true);
$mailMessage = $reflection->invoke($notification, $director);
$lines = $mailMessage->introLines;
echo "Notification lines:\n";
$conditionFound = false;
foreach ($lines as $line) {
    echo "  $line\n";
    if (strpos($line, '小于等于') !== false) {
        $conditionFound = true;
    }
}
echo "  ✅ condition_type 'lte' 映射为 '小于等于': " . ($conditionFound ? "YES" : "NO - FAIL!") . "\n";

$notifArray = $notification->toArray($director);
echo "  toArray condition_type: " . ($notifArray['condition_type'] ?? 'NULL') . "\n";
echo "  ✅ toArray 中 condition_type 值正确: " . ($notifArray['condition_type'] === 'lte' ? "YES" : "NO - FAIL!") . "\n";

echo "\n=== 所有测试完成 ===\n";
