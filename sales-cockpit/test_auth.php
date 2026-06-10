<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$director = App\Models\User::where('email', 'director@example.com')->first();
Auth::login($director);

$request = Illuminate\Http\Request::create('/dashboard', 'GET');
$response = $app->handle($request);

echo "Dashboard HTTP: " . $response->getStatusCode() . "\n";
$content = $response->getContent();

$pos = strpos($content, 'type="application/json">');
if ($pos !== false) {
    $start = $pos + strlen('type="application/json">');
    $end = strpos($content, '</script>', $start);
    $json = substr($content, $start, $end - $start);
    $page = json_decode($json, true);

    echo "Component: " . $page['component'] . "\n";
    echo "Auth user: " . ($page['props']['auth']['user']['name'] ?? 'null') . "\n";
    echo "Auth roles: " . implode(', ', $page['props']['auth']['user']['roles'] ?? []) . "\n";
    echo "Auth perms count: " . count($page['props']['auth']['user']['permissions'] ?? []) . "\n";
    echo "First 5 perms: " . implode(', ', array_slice($page['props']['auth']['user']['permissions'] ?? [], 0, 5)) . "\n";
} else {
    echo "No JSON data found\n";
    echo "Content length: " . strlen($content) . "\n";
}
