<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('dashboard.index');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard.index');
    Route::post('/dashboard/data', [App\Http\Controllers\DashboardController::class, 'showData'])->name('dashboard.data');

    Route::resource('indicators', App\Http\Controllers\IndicatorController::class);
    Route::get('indicators/{indicator}/consistency', [App\Http\Controllers\ConsistencyCheckController::class, 'index'])->name('indicators.consistency');
    Route::resource('consistency-checks', App\Http\Controllers\ConsistencyCheckController::class)->only(['show']);

    Route::resource('business-orders', App\Http\Controllers\BusinessOrderController::class);
    Route::post('business-orders/{businessOrder}/handle', [App\Http\Controllers\BusinessOrderController::class, 'handle'])->name('business-orders.handle');
    Route::post('business-orders/{businessOrder}/close', [App\Http\Controllers\BusinessOrderController::class, 'close'])->name('business-orders.close');

    Route::resource('alert-rules', App\Http\Controllers\AlertRuleController::class)->except(['index', 'show']);
    Route::resource('dimensions', App\Http\Controllers\DimensionController::class)->except(['index', 'show']);
    Route::resource('dataset-permissions', App\Http\Controllers\DatasetPermissionController::class)->except(['index', 'show']);
    Route::post('dataset-permissions/{datasetPermission}/deactivate', [App\Http\Controllers\DatasetPermissionController::class, 'deactivate'])->name('dataset-permissions.deactivate');

    Route::resource('review-rhythms', App\Http\Controllers\ReviewRhythmController::class);
    Route::get('review-rhythms/report', [App\Http\Controllers\ReviewRhythmController::class, 'generateReport'])->name('review-rhythms.report');

    Route::resource('audit-logs', App\Http\Controllers\AuditLogController::class)->only(['index']);
});

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/admin/users', function () {
        return Inertia::render('Admin/Users');
    })->name('admin.users');
});
