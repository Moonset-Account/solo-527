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

echo "🧪 测试1: 订单列表是否包含payments和refunds\n";
$orders = request("$api/orders?per_page=1", 'GET', null, $token);
$firstOrder = $orders['data'][0] ?? null;
$hasPayments = isset($firstOrder['payments']);
$hasRefunds = isset($firstOrder['refunds']);
echo "payments字段: " . ($hasPayments ? "✓ 存在" : "✗ 不存在") . "\n";
echo "refunds字段: " . ($hasRefunds ? "✓ 存在" : "✗ 不存在") . "\n\n";

echo "🧪 测试2: 部分退款后补收款，状态更新正确\n";
$order = request("$api/orders", 'POST', [
    'pickup_slot_id' => 3,
    'customer_name' => '部分退款补收测试',
    'customer_phone' => '13900139010',
    'items' => [['product_id' => 1, 'quantity' => 1]]
]);
$orderId = $order['order']['id'];
$total = $order['order']['total_amount'];
$deposit = $order['order']['deposit_amount'];
echo "订单ID: $orderId, 总额: $total, 定金: $deposit\n";

request("$api/orders/$orderId/confirm", 'POST', null, $token);
request("$api/payments", 'POST', [
    'order_id' => $orderId,
    'type' => 'full',
    'amount' => $total,
    'method' => 'wechat'
], $token);
echo "✓ 订单确认并收全款\n";

$slotBefore = request("$api/pickup-slots/3", 'GET', null, $token);
echo "退款前时段3 current_orders: {$slotBefore['current_orders']}\n";

request("$api/refunds", 'POST', [
    'order_id' => $orderId,
    'type' => 'partial',
    'amount' => 50,
    'method' => 'wechat',
    'reason' => '部分退款测试'
], $token);
$orderAfterRefund = request("$api/orders/$orderId", 'GET', null, $token);
echo "部分退款后支付状态: {$orderAfterRefund['payment_status']} (预期: partial_refund)\n";

$slotAfterPartial = request("$api/pickup-slots/3", 'GET', null, $token);
echo "部分退款后时段3 current_orders: {$slotAfterPartial['current_orders']} (应该不变)\n";

echo "--- 补收剩余款项 ---\n";
$remaining = $total - 50;
request("$api/payments", 'POST', [
    'order_id' => $orderId,
    'type' => 'full',
    'amount' => $remaining,
    'method' => 'alipay'
], $token);

$orderAfterPay = request("$api/orders/$orderId", 'GET', null, $token);
echo "补收款后支付状态: {$orderAfterPay['payment_status']} (预期: paid)\n";
$statusOk = ($orderAfterPay['payment_status'] === 'paid') ? "✓" : "✗";
echo "$statusOk 状态更新正确\n\n";

echo "🧪 测试3: 开始生产→就绪→核销取货（补收款后）\n";
request("$api/orders/$orderId/start-production", 'POST', null, $token);
request("$api/orders/$orderId/mark-ready", 'POST', null, $token);
$orderReady = request("$api/orders/$orderId", 'GET', null, $token);
echo "订单状态: {$orderReady['status']} (预期: ready)\n";

$pickupResult = request("$api/orders/$orderId/pickup", 'POST', null, $token);
echo "取货结果: " . ($pickupResult['message'] ?? json_encode($pickupResult)) . "\n";
$orderFinal = request("$api/orders/$orderId", 'GET', null, $token);
echo "最终订单状态: {$orderFinal['status']} (预期: picked_up)\n";
$pickupOk = ($orderFinal['status'] === 'picked_up') ? "✓" : "✗";
echo "$pickupOk 取货核销成功\n\n";

echo "🧪 测试4: 先取消再全额退款，不会重复扣减时段\n";
$order2 = request("$api/orders", 'POST', [
    'pickup_slot_id' => 4,
    'customer_name' => '取消再退款',
    'customer_phone' => '13900139020',
    'items' => [['product_id' => 1, 'quantity' => 1]]
]);
$order2Id = $order2['order']['id'];
$order2Total = $order2['order']['total_amount'];
echo "订单2 ID: $order2Id\n";

request("$api/orders/$order2Id/confirm", 'POST', null, $token);
request("$api/payments", 'POST', [
    'order_id' => $order2Id,
    'type' => 'full',
    'amount' => $order2Total,
    'method' => 'alipay'
], $token);

$slot4Before = request("$api/pickup-slots/4", 'GET', null, $token);
echo "取消前时段4 current_orders: {$slot4Before['current_orders']}\n";

