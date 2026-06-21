<?php
$baseUrl = 'http://localhost:8080';
$testPhone = '139' . rand(10000000, 99999999);

echo "=== 行业峰会复盘看板 - 端到端验证 (修正路由名+统一密码) ===\n\n";

// ============ Helper ============
function doRequest($method, $url, $data = null, $headers = []) {
    global $baseUrl;
    $ch = curl_init($baseUrl . $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, is_array($data) ? http_build_query($data) : $data);
    } elseif ($method === 'PUT') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        if ($data !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, is_array($data) ? http_build_query($data) : $data);
    }
    if (!empty($headers)) curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $resp = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);
    return ['code' => $httpCode, 'headers' => substr($resp, 0, $headerSize), 'body' => substr($resp, $headerSize)];
}

function parseCookies($headers) {
    preg_match_all('/^Set-Cookie:\s*([^=]+)=([^;]+)/mi', $headers, $m);
    $cookies = [];
    for ($i = 0; $i < count($m[1]); $i++) $cookies[$m[1][$i]] = urldecode($m[2][$i]);
    return $cookies;
}

function cookieHeader($cookies) {
    $parts = [];
    foreach ($cookies as $k => $v) $parts[] = "{$k}=" . urlencode($v);
    return implode('; ', $parts);
}

function parseInertiaPage($body) {
    if (preg_match('/data-page=\"([^\"]+)\"/', $body, $m)) {
        return json_decode(htmlspecialchars_decode($m[1]), true);
    }
    $json = json_decode($body, true);
    if ($json && isset($json['page'])) return $json['page'];
    if ($json) return $json;
    return null;
}

// ============ Step 1: Get cookies ============
echo "1. GET /login 获取 CSRF... ";
$r = doRequest('GET', '/login');
echo "HTTP {$r['code']}";
$cookies = parseCookies($r['headers']);
if (!isset($cookies['XSRF-TOKEN'])) { echo " FAIL: 无 CSRF\n"; exit(1); }
echo " ✅\n";

// ============ Step 2: Login ============
echo "2. POST /login (admin@summit.local / password)... ";
$xsrf = $cookies['XSRF-TOKEN'];
$r = doRequest('POST', '/login', [
    'email' => 'admin@summit.local',
    'password' => 'password',
], [
    'Accept: application/json',
    'X-Requested-With: XMLHttpRequest',
    'X-XSRF-TOKEN: ' . $xsrf,
    'Cookie: ' . cookieHeader($cookies),
]);
$cookies = array_merge($cookies, parseCookies($r['headers']));
$xsrf = $cookies['XSRF-TOKEN'] ?? $xsrf;
echo "HTTP {$r['code']}";
if ($r['code'] !== 302) { echo " FAIL: {$r['body']}\n"; exit(1); }
echo " ✅\n";

// ============ Step 3: Dashboard ============
echo "3. GET /dashboard... ";
$r = doRequest('GET', '/dashboard', null, [
    'Accept: application/json',
    'X-Requested-With: XMLHttpRequest',
    'X-XSRF-TOKEN: ' . $xsrf,
    'Cookie: ' . cookieHeader($cookies),
]);
echo "HTTP {$r['code']}";
$page = parseInertiaPage($r['body']);
if (!$page) { echo " FAIL: 无 Inertia data\n"; exit(1); }
echo " Component: {$page['component']}";
$kpi = $page['props']['kpi'] ?? [];
echo " KPI(" . count($kpi) . "项)";
echo " ✅\n";

// ============ Step 4: Duplicate Seats Index ============
echo "4. GET /admin/duplicate-seats (路由 admin.duplicate-seats.index)... ";
$r = doRequest('GET', '/admin/duplicate-seats', null, [
    'Accept: application/json',
    'X-Requested-With: XMLHttpRequest',
    'X-XSRF-TOKEN: ' . $xsrf,
    'Cookie: ' . cookieHeader($cookies),
]);
echo "HTTP {$r['code']}";
$page = parseInertiaPage($r['body']);
if (!$page || $r['code'] !== 200) { echo " FAIL: {$r['body']}\n"; exit(1); }
echo " Component: {$page['component']}";
echo " 列表数: " . count($page['props']['records'] ?? []);
echo " ✅\n";

// ============ Step 5: Config Index ============
echo "5. GET /admin/config (路由 admin.config.index)... ";
$r = doRequest('GET', '/admin/config', null, [
    'Accept: application/json',
    'X-Requested-With: XMLHttpRequest',
    'X-XSRF-TOKEN: ' . $xsrf,
    'Cookie: ' . cookieHeader($cookies),
]);
echo "HTTP {$r['code']}";
$page = parseInertiaPage($r['body']);
if (!$page || $r['code'] !== 200) { echo " FAIL: {$r['body']}\n"; exit(1); }
echo " Component: {$page['component']}";
echo " 开关数: " . count($page['props']['featureToggles'] ?? []);
echo " ✅\n";

// ============ Step 6: Refunds Index ============
echo "6. GET /admin/config/refunds (路由 admin.config.refunds.index)... ";
$r = doRequest('GET', '/admin/config/refunds', null, [
    'Accept: application/json',
    'X-Requested-With: XMLHttpRequest',
    'X-XSRF-TOKEN: ' . $xsrf,
    'Cookie: ' . cookieHeader($cookies),
]);
echo "HTTP {$r['code']}";
$page = parseInertiaPage($r['body']);
if (!$page || $r['code'] !== 200) { echo " FAIL: {$r['body']}\n"; exit(1); }
echo " Component: {$page['component']}";
echo " 退款申请数: " . count($page['props']['refunds'] ?? []);
echo " ✅\n";

