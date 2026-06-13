<?php

define('LARAVEL_START', microtime(true));

if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';

$app->usePublicPath(__DIR__);

$request = Illuminate\Http\Request::capture();

$response = $app->handleRequest($request);

$response->send();

$app->terminate($request, $response);
