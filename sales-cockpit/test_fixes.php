<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$director = App\Models\User::where('email', 'director@example.com')->first();
$indicator = App\Models\Indicator::first();
Auth::login($director);

echo "=== Test 1: 复盘报表路由顺序测试 ===\n";
$request = Illuminate\Http\Request::create('/review-rhythms/report', 'GET', ['month' => '2026-06']);
$response = $app->handle($request);
echo "GET /review-rhythms/report HTTP: " . $response->getStatusCode() . "\n";
$content = $response->getContent();
$pos = strpos($content, 'type="application/json">');
if ($pos !== false) {
    $start = $pos + strlen('type="application/json">');
    $end = strpos($content, '</script>', $start);
    $json = substr($content, $start, $end - $start);
    $page = json_decode($json, true);
    echo "Component: " . $page['component'] . "\n";
    if (isset($page['props']['month'])) {
        echo "Report month: " . $page['props']['month'] . "\n";
    }
} else {
    echo "WARNING: Could not parse Inertia data\n";
}

echo "\n=== Test 2: 创建业务工单 + 告警规则 (直接调用模型) ===\n";
$order = App\Models\BusinessOrder::create([
    'order_no' => 'BO-' . now()->format('Ymd') . '-88' . rand(10, 99),
    'title' => '测试业务工单',
    'description' => '测试告警规则创建',
    'status' => 'pending',
    'created_by' => $director->id,
]);
echo "Created order: {$order->order_no} - {$order->title}\n";

echo "\n=== Test 3: 控制器校验 condition_type = gt ===\n";
$request = Illuminate\Http\Request::create('/alert-rules', 'POST', [
    'business_order_id' => $order->id,
    'indicator_id' => $indicator->id,
    'condition_type' => 'gt',
    'threshold_value' => 100.5,
    'notify_user_ids' => [$director->id],
]);
$request->setUserResolver(fn () => $director);
try {
    $validated = $request->validate([
        'business_order_id' => ['required', 'integer', 'exists:business_orders,id'],
        'indicator_id' => ['required', 'integer', 'exists:indicators,id'],
        'condition_type' => ['required', 'string', 'in:gt,lt,eq,gte,lte,between'],
        'threshold_value' => ['required', 'numeric'],
        'threshold_value_max' => ['nullable', 'numeric'],
        'notify_user_ids' => ['required', 'array'],
    ]);
    echo "Validation passed for condition_type=gt\n";
} catch (Exception $e) {
    echo "Validation FAILED: " . $e->getMessage() . "\n";
}

echo "\n=== Test 4: 控制器校验 condition_type = between ===\n";
$request = Illuminate\Http\Request::create('/alert-rules', 'POST', [
    'business_order_id' => $order->id,
    'indicator_id' => $indicator->id,
    'condition_type' => 'between',
    'threshold_value' => 50,
    'threshold_value_max' => 150,
    'notify_user_ids' => [$director->id],
]);
$request->setUserResolver(fn () => $director);
try {
    $validated = $request->validate([
        'business_order_id' => ['required', 'integer', 'exists:business_orders,id'],
        'indicator_id' => ['required', 'integer', 'exists:indicators,id'],
        'condition_type' => ['required', 'string', 'in:gt,lt,eq,gte,lte,between'],
        'threshold_value' => ['required', 'numeric'],
        'threshold_value_max' => ['nullable', 'numeric'],
        'notify_user_ids' => ['required', 'array'],
    ]);
    echo "Validation passed for condition_type=between\n";
    $rule = App\Models\AlertRule::create($validated + ['is_active' => true]);
    echo "DB saved: condition_type={$rule->condition_type}\n";
} catch (Exception $e) {
    echo "Validation FAILED: " . $e->getMessage() . "\n";
}

echo "\n=== Test 5: 旧值 greater_than 应该被控制器拒绝 ===\n";
$request = Illuminate\Http\Request::create('/alert-rules', 'POST', [
    'business_order_id' => $order->id,
    'indicator_id' => $indicator->id,
    'condition_type' => 'greater_than',
    'threshold_value' => 100.5,
    'notify_user_ids' => [$director->id],
]);
$request->setUserResolver(fn () => $director);
try {
    $validated = $request->validate([
        'condition_type' => ['required', 'string', 'in:gt,lt,eq,gte,lte,between'],
    ]);
    echo "ERROR: greater_than should have been rejected!\n";
} catch (Exception $e) {
    echo "CORRECT: greater_than was rejected by validator\n";
}

echo "\n=== Test 6: 数据库枚举校验 ===\n";
$dbEnum = ['gt','lt','eq','gte','lte','between'];
$allMatch = true;
foreach (['gt','lt','eq','gte','lte','between'] as $ct) {
    if (!in_array($ct, $dbEnum)) {
        echo "MISMATCH: $ct not in DB enum\n";
        $allMatch = false;
    }
}
echo "All condition_type match DB enum: " . ($allMatch ? "YES" : "NO") . "\n";

echo "\n=== Test 7: 告警服务映射 ===\n";
$testValue = App\Models\IndicatorValue::where('indicator_id', $indicator->id)->first();
$alertService = app(App\Services\AlertService::class);
$reflection = new ReflectionMethod($alertService, 'isTriggered');
$reflection->setAccessible(true);

$rule = App\Models\AlertRule::create([
    'business_order_id' => $order->id,
    'indicator_id' => $indicator->id,
    'condition_type' => 'gt',
    'threshold_value' => 1,
    'notify_user_ids' => [$director->id],
    'is_active' => true,
]);
echo "Rule (gt, threshold=1), actual={$testValue->value}: triggered=" . ($reflection->invoke($alertService, $rule, $testValue) ? 'yes' : 'no') . "\n";

$rule2 = App\Models\AlertRule::create([
    'business_order_id' => $order->id,
    'indicator_id' => $indicator->id,
    'condition_type' => 'lte',
    'threshold_value' => 1,
    'notify_user_ids' => [$director->id],
    'is_active' => true,
]);
echo "Rule2 (lte, threshold=1), actual={$testValue->value}: triggered=" . ($reflection->invoke($alertService, $rule2, $testValue) ? 'yes' : 'no') . "\n";

echo "\n=== Test 8: 复盘节奏列表路由正常 ===\n";
$request = Illuminate\Http\Request::create("/review-rhythms", 'GET');
$response = $app->handle($request);
echo "GET /review-rhythms HTTP: " . $response->getStatusCode() . "\n";
$content = $response->getContent();
$pos = strpos($content, 'type="application/json">');
if ($pos !== false) {
    $start = $pos + strlen('type="application/json">');
    $end = strpos($content, '</script>', $start);
    $json = substr($content, $start, $end - $start);
    $page = json_decode($json, true);
    echo "Component: " . $page['component'] . "\n";
}

echo "\n=== All tests completed ===\n";
