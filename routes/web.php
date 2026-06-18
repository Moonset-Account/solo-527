<?php

use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EnvironmentAlertController;
use App\Http\Controllers\EnvironmentDataController;
use App\Http\Controllers\GreenhouseController;
use App\Http\Controllers\MachineryAppointmentController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SavedFilterController;
use App\Http\Controllers\ShipmentController;
use App\Http\Controllers\SortingDiscrepancyController;
use App\Http\Controllers\SortingTaskController;
use App\Http\Controllers\SubsidyVoucherController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('dashboard.index');
});

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard.index');

    Route::resource('greenhouses', GreenhouseController::class);

    Route::prefix('environment-data')->name('environment-data.')->group(function () {
        Route::get('/', [EnvironmentDataController::class, 'index'])->name('index');
        Route::get('/dashboard', [EnvironmentDataController::class, 'dashboard'])->name('dashboard');
        Route::get('/alerts', [EnvironmentDataController::class, 'alerts'])->name('alerts');
        Route::get('/export', [EnvironmentDataController::class, 'export'])->name('export');
        Route::get('/{environmentData}', [EnvironmentDataController::class, 'show'])->name('show');
    });

    Route::prefix('environment-alerts')->name('environment-alerts.')->group(function () {
        Route::get('/', [EnvironmentAlertController::class, 'index'])->name('index');
        Route::get('/{environmentAlert}', [EnvironmentAlertController::class, 'show'])->name('show');
        Route::post('/{environmentAlert}/acknowledge', [EnvironmentAlertController::class, 'acknowledge'])->name('acknowledge');
        Route::post('/{environmentAlert}/resolve', [EnvironmentAlertController::class, 'resolve'])->name('resolve');
    });

    Route::resource('orders', OrderController::class);

    Route::prefix('sorting-tasks')->name('sorting-tasks.')->group(function () {
        Route::get('/', [SortingTaskController::class, 'index'])->name('index');
        Route::get('/create', [SortingTaskController::class, 'create'])->name('create');
        Route::post('/', [SortingTaskController::class, 'store'])->name('store');
        Route::get('/{sortingTask}', [SortingTaskController::class, 'show'])->name('show');
        Route::put('/{sortingTask}', [SortingTaskController::class, 'update'])->name('update');
        Route::post('/{sortingTask}/start', [SortingTaskController::class, 'start'])->name('start');
        Route::post('/{sortingTask}/complete', [SortingTaskController::class, 'complete'])->name('complete');
    });

    Route::prefix('sorting-discrepancies')->name('sorting-discrepancies.')->group(function () {
        Route::get('/', [SortingDiscrepancyController::class, 'index'])->name('index');
        Route::post('/', [SortingDiscrepancyController::class, 'store'])->name('store');
        Route::get('/{sortingDiscrepancy}', [SortingDiscrepancyController::class, 'show'])->name('show');
        Route::put('/{sortingDiscrepancy}', [SortingDiscrepancyController::class, 'update'])->name('update');
        Route::post('/{sortingDiscrepancy}/handle', [SortingDiscrepancyController::class, 'handle'])->name('handle');
    });

    Route::prefix('comments')->name('comments.')->group(function () {
        Route::post('/{commentableType}/{commentableId}', [CommentController::class, 'store'])->name('store');
        Route::delete('/{comment}', [CommentController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('attachments')->name('attachments.')->group(function () {
        Route::post('/{attachableType}/{attachableId}', [AttachmentController::class, 'store'])->name('store');
        Route::delete('/{attachment}', [AttachmentController::class, 'destroy'])->name('destroy');
        Route::get('/{attachment}/download', [AttachmentController::class, 'download'])->name('download');
    });

    Route::prefix('shipments')->name('shipments.')->group(function () {
        Route::get('/', [ShipmentController::class, 'index'])->name('index');
        Route::get('/create', [ShipmentController::class, 'create'])->name('create');
        Route::post('/', [ShipmentController::class, 'store'])->name('store');
        Route::get('/{shipment}', [ShipmentController::class, 'show'])->name('show');
        Route::get('/{shipment}/edit', [ShipmentController::class, 'edit'])->name('edit');
        Route::put('/{shipment}', [ShipmentController::class, 'update'])->name('update');
        Route::get('/{shipment}/track', [ShipmentController::class, 'track'])->name('track');
    });

    Route::prefix('subsidy-vouchers')->name('subsidy-vouchers.')->group(function () {
        Route::get('/', [SubsidyVoucherController::class, 'index'])->name('index');
        Route::get('/create', [SubsidyVoucherController::class, 'create'])->name('create');
        Route::post('/', [SubsidyVoucherController::class, 'store'])->name('store');
        Route::get('/{subsidyVoucher}', [SubsidyVoucherController::class, 'show'])->name('show');
        Route::get('/{subsidyVoucher}/edit', [SubsidyVoucherController::class, 'edit'])->name('edit');
        Route::put('/{subsidyVoucher}', [SubsidyVoucherController::class, 'update'])->name('update');
        Route::post('/{subsidyVoucher}/approve', [SubsidyVoucherController::class, 'approve'])->name('approve');
        Route::post('/{subsidyVoucher}/reject', [SubsidyVoucherController::class, 'reject'])->name('reject');
        Route::post('/{subsidyVoucher}/pay', [SubsidyVoucherController::class, 'pay'])->name('pay');
    });

    Route::prefix('machinery-appointments')->name('machinery-appointments.')->group(function () {
        Route::get('/', [MachineryAppointmentController::class, 'index'])->name('index');
        Route::get('/create', [MachineryAppointmentController::class, 'create'])->name('create');
        Route::post('/', [MachineryAppointmentController::class, 'store'])->name('store');
        Route::get('/{machineryAppointment}', [MachineryAppointmentController::class, 'show'])->name('show');
        Route::get('/{machineryAppointment}/edit', [MachineryAppointmentController::class, 'edit'])->name('edit');
        Route::put('/{machineryAppointment}', [MachineryAppointmentController::class, 'update'])->name('update');
        Route::post('/{machineryAppointment}/approve', [MachineryAppointmentController::class, 'approve'])->name('approve');
        Route::post('/{machineryAppointment}/reject', [MachineryAppointmentController::class, 'reject'])->name('reject');
        Route::post('/{machineryAppointment}/complete', [MachineryAppointmentController::class, 'complete'])->name('complete');
    });

    Route::prefix('saved-filters')->name('saved-filters.')->group(function () {
        Route::get('/', [SavedFilterController::class, 'index'])->name('index');
        Route::post('/', [SavedFilterController::class, 'store'])->name('store');
        Route::put('/{savedFilter}', [SavedFilterController::class, 'update'])->name('update');
        Route::delete('/{savedFilter}', [SavedFilterController::class, 'destroy'])->name('destroy');
        Route::get('/{savedFilter}/apply', [SavedFilterController::class, 'apply'])->name('apply');
    });

    Route::resource('users', UserController::class);

    Route::resource('roles', RoleController::class);
});
