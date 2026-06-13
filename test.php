<?php

use Illuminate\Contracts\Console\Kernel;

require_once __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';

$app->usePublicPath(__DIR__.'/public');

$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

return $app;
