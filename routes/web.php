<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => '欢迎使用会员健身私教排课平台 API',
        'version' => '1.0.0',
    ]);
});
