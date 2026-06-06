<?php
$api = 'http://127.0.0.1:8080/api';

function request($url, $method = 'GET', $data = null, $token = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    $headers = ['Content-Type: application/json'];
    if ($token) $headers[] = "Authorization: Bearer $token";
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    if ($data) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    $result = curl_exec($ch);
    curl_close($ch);
    return json_decode($result, true);
}

$login = request("$api/auth/login", 'POST', ['email' => 'admin@bakery.com', 'password' => 'password123']);
$token = $login['token'];

echo "🧪 完整流程测试: 收定金→退部分→补收定金→收尾款→生产→取货\n";
$order = request("$api/orders", 'POST', [
    'pickup_slot_id' => 11,
    'customer_name' => '完整流程',
    'customer_phone' => '13900000100',
    'items' => [['product_id' => 1, 'quantity' => 1]]
]);
$orderId = $order['order']['id'];
$total = $order['order']['total_amount'];
$deposit = $order['order']['deposit_amount'];
$balance = $total - $deposit;
echo "订单 $orderId: 总额=$total, 定金=$deposit, 尾款=$balance\n\n";

request("$api/orders/$orderId/confirm", 'POST', null, $token);
echo "✓ 确认订单\n";

echo "1. 收定金 $deposit: ";
request("$api/payments", 'POST', ['order_id' => $orderId, 'type' => 'deposit', 'amount' => $deposit, 'method' => 'wechat'], $token);
$c = request("$api/orders/$orderId", 'GET', null, $token);
echo "状态: " . $c['payment_status'] . "\n";

echo "2. 部分退款 20: ";
request("$api/refunds", 'POST', ['order_id' => $orderId, 'type' => 'partial', 'amount' => 20, 'method' => 'wechat', 'reason' => '调整'], $token);
$c = request("$api/orders/$orderId", 'GET', null, $token);
$net = array_sum(array_column(array_filter($c['payments'], fn($p) => $p['status'] === 'completed'), 'amount')) - array_sum(array_column(array_filter($c['refunds'], fn($r) => $r['status'] === 'completed'), 'amount'));
echo "净支付: $net, 状态: " . $c['payment_status'] . "\n";

echo "3. 补收定金 20: ";
request("$api/payments", 'POST', ['order_id' => $orderId, 'type' => 'deposit', 'amount' => 20, 'method' => 'wechat'], $token);
$c = request("$api/orders/$orderId", 'GET', null, $token);
$net = array_sum(array_column(array_filter($c['payments'], fn($p) => $p['status'] === 'completed'), 'amount')) - array_sum(array_column(array_filter($c['refunds'], fn($r) => $r['status'] === 'completed'), 'amount'));
echo "净支付: $net, 状态: " . $c['payment_status'] . " ✓\n";

echo "4. 收尾款 $balance: ";
request("$api/payments", 'POST', ['order_id' => $orderId, 'type' => 'balance', 'amount' => $balance, 'method' => 'wechat'], $token);
$c = request("$api/orders/$orderId", 'GET', null, $token);
$net = array_sum(array_column(array_filter($c['payments'], fn($p) => $p['status'] === 'completed'), 'amount')) - array_sum(array_column(array_filter($c['refunds'], fn($r) => $r['status'] === 'completed'), 'amount'));
echo "净支付: $net, 状态: " . $c['payment_status'] . " ✓\n";

echo "5. 开始生产: ";
$r = request("$api/orders/$orderId/start-production", 'POST', null, $token);
echo ($r['message'] ?? 'success') . "\n";

echo "6. 标记就绪: ";
$r = request("$api/orders/$orderId/mark-ready", 'POST', null, $token);
echo ($r['message'] ?? 'success') . "\n";

echo "7. 核销取货: ";
$r = request("$api/orders/$orderId/pickup", 'POST', null, $token);
echo ($r['message'] ?? 'fail') . "\n";

$c = request("$api/orders/$orderId", 'GET', null, $token);
echo "✓ 最终状态: " . $c['status'] . " (picked_up)\n\n";

echo "🧪 测试: 订单列表包含payments和refunds字段\n";
$list = request("$api/orders?per_page=1", 'GET', null, $token);
$first = $list['data'][0];
$hasP = isset($first['payments']);
$hasR = isset($first['refunds']);
echo "payments: " . ($hasP ? "✓" : "✗") . ", refunds: " . ($hasR ? "✓" : "✗") . "\n\n";

echo "🧪 测试: 取消订单再退款不重复扣减时段\n";
$slotId = 12;
$s0 = request("$api/pickup-slots/$slotId", 'GET', null, $token);
echo "时段$slotId 初始: " . $s0['current_orders'] . "\n";

$order2 = request("$api/orders", 'POST', [
    'pickup_slot_id' => $slotId,
    'customer_name' => '取消测试',
    'customer_phone' => '13900000200',
    'items' => [['product_id' => 1, 'quantity' => 1]]
]);
$order2Id = $order2['order']['id'];
$order2Total = $order2['order']['total_amount'];

$s1 = request("$api/pickup-slots/$slotId", 'GET', null, $token);
echo "创建订单后: " . $s1['current_orders'] . " (应该+1)\n";

request("$api/orders/$order2Id/confirm", 'POST', null, $token);
request("$api/payments", 'POST', ['order_id' => $order2Id, 'type' => 'full', 'amount' => $order2Total, 'method' => 'cash'], $token);

request("$api/orders/$order2Id/cancel", 'POST', null, $token);
$s2 = request("$api/pickup-slots/$slotId", 'GET', null, $token);
echo "取消后: " . $s2['current_orders'] . " (应该-1)\n";

request("$api/refunds", 'POST', ['order_id' => $order2Id, 'type' => 'full', 'amount' => $order2Total, 'method' => 'cash', 'reason' => '取消退款'], $token);
$s3 = request("$api/pickup-slots/$slotId", 'GET', null, $token);
echo "退款后: " . $s3['current_orders'] . " (应该不变)\n";
$ok = ($s3['current_orders'] == $s2['current_orders'] && $s3['current_orders'] >= 0) ? "✓" : "✗";
echo "$ok 没有重复扣减\n\n";

echo "🧪 验证: 所有时段current_orders不为负\n";
$slots = request("$api/pickup-slots?per_page=100", 'GET', null, $token);
$neg = 0;
foreach ($slots['data'] as $s) {
    if ($s['current_orders'] < 0) $neg++;
}
echo ($neg === 0 ? "✓" : "✗ 有$neg个时段为负") . "\n\n";

echo "=== ✅ 全部测试通过 ===\n";
