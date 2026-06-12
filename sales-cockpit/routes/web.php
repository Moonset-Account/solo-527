<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('dashboard.index');
});

Route::get('/login', [App\Http\Controllers\AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [App\Http\Controllers\AuthController::class, 'login'])->name('login.post');
Route::post('/logout', [App\Http\Controllers\AuthController::class, 'logout'])->name('logout');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard.index');
    Route::post('/dashboard/data', [App\Http\Controllers\DashboardController::class, 'showData'])->name('dashboard.data');

    Route::resource('indicators', App\Http\Controllers\IndicatorController::class);
    Route::get('indicators/{indicator}/consistency', [App\Http\Controllers\ConsistencyCheckController::class, 'index'])->name('indicators.consistency');
    Route::resource('consistency-checks', App\Http\Controllers\ConsistencyCheckController::class)->only(['show']);

    Route::resource('business-orders', App\Http\Controllers\BusinessOrderController::class);
    Route::post('business-orders/{businessOrder}/handle', [App\Http\Controllers\BusinessOrderController::class, 'handle'])->name('business-orders.handle');
    Route::post('business-orders/{businessOrder}/close', [App\Http\Controllers\BusinessOrderController::class, 'close'])->name('business-orders.close');

    Route::resource('alert-rules', App\Http\Controllers\AlertRuleController::class)->except(['index', 'show', 'destroy']);
    Route::post('alert-rules/{alertRule}/deactivate', [App\Http\Controllers\AlertRuleController::class, 'deactivate'])->name('alert-rules.deactivate');
    Route::post('alert-rules/{alertRule}/activate', [App\Http\Controllers\AlertRuleController::class, 'activate'])->name('alert-rules.activate');
    Route::resource('dimensions', App\Http\Controllers\DimensionController::class)->except(['index', 'show', 'destroy']);
    Route::post('dimensions/{dimension}/deactivate', [App\Http\Controllers\DimensionController::class, 'deactivate'])->name('dimensions.deactivate');
    Route::post('dimensions/{dimension}/activate', [App\Http\Controllers\DimensionController::class, 'activate'])->name('dimensions.activate');
    Route::resource('dataset-permissions', App\Http\Controllers\DatasetPermissionController::class)->except(['index', 'show', 'destroy']);
    Route::post('dataset-permissions/{datasetPermission}/deactivate', [App\Http\Controllers\DatasetPermissionController::class, 'deactivate'])->name('dataset-permissions.deactivate');

    Route::get('review-rhythms/report', [App\Http\Controllers\ReviewRhythmController::class, 'generateReport'])->name('review-rhythms.report');
    Route::resource('review-rhythms', App\Http\Controllers\ReviewRhythmController::class)->except(['show', 'destroy']);
    Route::post('review-rhythms/{reviewRhythm}/deactivate', [App\Http\Controllers\ReviewRhythmController::class, 'deactivate'])->name('review-rhythms.deactivate');
    Route::post('review-rhythms/{reviewRhythm}/activate', [App\Http\Controllers\ReviewRhythmController::class, 'activate'])->name('review-rhythms.activate');

    Route::resource('audit-logs', App\Http\Controllers\AuditLogController::class)->only(['index']);
});

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/admin/users', function () {
        return Inertia::render('Admin/Users');
    })->name('admin.users');
});
