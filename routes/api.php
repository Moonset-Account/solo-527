<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\OrderController;
use App\Http\Controllers\API\PickingController;
use App\Http\Controllers\API\ReturnController;
use App\Http\Controllers\API\DashboardController;
use App\Http\Controllers\API\CustomerController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\LocationController;
use App\Http\Controllers\API\DebtController;
use App\Http\Controllers\API\StatementController;
use App\Http\Controllers\API\AuditController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ImportExportController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/user', [AuthController::class, 'user'])->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('dashboard')->group(function () {
        Route::get('/overview', [DashboardController::class, 'overview']);
        Route::get('/timeout-alerts', [DashboardController::class, 'timeoutAlerts']);
        Route::get('/resource-utilization', [DashboardController::class, 'resourceUtilization']);
        Route::get('/workflow-stats', [DashboardController::class, 'workflowStats']);
    });

    Route::apiResource('customers', CustomerController::class);
    Route::get('/customers/{customer}/price-list', [CustomerController::class, 'getPriceList']);
    Route::post('/customers/{customer}/price-list', [CustomerController::class, 'addPriceList']);

    Route::apiResource('products', ProductController::class);

    Route::apiResource('locations', LocationController::class);

    Route::apiResource('orders', OrderController::class);
    Route::post('/orders/{order}/confirm', [OrderController::class, 'confirm']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);
    Route::post('/orders/{order}/split', [OrderController::class, 'split']);

    Route::apiResource('picking-lists', PickingController::class);
    Route::post('/picking-lists/{pickingList}/start', [PickingController::class, 'start']);
    Route::post('/picking-items/{pickingItem}/scan', [PickingController::class, 'scan']);
    Route::post('/picking-items/{pickingItem}/skip', [PickingController::class, 'skip']);

    Route::apiResource('returns', ReturnController::class);
    Route::post('/returns/{returnRequest}/approve', [ReturnController::class, 'approve']);
    Route::post('/returns/{returnRequest}/reject', [ReturnController::class, 'reject']);
    Route::post('/return-items/{returnItem}/receive', [ReturnController::class, 'receiveItem']);
    Route::post('/return-items/{returnItem}/restock', [ReturnController::class, 'restockItem']);

    Route::apiResource('debts', DebtController::class);
    Route::post('/debts/{debt}/payment', [DebtController::class, 'addPayment']);

    Route::apiResource('statements', StatementController::class);
    Route::post('/statements/{statement}/confirm', [StatementController::class, 'confirm']);
    Route::post('/statements/{statement}/send', [StatementController::class, 'send']);

    Route::get('/audit-trails', [AuditController::class, 'index']);
    Route::get('/audit-trails/{tableName}/{recordId}', [AuditController::class, 'showByRecord']);

    Route::prefix('import-export')->group(function () {
        Route::get('/tasks', [ImportExportController::class, 'index']);
        Route::post('/import/{module}', [ImportExportController::class, 'import']);
        Route::post('/export/{module}', [ImportExportController::class, 'export']);
        Route::get('/download/{task}', [ImportExportController::class, 'download']);
    });
});
