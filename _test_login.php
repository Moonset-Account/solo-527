<?php
$baseUrl = 'http://localhost:8080';

echo "=== 测试登录流程 ===\n\n";

// Step 1: GET login page to get cookies
echo "1. GET /login...\n";
$ch = curl_init($baseUrl . '/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
$resp = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$headers = substr($resp, 0, $headerSize);
echo "   HTTP {$httpCode}\n";

// Extract cookies from header
preg_match_all('/^Set-Cookie:\s*([^=]+)=([^;]+)/mi', $headers, $matches);
$cookies = [];
for ($i = 0; $i < count($matches[1]); $i++) {
    $cookies[$matches[1][$i]] = urldecode($matches[2][$i]);
    echo "   Cookie: {$matches[1][$i]} = " . substr(urldecode($matches[2][$i]), 0, 20) . "...\n";
}

$xsrfToken = $cookies['XSRF-TOKEN'] ?? null;
if (!$xsrfToken) {
    echo "FAIL: No XSRF token\n";
    exit(1);
}

// Build cookie header
$cookieHeader = [];
foreach ($cookies as $k => $v) {
    $cookieHeader[] = "{$k}=" . urlencode($v);
}
$cookieHeader = implode('; ', $cookieHeader);

// Step 2: POST login
echo "\n2. POST /login...\n";
$ch = curl_init($baseUrl . '/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'email' => 'admin@summit.local',
    'password' => 'password',
]));
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'X-Requested-With: XMLHttpRequest',
    'X-XSRF-TOKEN: ' . $xsrfToken,
    'Cookie: ' . $cookieHeader,
]);
$resp = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$headers = substr($resp, 0, $headerSize);
$body = substr($resp, $headerSize);
echo "   HTTP {$httpCode}\n";
echo "   Headers:\n";
foreach (explode("\n", $headers) as $line) {
    if (trim($line)) echo "     " . trim($line) . "\n";
}
echo "   Body: " . substr($body, 0, 300) . "\n";

// Extract new cookies
preg_match_all('/^Set-Cookie:\s*([^=]+)=([^;]+)/mi', $headers, $matches);
for ($i = 0; $i < count($matches[1]); $i++) {
    $cookies[$matches[1][$i]] = urldecode($matches[2][$i]);
}

$xsrfToken = $cookies['XSRF-TOKEN'] ?? $xsrfToken;
$cookieHeader = [];
foreach ($cookies as $k => $v) {
    $cookieHeader[] = "{$k}=" . urlencode($v);
}
$cookieHeader = implode('; ', $cookieHeader);

// Step 3: GET dashboard
echo "\n3. GET /dashboard...\n";
$ch = curl_init($baseUrl . '/dashboard');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'X-Requested-With: XMLHttpRequest',
    'X-XSRF-TOKEN: ' . $xsrfToken,
    'Cookie: ' . $cookieHeader,
]);
$resp = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "   HTTP {$httpCode}\n";
$data = json_decode($resp, true);
$page = $data['page'] ?? [];
$props = $page['props'] ?? [];
echo "   Component: {$page['component']}\n";
echo "   Auth user: " . ($props['auth']['user']['name'] ?? 'N/A') . "\n";
echo "   KPI count: " . count($props['kpi'] ?? []) . "\n";
