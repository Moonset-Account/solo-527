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

echo "🧪 测试1: 定金部分退款后，补收定金入口可用\n";
$order = request("$api/orders", 'POST', [
    'pickup_slot_id' => 13,
    'customer_name' => '前端按钮测试',
    'customer_phone' => '13900000300',
    'items' => [['product_id' => 1, 'quantity' => 1]]
]);
$orderId = $order['order']['id'];
$total = $order['order']['total_amount'];
$deposit = $order['order']['deposit_amount'];
echo "订单 $orderId: 总额=$total, 定金=$deposit\n";

request("$api/orders/$orderId/confirm", 'POST', null, $token);
request("$api/payments", 'POST', ['order_id' => $orderId, 'type' => 'deposit', 'amount' => $deposit, 'method' => 'wechat'], $token);

request("$api/refunds", 'POST', ['order_id' => $orderId, 'type' => 'partial', 'amount' => 30, 'method' => 'wechat', 'reason' => '退部分定金'], $token);

$list = request("$api/orders?per_page=50", 'GET', null, $token);
$testOrder = null;
foreach ($list['data'] as $o) {
    if ($o['id'] == $orderId) {
        $testOrder = $o;
        break;
    }
}

if ($testOrder) {
    $paid = 0;
    if (!empty($testOrder['payments'])) {
        $paid = array_sum(array_column(array_filter($testOrder['payments'], fn($p) => $p['status'] === 'completed'), 'amount'));
    }
    $refunded = 0;
    if (!empty($testOrder['refunds'])) {
        $refunded = array_sum(array_column(array_filter($testOrder['refunds'], fn($r) => $r['status'] === 'completed'), 'amount'));
    }
    $netPaid = $paid - $refunded;
    $hasDepositPaid = ($netPaid >= $deposit);
    
    echo "  净支付: $netPaid, 定金: $deposit\n";
    echo "  hasDepositPaid: " . ($hasDepositPaid ? "true" : "false") . " (预期: false)\n";
    echo "  '收定金'按钮应该显示: " . (!$hasDepositPaid ? "✓" : "✗") . "\n";
    echo "  '收尾款'按钮应该隐藏: " . (!$hasDepositPaid ? "✓" : "✗") . "\n";
    
    $r = request("$api/payments", 'POST', ['order_id' => $orderId, 'type' => 'deposit', 'amount' => 30, 'method' => 'wechat'], $token);
    echo "  补收30定金: " . ($r['message'] ?? 'fail') . " (预期: 成功)\n";
}
echo "\n";

echo "🧪 测试2: 未取消订单全额退款时，时段正确释放\n";
$slotId = 14;
$slotBefore = request("$api/pickup-slots/$slotId", 'GET', null, $token);
echo "时段$slotId 初始: current_orders = " . $slotBefore['current_orders'] . "\n";

$order2 = request("$api/orders", 'POST', [
    'pickup_slot_id' => $slotId,
    'customer_name' => '全额退款释放',
    'customer_phone' => '13900000400',
    'items' => [['product_id' => 1, 'quantity' => 1]]
]);
$order2Id = $order2['order']['id'];
$order2Total = $order2['order']['total_amount'];

$s1 = request("$api/pickup-slots/$slotId", 'GET', null, $token);
echo "创建订单后: current_orders = " . $s1['current_orders'] . " (应该+1)\n";

request("$api/orders/$order2Id/confirm", 'POST', null, $token);
request("$api/payments", 'POST', ['order_id' => $order2Id, 'type' => 'full', 'amount' => $order2Total, 'method' => 'alipay'], $token);

$orderCheck = request("$api/orders/$order2Id", 'GET', null, $token);
echo "订单状态: " . $orderCheck['status'] . " (预期: confirmed)\n";

request("$api/refunds", 'POST', ['order_id' => $order2Id, 'type' => 'full', 'amount' => $order2Total, 'method' => 'alipay', 'reason' => '全额退款'], $token);

$s2 = request("$api/pickup-slots/$slotId", 'GET', null, $token);
echo "全额退款后: current_orders = " . $s2['current_orders'] . " (应该-1，回到初始)\n";

