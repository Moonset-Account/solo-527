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

// 创建订单
$order = request("$api/orders", 'POST', [
    'pickup_slot_id' => 10,
    'customer_name' => '调试',
    'customer_phone' => '13900000099',
    'items' => [['product_id' => 1, 'quantity' => 1]]
]);
$orderId = $order['order']['id'];
$total = $order['order']['total_amount'];
$deposit = $order['order']['deposit_amount'];
echo "订单 $orderId: 总额=$total, 定金=$deposit\n\n";

request("$api/orders/$orderId/confirm", 'POST', null, $token);

// 收定金
echo "1. 收定金 $deposit: ";
$r = request("$api/payments", 'POST', ['order_id' => $orderId, 'type' => 'deposit', 'amount' => $deposit, 'method' => 'wechat'], $token);
echo ($r['message'] ?? json_encode($r)) . "\n";

// 退款20
echo "2. 退20: ";
$r = request("$api/refunds", 'POST', ['order_id' => $orderId, 'type' => 'partial', 'amount' => 20, 'method' => 'wechat', 'reason' => 'test'], $token);
echo ($r['message'] ?? json_encode($r)) . "\n";

// 检查状态
$check = request("$api/orders/$orderId", 'GET', null, $token);
$paid = array_sum(array_column(array_filter($check['payments'], fn($p) => $p['status'] === 'completed'), 'amount'));
$refunded = array_sum(array_column(array_filter($check['refunds'], fn($r) => $r['status'] === 'completed'), 'amount'));
echo "   净支付: " . ($paid - $refunded) . ", 状态: " . $check['payment_status'] . "\n";

// 补收20 (type=deposit)
echo "3. 补收20(type=deposit): ";
$r = request("$api/payments", 'POST', ['order_id' => $orderId, 'type' => 'deposit', 'amount' => 20, 'method' => 'wechat'], $token);
echo ($r['message'] ?? json_encode($r)) . "\n";

// 再检查
$check = request("$api/orders/$orderId", 'GET', null, $token);
$paid = array_sum(array_column(array_filter($check['payments'], fn($p) => $p['status'] === 'completed'), 'amount'));
$refunded = array_sum(array_column(array_filter($check['refunds'], fn($r) => $r['status'] === 'completed'), 'amount'));
echo "   净支付: " . ($paid - $refunded) . ", 状态: " . $check['payment_status'] . "\n";
echo "   支付记录数: " . count($check['payments']) . "\n";
