<?php

use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (\Illuminate\Http\Request $request) {
        return $request->user()->load('roles');
    });

    Route::prefix('v1')->group(function () {
        Route::apiResource('supplies', \App\Http\Controllers\Api\SupplyApiController::class);
        Route::apiResource('suppliers', \App\Http\Controllers\Api\SupplierApiController::class);
        Route::apiResource('purchase-requests', \App\Http\Controllers\Api\PurchaseRequestApiController::class);
        Route::apiResource('quotations', \App\Http\Controllers\Api\QuotationApiController::class);
    });
});
