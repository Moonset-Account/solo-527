<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\IngredientController;
use App\Http\Controllers\Api\PickupSlotController;
use App\Http\Controllers\Api\ProductionController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\RefundController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ImportExportController;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::get('/product/flavors', [ProductController::class, 'flavors']);
Route::get('/product/sizes', [ProductController::class, 'sizes']);

Route::get('/pickup-slots', [PickupSlotController::class, 'index']);
Route::get('/pickup-slots/{pickupSlot}', [PickupSlotController::class, 'show']);

Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/{order}/public', [OrderController::class, 'showPublic']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);

    Route::middleware(['user_type:admin,staff'])->group(function () {
        Route::apiResource('products', ProductController::class)->except(['index', 'show']);
        Route::post('/products/{id}/restore', [ProductController::class, 'restore']);

        Route::apiResource('ingredients', IngredientController::class);
        Route::post('/ingredients/{ingredient}/add-stock', [IngredientController::class, 'addStock']);
        Route::get('/ingredients/expiring-soon/list', [IngredientController::class, 'getExpiringSoon']);
        Route::get('/ingredients/low-stock/list', [IngredientController::class, 'getLowStock']);

        Route::apiResource('pickup-slots', PickupSlotController::class)->except(['index', 'show']);
        Route::post('/pickup-slots/bulk/create', [PickupSlotController::class, 'bulkCreate']);

        Route::put('/orders/{order}', [OrderController::class, 'update']);
        Route::post('/orders/{order}/confirm', [OrderController::class, 'confirm']);
        Route::post('/orders/{order}/start-production', [OrderController::class, 'startProduction']);
        Route::post('/orders/{order}/mark-ready', [OrderController::class, 'markReady']);
        Route::post('/orders/{order}/pickup', [OrderController::class, 'pickup']);

        Route::apiResource('production', ProductionController::class);
        Route::get('/production/board/data', [ProductionController::class, 'board']);
        Route::post('/production/{productionSchedule}/status', [ProductionController::class, 'updateStatus']);
        Route::post('/production/{productionSchedule}/assign', [ProductionController::class, 'assign']);

        Route::apiResource('payments', PaymentController::class);

        Route::apiResource('refunds', RefundController::class);

        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
        Route::get('/dashboard/order-board', [DashboardController::class, 'orderBoard']);
        Route::get('/dashboard/inventory-alerts', [DashboardController::class, 'inventoryAlerts']);
        Route::get('/dashboard/production-stats', [DashboardController::class, 'productionStats']);

        Route::apiResource('import-export', ImportExportController::class);
        Route::post('/import-export/export/data', [ImportExportController::class, 'export']);
        Route::post('/import-export/import/data', [ImportExportController::class, 'import']);
        Route::get('/import-export/{importExportJob}/download', [ImportExportController::class, 'download']);
    });
});
