<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\PropertyController;

Route::get('/', function () {
    return redirect('/admin/property/dashboard');
});

Route::prefix('admin/property')->name('admin.property.')->group(function () {
    Route::get('/dashboard', [PropertyController::class, 'dashboard'])->name('dashboard');
    Route::get('/bookings', [PropertyController::class, 'bookings'])->name('bookings');
    Route::get('/payments', [PropertyController::class, 'payments'])->name('payments');
    Route::get('/entry-records', [PropertyController::class, 'entryRecords'])->name('entry-records');
    Route::get('/violations', [PropertyController::class, 'violations'])->name('violations');
    Route::post('/violations/{id}/confirm', [PropertyController::class, 'confirmViolation'])->name('violations.confirm');
    Route::get('/appeals', [PropertyController::class, 'appeals'])->name('appeals');
    Route::get('/spot-revenue', [PropertyController::class, 'spotRevenue'])->name('spot-revenue');
    Route::get('/settlements', [PropertyController::class, 'settlements'])->name('settlements');
    Route::get('/settlements/{id}', [PropertyController::class, 'settlementDetail'])->name('settlement-detail');
    Route::post('/settlements/{id}/complete', [PropertyController::class, 'completeSettlement'])->name('settlements.complete');
});