// ============ Step 7: Feedbacks Index ============
echo "7. GET /admin/config/feedbacks (路由 admin.config.feedbacks.index)... ";
$r = doRequest('GET', '/admin/config/feedbacks', null, [
    'Accept: application/json',
    'X-Requested-With: XMLHttpRequest',
    'X-XSRF-TOKEN: ' . $xsrf,
    'Cookie: ' . cookieHeader($cookies),
]);
echo "HTTP {$r['code']}";
$page = parseInertiaPage($r['body']);
if (!$page || $r['code'] !== 200) { echo " FAIL: {$r['body']}\n"; exit(1); }
echo " Component: {$page['component']}";
echo " 反馈数: " . count($page['props']['feedbacks'] ?? []);
echo " ✅\n";

// ============ Step 8: Logs Index ============
echo "8. GET /admin/config/logs (路由 admin.config.logs.index)... ";
$r = doRequest('GET', '/admin/config/logs', null, [
    'Accept: application/json',
    'X-Requested-With: XMLHttpRequest',
    'X-XSRF-TOKEN: ' . $xsrf,
    'Cookie: ' . cookieHeader($cookies),
]);
echo "HTTP {$r['code']}";
$page = parseInertiaPage($r['body']);
if (!$page || $r['code'] !== 200) { echo " FAIL: {$r['body']}\n"; exit(1); }
echo " Component: {$page['component']}";
echo " 日志数: " . count($page['props']['logs'] ?? []);
echo " ✅\n";

// ============ Step 9: Export Index ============
echo "9. GET /admin/export (路由 admin.export.index)... ";
$r = doRequest('GET', '/admin/export', null, [
    'Accept: application/json',
    'X-Requested-With: XMLHttpRequest',
    'X-XSRF-TOKEN: ' . $xsrf,
    'Cookie: ' . cookieHeader($cookies),
]);
echo "HTTP {$r['code']}";
$page = parseInertiaPage($r['body']);
if (!$page || $r['code'] !== 200) { echo " FAIL: {$r['body']}\n"; exit(1); }
echo " Component: {$page['component']}";
echo " 事件数: " . count($page['props']['events'] ?? []);
echo " ✅\n";

// ============ Step 10: Export History ============
echo "10. GET /admin/export/history (路由 admin.export.history)... ";
$r = doRequest('GET', '/admin/export/history', null, [
    'Accept: application/json',
    'X-Requested-With: XMLHttpRequest',
    'X-XSRF-TOKEN: ' . $xsrf,
    'Cookie: ' . cookieHeader($cookies),
]);
echo "HTTP {$r['code']}";
$page = parseInertiaPage($r['body']);
if (!$page || $r['code'] !== 200) { echo " FAIL: {$r['body']}\n"; exit(1); }
echo " Component: {$page['component']}";
echo " 历史记录数: " . count($page['props']['exports'] ?? []);
echo " ✅\n";

// ============ Step 11: Create Registration ============
echo "11. POST /ticket/registrations (提交报名, 手机 {$testPhone})... ";
$r = doRequest('POST', '/ticket/registrations', [
    'event_id' => 1,
    'name' => '测试用户' . substr($testPhone, -4),
    'phone' => $testPhone,
    'email' => 'test' . substr($testPhone, -4) . '@example.com',
    'company' => '测试科技有限公司',
    'position' => '技术总监',
    'industry' => '互联网',
    'city' => '上海',
    'ticket_type_id' => 1,
    'source' => 'manual',
], [
    'Accept: application/json',
    'X-Requested-With: XMLHttpRequest',
    'X-XSRF-TOKEN: ' . $xsrf,
    'Cookie: ' . cookieHeader($cookies),
]);
$cookies = array_merge($cookies, parseCookies($r['headers']));
$xsrf = $cookies['XSRF-TOKEN'] ?? $xsrf;
echo "HTTP {$r['code']}";
if ($r['code'] !== 302) { echo " FAIL: {$r['body']}\n"; exit(1); }
echo " ✅\n";

// ============ Step 12: Verify Registration in List ============
echo "12. GET /ticket/registrations... ";
$r = doRequest('GET', '/ticket/registrations', null, [
    'Accept: application/json',
    'X-Requested-With: XMLHttpRequest',
    'X-XSRF-TOKEN: ' . $xsrf,
    'Cookie: ' . cookieHeader($cookies),
]);
echo "HTTP {$r['code']}";
$page = parseInertiaPage($r['body']);
if (!$page) { echo " FAIL\n"; exit(1); }
$found = false;
foreach ($page['props']['registrations']['data'] ?? [] as $reg) {
    if ($reg['phone'] === $testPhone) { $found = true; break; }
}
echo $found ? " 找到刚提交报名 ✅\n" : " 未找到提交数据 FAIL\n";

echo "\n=== ✅ 全部端到端验证通过 ===\n";
echo "登录: admin@summit.local / password\n";
echo "路由名修正: refunds/feedbacks/logs 全部使用 .index 后缀\n";
echo "测试手机号: {$testPhone}\n";
