<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Ticket\RegistrationController;
use App\Http\Controllers\Admin\SummaryController;
use App\Http\Controllers\Admin\QualityController;
use App\Http\Controllers\Admin\ConfigController;
use App\Http\Controllers\Admin\DuplicateSeatController;
use App\Http\Controllers\Admin\ExportController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('ticket')->name('ticket.')->group(function () {
        Route::get('/registrations', [RegistrationController::class, 'index'])->name('registrations.index');
        Route::get('/registrations/create', [RegistrationController::class, 'create'])->name('registrations.create');
        Route::post('/registrations', [RegistrationController::class, 'store'])->name('registrations.store');
        Route::get('/registrations/{registration}', [RegistrationController::class, 'show'])->name('registrations.show');
        Route::get('/registrations/{registration}/edit', [RegistrationController::class, 'edit'])->name('registrations.edit');
        Route::put('/registrations/{registration}', [RegistrationController::class, 'update'])->name('registrations.update');
    });

    Route::prefix('admin')->name('admin.')->middleware(['role:admin|manager'])->group(function () {
        Route::get('/summary', [SummaryController::class, 'index'])->name('summary.index');
        Route::post('/summary/conversion', [SummaryController::class, 'updateConversion'])->name('summary.conversion.update');
        Route::post('/summary/attendance', [SummaryController::class, 'updateAttendance'])->name('summary.attendance.update');
        Route::post('/summary/batch-attendance', [SummaryController::class, 'batchUpdateAttendance'])->name('summary.attendance.batch');

        Route::get('/quality', [QualityController::class, 'index'])->name('quality.index');

        Route::get('/config', [ConfigController::class, 'index'])->name('config.index');
        Route::post('/config/feature-toggle', [ConfigController::class, 'updateFeatureToggle'])->name('config.feature-toggle');
        Route::post('/config/sessions', [ConfigController::class, 'storeSession'])->name('config.sessions.store');
        Route::put('/config/sessions/{session}', [ConfigController::class, 'updateSession'])->name('config.sessions.update');
        Route::delete('/config/sessions/{session}', [ConfigController::class, 'destroySession'])->name('config.sessions.destroy');
        Route::post('/config/seats', [ConfigController::class, 'storeSeat'])->name('config.seats.store');
        Route::put('/config/seats/{seat}', [ConfigController::class, 'updateSeat'])->name('config.seats.update');
        Route::delete('/config/seats/{seat}', [ConfigController::class, 'destroySeat'])->name('config.seats.destroy');
        Route::get('/config/refunds', [ConfigController::class, 'refunds'])->name('config.refunds.index');
        Route::post('/config/refunds/{refund}/process', [ConfigController::class, 'processRefund'])->name('config.refunds.process');
        Route::get('/config/feedbacks', [ConfigController::class, 'feedbacks'])->name('config.feedbacks.index');
        Route::get('/config/logs', [ConfigController::class, 'logs'])->name('config.logs.index');

        Route::get('/duplicate-seats', [DuplicateSeatController::class, 'index'])->name('duplicate-seats.index');
        Route::post('/duplicate-seats/{duplicate}/resolve', [DuplicateSeatController::class, 'resolve'])->name('duplicate-seats.resolve');
        Route::get('/attendance-rate', [DuplicateSeatController::class, 'attendanceRate'])->name('attendance-rate.index');

        Route::get('/export', [ExportController::class, 'index'])->name('export.index');
        Route::post('/export/registrations', [ExportController::class, 'exportRegistrations'])->name('export.registrations');
        Route::post('/export/summary', [ExportController::class, 'exportSummary'])->name('export.summary');
        Route::post('/export/attendance', [ExportController::class, 'exportAttendance'])->name('export.attendance');
        Route::get('/export/history', [ExportController::class, 'history'])->name('export.history');
        Route::get('/export/{export}/download', [ExportController::class, 'download'])->name('export.download');
    });
});