request("$api/orders/$order2Id/cancel", 'POST', null, $token);
$slot4AfterCancel = request("$api/pickup-slots/4", 'GET', null, $token);
echo "取消后时段4 current_orders: {$slot4AfterCancel['current_orders']} (应该减1)\n";

$refundResult = request("$api/refunds", 'POST', [
    'order_id' => $order2Id,
    'type' => 'full',
    'amount' => $order2Total,
    'method' => 'alipay',
    'reason' => '取消后退款'
], $token);
echo "退款结果: " . ($refundResult['message'] ?? 'success') . "\n";

$slot4AfterRefund = request("$api/pickup-slots/4", 'GET', null, $token);
echo "退款后时段4 current_orders: {$slot4AfterRefund['current_orders']} (应该和取消后一样，不能再减)\n";
$noDoubleDecrement = ($slot4AfterRefund['current_orders'] == $slot4AfterCancel['current_orders'] && $slot4AfterRefund['current_orders'] >= 0) ? "✓" : "✗";
echo "$noDoubleDecrement 没有重复扣减，且不为负\n\n";

echo "🧪 测试5: current_orders不会为负数\n";
$slotCheck = request("$api/pickup-slots/4", 'GET', null, $token);
echo "时段4 current_orders: {$slotCheck['current_orders']}\n";
$notNegative = ($slotCheck['current_orders'] >= 0) ? "✓" : "✗";
echo "$notNegative current_orders不为负\n\n";

echo "🧪 测试6: 订单确认→收定金→部分退款→补收→完整流程\n";
$order3 = request("$api/orders", 'POST', [
    'pickup_slot_id' => 5,
    'customer_name' => '完整流程测试',
    'customer_phone' => '13900139030',
    'items' => [['product_id' => 2, 'quantity' => 1]]
]);
$order3Id = $order3['order']['id'];
$order3Total = $order3['order']['total_amount'];
$order3Deposit = $order3['order']['deposit_amount'];
$order3Balance = $order3Total - $order3Deposit;
echo "订单3 ID: $order3Id, 总额: $order3Total, 定金: $order3Deposit, 尾款: $order3Balance\n";

request("$api/orders/$order3Id/confirm", 'POST', null, $token);
echo "✓ 确认订单\n";

request("$api/payments", 'POST', [
    'order_id' => $order3Id,
    'type' => 'deposit',
    'amount' => $order3Deposit,
    'method' => 'wechat'
], $token);
$order3Check1 = request("$api/orders/$order3Id", 'GET', null, $token);
echo "收定金后支付状态: {$order3Check1['payment_status']} (预期: deposit_paid)\n";

echo "--- 退部分定金 ---\n";
request("$api/refunds", 'POST', [
    'order_id' => $order3Id,
    'type' => 'partial',
    'amount' => 20,
    'method' => 'wechat',
    'reason' => '退部分定金'
], $token);
$order3Check2 = request("$api/orders/$order3Id", 'GET', null, $token);
echo "退20后支付状态: {$order3Check2['payment_status']} (预期: deposit_paid 或 partial_refund)\n";

echo "--- 补收20 ---\n";
request("$api/payments", 'POST', [
    'order_id' => $order3Id,
    'type' => 'balance',
    'amount' => 20,
    'method' => 'wechat'
], $token);
$order3Check3 = request("$api/orders/$order3Id", 'GET', null, $token);
echo "补收20后支付状态: {$order3Check3['payment_status']} (预期: deposit_paid)\n";

echo "--- 收尾款 ---\n";
request("$api/payments", 'POST', [
    'order_id' => $order3Id,
    'type' => 'balance',
    'amount' => $order3Balance,
    'method' => 'wechat'
], $token);
$order3Check4 = request("$api/orders/$order3Id", 'GET', null, $token);
echo "收尾款后支付状态: {$order3Check4['payment_status']} (预期: paid)\n";

request("$api/orders/$order3Id/start-production", 'POST', null, $token);
request("$api/orders/$order3Id/mark-ready", 'POST', null, $token);
request("$api/orders/$order3Id/pickup", 'POST', null, $token);
$order3Final = request("$api/orders/$order3Id", 'GET', null, $token);
echo "最终状态: {$order3Final['status']} (预期: picked_up)\n";
$fullFlowOk = ($order3Final['status'] === 'picked_up' && $order3Final['payment_status'] === 'paid') ? "✓" : "✗";
echo "$fullFlowOk 完整流程通过\n\n";

echo "=== ✅ 所有测试完成 ===\n";
