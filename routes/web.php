<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\QuoteVersionController;
use App\Http\Controllers\OceanRuleController;
use App\Http\Controllers\ChurnReasonController;
use App\Http\Controllers\BatchController;
use App\Http\Controllers\ExportController;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('leads')->name('leads.')->group(function () {
        Route::get('/', [LeadController::class, 'index'])->name('index');
        Route::get('/create', [LeadController::class, 'create'])->name('create');
        Route::post('/', [LeadController::class, 'store'])->name('store');
        Route::get('/{lead}', [LeadController::class, 'show'])->name('show');
        Route::get('/{lead}/edit', [LeadController::class, 'edit'])->name('edit');
        Route::put('/{lead}', [LeadController::class, 'update'])->name('update');
        Route::post('/{lead}/consultations', [LeadController::class, 'storeConsultation'])->name('consultations.store');
        Route::post('/{lead}/response-nodes', [LeadController::class, 'storeResponseNode'])->name('response-nodes.store');
    });

    Route::get('/quote-versions', [QuoteVersionController::class, 'index'])->name('quote-versions.index');
    Route::get('/ocean-rules', [OceanRuleController::class, 'index'])->name('ocean-rules.index');
    Route::get('/churn-reasons', [ChurnReasonController::class, 'index'])->name('churn-reasons.index');

    Route::prefix('batch')->name('batch.')->group(function () {
        Route::post('/validate', [BatchController::class, 'validateBatch'])->name('validate');
        Route::post('/process', [BatchController::class, 'process'])->name('process');
    });

    Route::prefix('exports')->name('exports.')->group(function () {
        Route::get('/leads', [ExportController::class, 'leads'])->name('leads');
        Route::get('/lead-quality', [ExportController::class, 'leadQuality'])->name('lead-quality');
    });
});

require __DIR__.'/auth.php';