$ok = ($s2['current_orders'] == $slotBefore['current_orders']) ? "✓" : "✗";
echo "$ok 时段正确释放\n\n";

echo "🧪 测试3: 验证时段不会为负\n";
$allSlots = request("$api/pickup-slots?per_page=100", 'GET', null, $token);
$negative = 0;
foreach ($allSlots['data'] as $s) {
    if ($s['current_orders'] < 0) {
        $negative++;
        echo "  ✗ 时段 {$s['id']}: current_orders = {$s['current_orders']}\n";
    }
}
if ($negative === 0) {
    echo "✓ 所有时段 current_orders 不为负\n";
}
echo "\n";

echo "🧪 测试4: 完整场景验证\n";
$order3 = request("$api/orders", 'POST', [
    'pickup_slot_id' => 15,
    'customer_name' => '完整场景',
    'customer_phone' => '13900000500',
    'items' => [['product_id' => 2, 'quantity' => 1]]
]);
$order3Id = $order3['order']['id'];
$order3Total = $order3['order']['total_amount'];
$order3Deposit = $order3['order']['deposit_amount'];
$order3Balance = $order3Total - $order3Deposit;
echo "订单 $order3Id: 总额=$order3Total, 定金=$order3Deposit, 尾款=$order3Balance\n";

request("$api/orders/$order3Id/confirm", 'POST', null, $token);
request("$api/payments", 'POST', ['order_id' => $order3Id, 'type' => 'deposit', 'amount' => $order3Deposit, 'method' => 'wechat'], $token);

request("$api/refunds", 'POST', ['order_id' => $order3Id, 'type' => 'partial', 'amount' => 30, 'method' => 'wechat', 'reason' => '优惠'], $token);
$check1 = request("$api/orders/$order3Id", 'GET', null, $token);
$net1 = array_sum(array_column(array_filter($check1['payments'], fn($p) => $p['status'] === 'completed'), 'amount')) - array_sum(array_column(array_filter($check1['refunds'], fn($r) => $r['status'] === 'completed'), 'amount'));
echo "  退30后净支付: $net1, 状态: {$check1['payment_status']}\n";
$hasDep1 = ($net1 >= $order3Deposit) ? "true" : "false";
echo "  hasDepositPaid: $hasDep1 (预期: false，可继续收定金)\n";

request("$api/payments", 'POST', ['order_id' => $order3Id, 'type' => 'deposit', 'amount' => 30, 'method' => 'wechat'], $token);
$check2 = request("$api/orders/$order3Id", 'GET', null, $token);
$net2 = array_sum(array_column(array_filter($check2['payments'], fn($p) => $p['status'] === 'completed'), 'amount')) - array_sum(array_column(array_filter($check2['refunds'], fn($r) => $r['status'] === 'completed'), 'amount'));
echo "  补收30后净支付: $net2, 状态: {$check2['payment_status']}\n";
$hasDep2 = ($net2 >= $order3Deposit) ? "true" : "false";
echo "  hasDepositPaid: $hasDep2 (预期: true，可收尾款)\n";

request("$api/payments", 'POST', ['order_id' => $order3Id, 'type' => 'balance', 'amount' => $order3Balance, 'method' => 'wechat'], $token);
$check3 = request("$api/orders/$order3Id", 'GET', null, $token);
echo "  收尾款后支付状态: {$check3['payment_status']} (预期: paid)\n";

request("$api/orders/$order3Id/start-production", 'POST', null, $token);
request("$api/orders/$order3Id/mark-ready", 'POST', null, $token);
request("$api/orders/$order3Id/pickup", 'POST', null, $token);
$check4 = request("$api/orders/$order3Id", 'GET', null, $token);
echo "  最终状态: {$check4['status']} (预期: picked_up)\n";
$fullOk = ($check4['status'] === 'picked_up' && $check4['payment_status'] === 'paid') ? "✓" : "✗";
echo "$fullOk 完整流程通过\n\n";

echo "=== ✅ 所有测试完成 ===\n";
