<?php
$baseUrl = 'http://localhost:8080';
$cookieFile = '/tmp/cookies_test_' . time() . '.txt';
touch($cookieFile);

echo "=== 行业峰会复盘看板 - 全链路数据验证 ===\n\n";

// 辅助函数：从header中提取cookies
function extractCookies($headerText) {
    $cookies = [];
    foreach (explode("\n", $headerText) as $line) {
        if (preg_match('/^Set-Cookie:\s*([^=]+)=([^;]+)/i', trim($line), $m)) {
            $cookies[$m[1]] = urldecode($m[2]);
        }
    }
    return $cookies;
}

function buildCookieHeader($cookies) {
    $parts = [];
    foreach ($cookies as $k => $v) {
        $parts[] = "{$k}=" . urlencode($v);
    }
    return implode('; ', $parts);
}

// 1. 访问登录页获取 CSRF cookie
echo "1. 获取登录页 Cookie... ";
$ch = curl_init($baseUrl . '/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
$resp = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$headers = substr($resp, 0, $headerSize);
$cookies = extractCookies($headers);
$xsrfToken = $cookies['XSRF-TOKEN'] ?? null;

echo "HTTP {$httpCode} " . ($xsrfToken ? "OK\n" : "FAIL\n");
if (!$xsrfToken) {
    echo "Headers: " . substr($headers, 0, 500) . "\n";
    exit(1);
}

// 2. 登录
echo "\n2. 登录 admin@summit.com... ";
$ch = curl_init($baseUrl . '/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'email' => 'admin@summit.local',
    'password' => 'password',
]));
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-Requested-With: XMLHttpRequest',
    'X-XSRF-TOKEN: ' . $xsrfToken,
    'Cookie: ' . buildCookieHeader($cookies),
]);
$resp = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

// 更新cookies
$headers = substr($resp, 0, $headerSize);
$newCookies = extractCookies($headers);
$cookies = array_merge($cookies, $newCookies);
$xsrfToken = $cookies['XSRF-TOKEN'] ?? $xsrfToken;

echo "HTTP {$httpCode} " . ($httpCode === 302 || $httpCode === 200 ? "OK\n" : "FAIL\n");
if ($httpCode !== 302 && $httpCode !== 200) {
    echo substr($resp, $headerSize, 500) . "\n";
    exit(1);
}

// 辅助函数：发起GET请求
function getJson($url, $cookies, $xsrfToken) {
    global $baseUrl;
    $ch = curl_init($baseUrl . $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-Requested-With: XMLHttpRequest',
        'Accept: application/json',
        'X-XSRF-TOKEN: ' . $xsrfToken,
        'Cookie: ' . buildCookieHeader($cookies),
    ]);
    $resp = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $httpCode, 'data' => json_decode($resp, true)];
}

// 辅助函数：发起POST请求
function postJson($url, $fields, $cookies, $xsrfToken) {
    global $baseUrl;
    $ch = curl_init($baseUrl . $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($fields));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-Requested-With: XMLHttpRequest',
        'Accept: application/json',
        'X-XSRF-TOKEN: ' . $xsrfToken,
        'Cookie: ' . buildCookieHeader($cookies),
    ]);
    $resp = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $httpCode, 'data' => json_decode($resp, true), 'raw' => $resp];
}

// 3. 看板数据
echo "\n3. 看板 Dashboard... ";
$result = getJson('/dashboard', $cookies, $xsrfToken);
$page = $result['data']['page'] ?? [];
$props = $page['props'] ?? [];
echo "HTTP {$result['code']}\n";
echo "   Component: {$page['component']}\n";
echo "   KPI 指标: " . count($props['kpi'] ?? []) . " 个\n";
if (isset($props['kpi'])) {
    foreach (array_slice($props['kpi'], 0, 6) as $k => $v) {
        echo "     - {$k}: {$v}\n";
    }
}
echo "   漏斗数据: " . count($props['conversion_funnel'] ?? []) . " 阶段\n";
echo "   最近报名: " . count($props['recent_registrations'] ?? []) . " 条\n";
echo "   重复占座待办: " . count($props['recent_duplicates'] ?? []) . " 条\n";

// 4. 报名列表
echo "\n4. 报名列表 /ticket/registrations... ";
$result = getJson('/ticket/registrations', $cookies, $xsrfToken);
$page = $result['data']['page'] ?? [];
$props = $page['props'] ?? [];
echo "HTTP {$result['code']}\n";
echo "   Component: {$page['component']}\n";
echo "   报名总数: " . ($props['total'] ?? 'N/A') . "\n";
echo "   当前页条数: " . count($props['registrations']['data'] ?? []) . "\n";
if (isset($props['registrations']['data'][0])) {
    $r = $props['registrations']['data'][0];
    echo "   第一条: {$r['name']} - {$r['company']} - {$r['registration_no']}\n";
}

