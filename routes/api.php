<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FiringCurveController;
use App\Http\Controllers\KilnBatchController;
use App\Http\Controllers\KilnController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\WorkController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware('teacher')->group(function () {
        Route::post('/kilns', [KilnController::class, 'store']);
        Route::put('/kilns/{kiln}', [KilnController::class, 'update']);
        Route::post('/kilns/{kiln}/maintenance', [KilnController::class, 'addMaintenanceDay']);
        Route::delete('/kilns/{kiln}/maintenance/{maintenanceId}', [KilnController::class, 'removeMaintenanceDay']);

        Route::post('/firing-curves', [FiringCurveController::class, 'store']);
        Route::put('/firing-curves/{template}', [FiringCurveController::class, 'update']);
        Route::delete('/firing-curves/{template}', [FiringCurveController::class, 'destroy']);

        Route::post('/clays', [MaterialController::class, 'claysStore']);
        Route::put('/clays/{clay}', [MaterialController::class, 'claysUpdate']);
        Route::post('/glazes', [MaterialController::class, 'glazesStore']);
        Route::put('/glazes/{glaze}', [MaterialController::class, 'glazesUpdate']);
        Route::post('/glaze-compatibilities', [MaterialController::class, 'setGlazeCompatibility']);

        Route::post('/kiln-batches', [KilnBatchController::class, 'store']);
        Route::put('/kiln-batches/{batch}', [KilnBatchController::class, 'update']);
        Route::post('/kiln-batches/{batch}/add-work', [KilnBatchController::class, 'addWork']);
        Route::delete('/kiln-batches/{batch}/works/{work}', [KilnBatchController::class, 'removeWork']);
        Route::post('/kiln-batches/{batch}/update-curve', [KilnBatchController::class, 'updateCurve']);
        Route::post('/kiln-batches/{batch}/unload', [KilnBatchController::class, 'unload']);
        Route::post('/kiln-batches/{batch}/cancel', [KilnBatchController::class, 'cancel']);
        Route::post('/kiln-batches/{batch}/check-conflict', [KilnBatchController::class, 'checkConflict']);
        Route::get('/kiln-batches/{batch}/recommend-zone/{work}', [KilnBatchController::class, 'recommendZone']);
    });

    Route::get('/kilns', [KilnController::class, 'index']);
    Route::get('/kilns/{kiln}', [KilnController::class, 'show']);
    Route::get('/kilns/{kiln}/available-slots', [KilnController::class, 'getAvailableSlots']);

    Route::get('/firing-curves', [FiringCurveController::class, 'index']);
    Route::get('/firing-curves/{template}', [FiringCurveController::class, 'show']);

    Route::get('/clays', [MaterialController::class, 'claysIndex']);
    Route::get('/glazes', [MaterialController::class, 'glazesIndex']);
    Route::get('/glazes/{glaze}/compatibilities', [MaterialController::class, 'getGlazeCompatibilities']);

    Route::get('/works', [WorkController::class, 'index']);
    Route::get('/works/{work}', [WorkController::class, 'show']);
    Route::post('/works', [WorkController::class, 'store']);
    Route::put('/works/{work}', [WorkController::class, 'update']);
    Route::delete('/works/{work}', [WorkController::class, 'destroy']);
    Route::post('/works/{work}/photos', [WorkController::class, 'uploadPhoto']);
    Route::delete('/works/{work}/photos/{photo}', [WorkController::class, 'deletePhoto']);

    Route::get('/kiln-batches', [KilnBatchController::class, 'index']);
    Route::get('/kiln-batches/{batch}', [KilnBatchController::class, 'show']);
});
