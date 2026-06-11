<?php

use App\Http\Controllers\ApiFailureLogController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\CashierOrderController;
use App\Http\Controllers\ConfigAuditLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InspectionController;
use App\Http\Controllers\InspectionTemplateController;
use App\Http\Controllers\QualityReportController;
use App\Http\Controllers\ServiceItemController;
use App\Http\Controllers\TechnicianController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\WorkOrderController;
use App\Http\Controllers\WorkStationController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::prefix('booking')->name('booking.')->group(function () {
    Route::get('/create', [BookingController::class, 'create'])->name('create');
    Route::post('/', [BookingController::class, 'store'])->name('store');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('work-orders', WorkOrderController::class);
    Route::post('work-orders/{work_order}/no-show', [WorkOrderController::class, 'markNoShow'])->name('work-orders.no-show');
    Route::post('work-orders/{work_order}/status', [WorkOrderController::class, 'updateStatus'])->name('work-orders.status');

    Route::get('work-orders/{work_order}/inspection', [InspectionController::class, 'show'])->name('inspections.show');
    Route::post('work-orders/{work_order}/inspection', [InspectionController::class, 'store'])->name('inspections.store');

    Route::resource('service-items', ServiceItemController::class)->except(['show', 'edit', 'create']);
    Route::resource('inspection-templates', InspectionTemplateController::class)->except(['show', 'edit', 'create']);
    Route::resource('technicians', TechnicianController::class)->except(['show', 'edit', 'create']);
    Route::resource('work-stations', WorkStationController::class)->except(['show', 'edit', 'create']);
    Route::resource('vehicles', VehicleController::class)->except(['edit', 'create']);

    Route::resource('cashier-orders', CashierOrderController::class)->except(['show', 'edit', 'create']);

    Route::resource('config-audit-logs', ConfigAuditLogController::class)->only(['index', 'show']);

    Route::get('api-failure-logs', [ApiFailureLogController::class, 'index'])->name('api-failure-logs.index');
    Route::post('api-failure-logs/{log}/retry', [ApiFailureLogController::class, 'retry'])->name('api-failure-logs.retry');
    Route::post('api-failure-logs/{log}/resolve', [ApiFailureLogController::class, 'resolve'])->name('api-failure-logs.resolve');

    Route::resource('quality-reports', QualityReportController::class)->only(['index', 'show']);
});
