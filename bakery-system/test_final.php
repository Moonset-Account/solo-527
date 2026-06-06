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

echo "🧪 测试1: 游客创建订单\n";
$order = request("$api/orders", 'POST', [
    'pickup_slot_id' => 2,
    'customer_name' => '测试用户',
    'customer_phone' => '13900139001',
    'items' => [['product_id' => 1, 'quantity' => 1]]
]);
$orderId = $order['order']['id'];
$total = $order['order']['total_amount'];
$deposit = $order['order']['deposit_amount'];
$balance = $total - $deposit;
echo "✓ 订单ID: $orderId, 总额: $total, 定金: $deposit, 尾款: $balance\n\n";

echo "🧪 测试2: 确认订单\n";
$confirm = request("$api/orders/$orderId/confirm", 'POST', null, $token);
echo "✓ 状态: {$confirm['order']['status']}\n\n";

echo "🧪 测试3: 收定金(正确金额 $deposit)\n";
$pay1 = request("$api/payments", 'POST', [
    'order_id' => $orderId,
    'type' => 'deposit',
    'amount' => $deposit,
    'method' => 'wechat'
], $token);
echo "结果: " . ($pay1['message'] ?? json_encode($pay1)) . "\n";
echo "支付状态: " . ($pay1['payment']['order']['payment_status'] ?? 'N/A') . "\n\n";

echo "🧪 测试4: 重复收定金(应报错)\n";
$pay2 = request("$api/payments", 'POST', [
    'order_id' => $orderId,
    'type' => 'deposit',
    'amount' => $deposit,
    'method' => 'wechat'
], $token);
echo "结果: " . ($pay2['message'] ?? json_encode($pay2)) . "\n\n";

echo "🧪 测试5: 收全款金额错误(应报错)\n";
$pay3 = request("$api/payments", 'POST', [
    'order_id' => $orderId,
    'type' => 'full',
    'amount' => 100,
    'method' => 'wechat'
], $token);
echo "结果: " . ($pay3['message'] ?? json_encode($pay3)) . "\n\n";

echo "🧪 测试6: 收尾款(正确 $balance)\n";
$pay4 = request("$api/payments", 'POST', [
    'order_id' => $orderId,
    'type' => 'balance',
    'amount' => $balance,
    'method' => 'wechat'
], $token);
echo "结果: " . ($pay4['message'] ?? json_encode($pay4)) . "\n";
echo "支付状态: " . ($pay4['payment']['order']['payment_status'] ?? 'N/A') . "\n\n";

echo "🧪 测试7: 超收测试(应报错)\n";
$pay5 = request("$api/payments", 'POST', [
    'order_id' => $orderId,
    'type' => 'full',
    'amount' => 10,
    'method' => 'wechat'
], $token);
echo "结果: " . ($pay5['message'] ?? json_encode($pay5)) . "\n\n";

echo "🧪 测试8: 时段2订单数\n";
$slot = request("$api/pickup-slots/2", 'GET', null, $token);
echo "current_orders: {$slot['current_orders']}\n\n";

echo "🧪 测试9: 创建订单2测试退款\n";
$order2 = request("$api/orders", 'POST', [
    'pickup_slot_id' => 2,
    'customer_name' => '退款测试',
    'customer_phone' => '13900139002',
    'items' => [['product_id' => 1, 'quantity' => 1]]
]);
$order2Id = $order2['order']['id'];
$order2Total = $order2['order']['total_amount'];
echo "订单2 ID: $order2Id, 总额: $order2Total\n";
request("$api/orders/$order2Id/confirm", 'POST', null, $token);
request("$api/payments", 'POST', [
    'order_id' => $order2Id,
    'type' => 'full',
    'amount' => $order2Total,
    'method' => 'alipay'
], $token);
echo "✓ 订单2确认并收全款完成\n\n";

echo "🧪 测试10: 无支付记录的订单不能退款(应报错)\n";
$order3 = request("$api/orders", 'POST', [
    'pickup_slot_id' => 2,
    'customer_name' => '不能退款',
    'customer_phone' => '13900139003',
    'items' => [['product_id' => 1, 'quantity' => 1]]
]);
$order3Id = $order3['order']['id'];
$refundFail = request("$api/refunds", 'POST', [
    'order_id' => $order3Id,
    'type' => 'full',
    'amount' => 100,
    'method' => 'alipay',
    'reason' => '测试无支付退款'
], $token);
echo "结果: " . ($refundFail['message'] ?? json_encode($refundFail)) . "\n\n";

echo "🧪 测试11: 部分退款(时段不应扣减)\n";
$slotBefore = request("$api/pickup-slots/2", 'GET', null, $token);
echo "退款前: current_orders = {$slotBefore['current_orders']}\n";
$refund1 = request("$api/refunds", 'POST', [
    'order_id' => $order2Id,
    'type' => 'partial',
    'amount' => 50,
    'method' => 'alipay',
    'reason' => '部分退款测试'
], $token);
echo "退款结果: " . ($refund1['message'] ?? 'success') . "\n";
$slotAfter1 = request("$api/pickup-slots/2", 'GET', null, $token);
echo "部分退款后: current_orders = {$slotAfter1['current_orders']} (应该不变)\n";
$ok1 = ($slotAfter1['current_orders'] == $slotBefore['current_orders']) ? '✓' : '✗';
echo "$ok1 部分退款时段正确\n\n";

echo "🧪 测试12: 全额退款(时段应扣减)\n";
$remaining = $order2Total - 50;
$refund2 = request("$api/refunds", 'POST', [
    'order_id' => $order2Id,
    'type' => 'full',
    'amount' => $remaining,
    'method' => 'alipay',
    'reason' => '全额退款测试'
], $token);
echo "退款结果: " . ($refund2['message'] ?? 'success') . "\n";
$slotAfter2 = request("$api/pickup-slots/2", 'GET', null, $token);
echo "全额退款后: current_orders = {$slotAfter2['current_orders']} (应该减1)\n";
$ok2 = ($slotAfter2['current_orders'] == $slotBefore['current_orders'] - 1) ? '✓' : '✗';
echo "$ok2 全额退款时段正确\n\n";

echo "🧪 测试13: 订单2最终状态\n";
$order2Final = request("$api/orders/$order2Id", 'GET', null, $token);
echo "订单状态: {$order2Final['status']}, 支付状态: {$order2Final['payment_status']}\n";
$ok3 = ($order2Final['status'] === 'refunded' && $order2Final['payment_status'] === 'full_refund') ? '✓' : '✗';
echo "$ok3 最终状态正确\n\n";

echo "🧪 测试14: 退款超过已支付(应报错)\n";
$order4 = request("$api/orders", 'POST', [
    'pickup_slot_id' => 2,
    'customer_name' => '超额退款',
    'customer_phone' => '13900139004',
    'items' => [['product_id' => 1, 'quantity' => 1]]
]);
$order4Id = $order4['order']['id'];
request("$api/orders/$order4Id/confirm", 'POST', null, $token);
request("$api/payments", 'POST', [
    'order_id' => $order4Id,
    'type' => 'deposit',
    'amount' => 50,
    'method' => 'wechat'
], $token);
$refund3 = request("$api/refunds", 'POST', [
    'order_id' => $order4Id,
    'type' => 'partial',
    'amount' => 100,
    'method' => 'wechat',
    'reason' => '超额退款测试'
], $token);
echo "结果: " . ($refund3['message'] ?? json_encode($refund3)) . "\n\n";

echo "=== ✅ 所有测试完成 ===\n";