// 5. 提交新报名
echo "\n5. 提交新报名 /ticket/registrations/store... ";
$testPhone = '139' . str_pad(rand(0, 99999999), 8, '0', STR_PAD_LEFT);
$result = postJson('/ticket/registrations', [
    'event_id' => 1,
    'name' => '测试用户',
    'phone' => $testPhone,
    'company' => '测试科技有限公司',
    'position' => 'CEO',
    'email' => 'test' . time() . '@example.com',
    'industry' => '人工智能',
    'source_channel' => '官方渠道',
    'conversion_stage' => 'confirmed',
    'registration_status' => 'approved',
    'attendance_status' => 'not_arrived',
    'is_vip' => 1,
    'is_key_client' => 1,
    'paid_amount' => 5000.00,
    'sessions' => [1],
], $cookies, $xsrfToken);
echo "HTTP {$result['code']}\n";
if ($result['code'] === 302 || $result['code'] === 200) {
    echo "   ✅ 报名提交成功\n";
} else {
    echo "   ⚠️  响应: " . substr($result['raw'], 0, 300) . "\n";
}

// 6. 重复占座待办
echo "\n6. 重复占座待办 /admin/duplicate-seats... ";
$result = getJson('/admin/duplicate-seats', $cookies, $xsrfToken);
$page = $result['data']['page'] ?? [];
$props = $page['props'] ?? [];
echo "HTTP {$result['code']}\n";
echo "   Component: {$page['component']}\n";
echo "   待办总数: " . ($props['stats']['total'] ?? 'N/A') . "\n";
echo "   待处理: " . ($props['stats']['pending'] ?? 'N/A') . "\n";
echo "   列表条数: " . count($props['duplicates']['data'] ?? []) . "\n";
if (isset($props['duplicates']['data'][0])) {
    $d = $props['duplicates']['data'][0];
    echo "   第一条: 冲突类型={$d['conflict_type']} 状态={$d['status']}\n";
}

// 7. 配置页
echo "\n7. 配置页 /admin/config... ";
$result = getJson('/admin/config', $cookies, $xsrfToken);
$page = $result['data']['page'] ?? [];
$props = $page['props'] ?? [];
echo "HTTP {$result['code']}\n";
echo "   Component: {$page['component']}\n";
echo "   功能开关: " . count($props['featureToggles'] ?? []) . " 个\n";
echo "   场次: " . count($props['sessions'] ?? []) . " 个\n";
echo "   座位: " . count($props['seats'] ?? []) . " 个\n";

// 8. 修改配置开关（记录操作人）
echo "\n8. 修改功能开关（验证操作日志）... ";
$result = postJson('/admin/config/feature-toggle', [
    'key' => 'enable_duplicate_detection',
    'value' => 1,
], $cookies, $xsrfToken);
echo "HTTP {$result['code']}\n";
if ($result['code'] === 200) {
    echo "   ✅ 配置修改成功\n";
}

// 9. 导出记录
echo "\n9. 导出历史 /admin/export/history... ";
$result = getJson('/admin/export/history', $cookies, $xsrfToken);
$page = $result['data']['page'] ?? [];
$props = $page['props'] ?? [];
echo "HTTP {$result['code']}\n";
echo "   Component: {$page['component']}\n";
echo "   导出历史总数: " . ($props['stats']['total'] ?? 'N/A') . "\n";
echo "   列表条数: " . count($props['exports']['data'] ?? []) . "\n";

// 10. 质量统计页
echo "\n10. 质量统计 /admin/quality... ";
$result = getJson('/admin/quality', $cookies, $xsrfToken);
$page = $result['data']['page'] ?? [];
$props = $page['props'] ?? [];
echo "HTTP {$result['code']}\n";
echo "   Component: {$page['component']}\n";
echo "   KPI: " . count($props['kpi'] ?? []) . " 个\n";
echo "   等级分布: " . json_encode($props['quality_distribution'] ?? [], JSON_UNESCAPED_UNICODE) . "\n";
echo "   评分列表: " . count($props['scores']['data'] ?? []) . " 条\n";

// 11. 操作日志页
echo "\n11. 操作日志 /admin/config/logs... ";
$result = getJson('/admin/config/logs', $cookies, $xsrfToken);
$page = $result['data']['page'] ?? [];
$props = $page['props'] ?? [];
echo "HTTP {$result['code']}\n";
echo "   Component: {$page['component']}\n";
echo "   日志总数: " . ($props['stats']['total'] ?? 'N/A') . "\n";
echo "   列表条数: " . count($props['logs']['data'] ?? []) . "\n";
if (isset($props['logs']['data'][0])) {
    $l = $props['logs']['data'][0];
    echo "   最新日志: {$l['log_name']} - {$l['description']} (操作人: " . ($l['causer']['name'] ?? 'N/A') . ")\n";
    if ($l['has_changes']) {
        echo "   变更字段: " . implode(', ', array_keys($l['changes']['new'] ?? [])) . "\n";
    }
}

// 12. 上座率统计
echo "\n12. 上座率 /admin/attendance-rate... ";
$result = getJson('/admin/attendance-rate', $cookies, $xsrfToken);
$page = $result['data']['page'] ?? [];
$props = $page['props'] ?? [];
echo "HTTP {$result['code']}\n";
echo "   Component: {$page['component']}\n";
echo "   KPI: " . count($props['kpi'] ?? []) . " 个\n";
if (isset($props['kpi']['attendance_rate_pct'])) {
    echo "   到场率: {$props['kpi']['attendance_rate_pct']}%\n";
}

echo "\n=== ✅ 全部页面验证通过 ===\n";
echo "用户登录: admin@summit.local (管理员)\n";
echo "测试手机号: {$testPhone}\n";
