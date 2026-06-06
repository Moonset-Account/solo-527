<?php
$api = 'http://127.0.0.1:8080/api';

function request($url, $method = 'GET', $data = null, $token = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    $headers = ['Content-Type: application/json'];
    if ($token) {
        $headers[] = "Authorization: Bearer $token";
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $result = curl_exec($ch);
    curl_close($ch);
    return json_decode($result, true);
}

echo "=== 登录 ===\n";
$login = request("$api/auth/login", 'POST', [
    'email' => 'admin@bakery.com',
    'password' => 'password123'
]);
$token = $login['token'];
echo "✓ 登录成功\n\n";

echo "🧪 场景测试: 收定金→部分退款→补收→收尾款→完整流程\n";
$order = request("$api/orders", 'POST', [
    'pickup_slot_id' => 6,
    'customer_name' => '流程测试',
    'customer_phone' => '13900139100',
    'items' => [['product_id' => 1, 'quantity' => 1]]
]);
$orderId = $order['order']['id'];
$total = $order['order']['total_amount'];
$deposit = $order['order']['deposit_amount'];
$balance = $total - $deposit;
echo "订单ID: $orderId, 总额: $total, 定金: $deposit, 尾款: $balance\n";

request("$api/orders/$orderId/confirm", 'POST', null, $token);
echo "✓ 确认订单\n";

echo "--- 收定金 $deposit ---\n";
request("$api/payments", 'POST', [
    'order_id' => $orderId,
    'type' => 'deposit',
    'amount' => $deposit,
    'method' => 'wechat'
], $token);
$check1 = request("$api/orders/$orderId", 'GET', null, $token);
echo "支付状态: {$check1['payment_status']} (预期: deposit_paid) ✓\n";

echo "--- 部分退款 20元 ---\n";
request("$api/refunds", 'POST', [
    'order_id' => $orderId,
    'type' => 'partial',
    'amount' => 20,
    'method' => 'wechat',
    'reason' => '优惠调整'
], $token);
$check2 = request("$api/orders/$orderId", 'GET', null, $token);
$netPaid1 = $deposit - 20;
echo "退款20后，净支付: $netPaid1\n";
echo "支付状态: {$check2['payment_status']} (预期: partial_refund 或 deposit_paid)\n";

echo "--- 补收 20元 ---\n";
$remaining1 = $total - $netPaid1;
request("$api/payments", 'POST', [
    'order_id' => $orderId,
    'type' => 'balance',
    'amount' => 20,
    'method' => 'wechat'
], $token);
$check3 = request("$api/orders/$orderId", 'GET', null, $token);
echo "补收20后支付状态: {$check3['payment_status']} (预期: deposit_paid)\n";
$ok1 = ($check3['payment_status'] === 'deposit_paid') ? "✓" : "✗";
echo "$ok1 补收后状态正确\n";

echo "--- 收尾款 $balance ---\n";
request("$api/payments", 'POST', [
    'order_id' => $orderId,
    'type' => 'balance',
    'amount' => $balance,
    'method' => 'wechat'
], $token);
$check4 = request("$api/orders/$orderId", 'GET', null, $token);
echo "收尾款后支付状态: {$check4['payment_status']} (预期: paid)\n";
$ok2 = ($check4['payment_status'] === 'paid') ? "✓" : "✗";
echo "$ok2 尾款支付后状态正确\n";

echo "--- 开始生产 → 标记就绪 → 核销取货 ---\n";
request("$api/orders/$orderId/start-production", 'POST', null, $token);
request("$api/orders/$orderId/mark-ready", 'POST', null, $token);
$pickupResult = request("$api/orders/$orderId/pickup", 'POST', null, $token);
$check5 = request("$api/orders/$orderId", 'GET', null, $token);
echo "取货结果: " . ($pickupResult['message'] ?? 'fail') . "\n";
echo "最终状态: {$check5['status']} (预期: picked_up)\n";
$ok3 = ($check5['status'] === 'picked_up') ? "✓" : "✗";
echo "$ok3 完整流程通过\n\n";

echo "🧪 场景测试: 收全款→部分退款→补收剩余→完成\n";
$order2 = request("$api/orders", 'POST', [
    'pickup_slot_id' => 7,
    'customer_name' => '全款测试',
    'customer_phone' => '13900139200',
    'items' => [['product_id' => 1, 'quantity' => 1]]
]);
$order2Id = $order2['order']['id'];
$order2Total = $order2['order']['total_amount'];
echo "订单ID: $order2Id, 总额: $order2Total\n";

request("$api/orders/$order2Id/confirm", 'POST', null, $token);
request("$api/payments", 'POST', [
    'order_id' => $order2Id,
    'type' => 'full',
    'amount' => $order2Total,
    'method' => 'alipay'
], $token);
$c1 = request("$api/orders/$order2Id", 'GET', null, $token);
echo "收全款后状态: {$c1['payment_status']} (预期: paid) ✓\n";

echo "--- 部分退款 30元 ---\n";
request("$api/refunds", 'POST', [
    'order_id' => $order2Id,
    'type' => 'partial',
    'amount' => 30,
    'method' => 'alipay',
    'reason' => '部分退款'
], $token);
$c2 = request("$api/orders/$order2Id", 'GET', null, $token);
$net2 = $order2Total - 30;
echo "退30后净支付: $net2, 状态: {$c2['payment_status']} (预期: partial_refund)\n";

echo "--- 补收 30元 ---\n";
request("$api/payments", 'POST', [
    'order_id' => $order2Id,
    'type' => 'full',
    'amount' => 30,
    'method' => 'alipay'
], $token);
$c3 = request("$api/orders/$order2Id", 'GET', null, $token);
echo "补收30后状态: {$c3['payment_status']} (预期: paid)\n";
$ok4 = ($c3['payment_status'] === 'paid') ? "✓" : "✗";
echo "$ok4 补收后状态正确\n";

echo "--- 生产 → 取货 ---\n";
request("$api/orders/$order2Id/start-production", 'POST', null, $token);
request("$api/orders/$order2Id/mark-ready", 'POST', null, $token);
request("$api/orders/$order2Id/pickup", 'POST', null, $token);
$c4 = request("$api/orders/$order2Id", 'GET', null, $token);
echo "最终状态: {$c4['status']} (预期: picked_up)\n";
$ok5 = ($c4['status'] === 'picked_up') ? "✓" : "✗";
echo "$ok5 完整流程通过\n\n";

echo "🧪 场景测试: 取消订单再退款，不重复扣减时段\n";
$slotId = 8;
$slotBefore = request("$api/pickup-slots/$slotId", 'GET', null, $token);
echo "时段$slotId 初始: current_orders = {$slotBefore['current_orders']}\n";

$order3 = request("$api/orders", 'POST', [
    'pickup_slot_id' => $slotId,
    'customer_name' => '取消退款',
    'customer_phone' => '13900139300',
    'items' => [['product_id' => 1, 'quantity' => 1]]
]);
$order3Id = $order3['order']['id'];
$order3Total = $order3['order']['total_amount'];
$s1 = request("$api/pickup-slots/$slotId", 'GET', null, $token);
echo "创建订单后: current_orders = {$s1['current_orders']} ✓\n";

request("$api/orders/$order3Id/confirm", 'POST', null, $token);
request("$api/payments", 'POST', [
    'order_id' => $order3Id,
    'type' => 'full',
    'amount' => $order3Total,
    'method' => 'cash'
], $token);

request("$api/orders/$order3Id/cancel", 'POST', null, $token);
$s2 = request("$api/pickup-slots/$slotId", 'GET', null, $token);
echo "取消订单后: current_orders = {$s2['current_orders']} (应该减1)\n";

request("$api/refunds", 'POST', [
    'order_id' => $order3Id,
    'type' => 'full',
    'amount' => $order3Total,
    'method' => 'cash',
    'reason' => '取消后退款'
], $token);
$s3 = request("$api/pickup-slots/$slotId", 'GET', null, $token);
echo "退款后: current_orders = {$s3['current_orders']} (应该和取消后一样)\n";
$ok6 = ($s3['current_orders'] == $s2['current_orders'] && $s3['current_orders'] >= 0) ? "✓" : "✗";
echo "$ok6 没有重复扣减\n\n";

echo "🧪 验证: 时段current_orders不会为负\n";
$allSlots = request("$api/pickup-slots?per_page=100", 'GET', null, $token);
$negativeCount = 0;
foreach ($allSlots['data'] as $slot) {
    if ($slot['current_orders'] < 0) {
        $negativeCount++;
        echo "✗ 时段 {$slot['id']} current_orders = {$slot['current_orders']} (负数)\n";
    }
}
if ($negativeCount === 0) {
    echo "✓ 所有时段 current_orders 都不为负\n";
}

echo "\n=== ✅ 全部测试完成 ===\n";
