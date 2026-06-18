<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('guest')->group(function () {
    Route::get('/login', [\App\Http\Controllers\AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [\App\Http\Controllers\AuthController::class, 'login']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [\App\Http\Controllers\AuthController::class, 'logout'])->name('logout');

    Route::get('/', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('supplies')->name('supplies.')->group(function () {
        Route::get('/', [\App\Http\Controllers\SupplyController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\SupplyController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\SupplyController::class, 'store'])->name('store');
        Route::get('/{supply}', [\App\Http\Controllers\SupplyController::class, 'show'])->name('show');
        Route::get('/{supply}/edit', [\App\Http\Controllers\SupplyController::class, 'edit'])->name('edit');
        Route::put('/{supply}', [\App\Http\Controllers\SupplyController::class, 'update'])->name('update');
        Route::delete('/{supply}', [\App\Http\Controllers\SupplyController::class, 'destroy'])->name('destroy');

        Route::post('/{supply}/monthly-usage', [\App\Http\Controllers\SupplyController::class, 'storeMonthlyUsage'])->name('monthly-usage.store');
        Route::post('/{supply}/spec-attachments', [\App\Http\Controllers\SupplyController::class, 'storeSpecAttachment'])->name('spec-attachments.store');
        Route::post('/{supply}/attachments', [\App\Http\Controllers\SupplyController::class, 'storeSpecAttachment'])->name('attachments.store');
        Route::delete('/spec-attachments/{attachment}', [\App\Http\Controllers\SupplyController::class, 'destroySpecAttachment'])->name('spec-attachments.destroy');
        Route::delete('/{supply}/attachments/{attachment}', [\App\Http\Controllers\SupplyController::class, 'destroySpecAttachment'])->name('attachments.destroy');
        Route::get('/{supply}/price-history', [\App\Http\Controllers\SupplyController::class, 'priceHistory'])->name('price-history');
    });

    Route::prefix('suppliers')->name('suppliers.')->group(function () {
        Route::get('/', [\App\Http\Controllers\SupplierController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\SupplierController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\SupplierController::class, 'store'])->name('store');
        Route::get('/{supplier}', [\App\Http\Controllers\SupplierController::class, 'show'])->name('show');
        Route::get('/{supplier}/edit', [\App\Http\Controllers\SupplierController::class, 'edit'])->name('edit');
        Route::put('/{supplier}', [\App\Http\Controllers\SupplierController::class, 'update'])->name('update');
        Route::delete('/{supplier}', [\App\Http\Controllers\SupplierController::class, 'destroy'])->name('destroy');
        Route::get('/{supplier}/risk-analysis', [\App\Http\Controllers\SupplierController::class, 'riskAnalysis'])->name('risk-analysis');
    });

    Route::prefix('approval-flows')->name('approval-flows.')->middleware('permission:manage_approval_flows')->group(function () {
        Route::get('/', [\App\Http\Controllers\ApprovalFlowController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\ApprovalFlowController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\ApprovalFlowController::class, 'store'])->name('store');
        Route::get('/{approvalFlow}', [\App\Http\Controllers\ApprovalFlowController::class, 'show'])->name('show');
        Route::get('/{approvalFlow}/edit', [\App\Http\Controllers\ApprovalFlowController::class, 'edit'])->name('edit');
        Route::put('/{approvalFlow}', [\App\Http\Controllers\ApprovalFlowController::class, 'update'])->name('update');
        Route::delete('/{approvalFlow}', [\App\Http\Controllers\ApprovalFlowController::class, 'destroy'])->name('destroy');
        Route::put('/{approvalFlow}/toggle', [\App\Http\Controllers\ApprovalFlowController::class, 'toggle'])->name('toggle');
        Route::delete('/{approvalFlow}/steps/{step}', [\App\Http\Controllers\ApprovalFlowController::class, 'destroyStep'])->name('steps.destroy');
    });

    Route::prefix('purchase-requests')->name('purchase-requests.')->group(function () {
        Route::get('/', [\App\Http\Controllers\PurchaseRequestController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\PurchaseRequestController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\PurchaseRequestController::class, 'store'])->name('store');
        Route::get('/{purchaseRequest}', [\App\Http\Controllers\PurchaseRequestController::class, 'show'])->name('show');
        Route::post('/{purchaseRequest}/submit', [\App\Http\Controllers\PurchaseRequestController::class, 'submit'])->name('submit');
        Route::post('/{purchaseRequest}/approve', [\App\Http\Controllers\PurchaseRequestController::class, 'approve'])->name('approve');
        Route::post('/{purchaseRequest}/reject', [\App\Http\Controllers\PurchaseRequestController::class, 'reject'])->name('reject');
    });

    Route::prefix('quotations')->name('quotations.')->group(function () {
        Route::get('/', [\App\Http\Controllers\QuotationController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\QuotationController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\QuotationController::class, 'store'])->name('store');
        Route::get('/{quotation}', [\App\Http\Controllers\QuotationController::class, 'show'])->name('show');
        Route::get('/{quotation}/edit', [\App\Http\Controllers\QuotationController::class, 'edit'])->name('edit');
        Route::put('/{quotation}', [\App\Http\Controllers\QuotationController::class, 'update'])->name('update');
        Route::post('/{quotation}/approve', [\App\Http\Controllers\QuotationController::class, 'approve'])->name('approve');
        Route::post('/{quotation}/reject', [\App\Http\Controllers\QuotationController::class, 'reject'])->name('reject');
        Route::post('/{quotation}/disable', [\App\Http\Controllers\QuotationController::class, 'disable'])->name('disable');
        Route::get('/expiring', [\App\Http\Controllers\QuotationController::class, 'expiring'])->name('expiring');
    });

    Route::prefix('financial-reviews')->name('financial-reviews.')->middleware('role:financial_manager|financial_staff')->group(function () {
        Route::get('/', [\App\Http\Controllers\FinancialReviewController::class, 'index'])->name('index');
        Route::post('/{quotation}/review', [\App\Http\Controllers\FinancialReviewController::class, 'review'])->name('review');
        Route::post('/{quotation}/approve', [\App\Http\Controllers\FinancialReviewController::class, 'approve'])->name('approve');
        Route::post('/{quotation}/reject', [\App\Http\Controllers\FinancialReviewController::class, 'reject'])->name('reject');
        Route::get('/delivery-discrepancies', [\App\Http\Controllers\FinancialReviewController::class, 'deliveryDiscrepancies'])->name('delivery-discrepancies');
        Route::post('/delivery-discrepancies/{discrepancy}/waive', [\App\Http\Controllers\FinancialReviewController::class, 'waiveDiscrepancy'])->name('delivery-discrepancies.waive');
    });

    Route::prefix('config')->name('config.')->middleware('role:admin|super_admin')->group(function () {
        Route::get('/', [\App\Http\Controllers\SystemConfigController::class, 'index'])->name('index');
        Route::put('/', [\App\Http\Controllers\SystemConfigController::class, 'update'])->name('update');
        Route::post('/', [\App\Http\Controllers\SystemConfigController::class, 'update'])->name('update.post');
        Route::get('/activity-log', [\App\Http\Controllers\SystemConfigController::class, 'activityLog'])->name('activity-log');
    });

    Route::prefix('deliveries')->name('deliveries.')->group(function () {
        Route::get('/', [\App\Http\Controllers\DeliveryController::class, 'index'])->name('index');
        Route::get('/create/{purchaseRequest}', [\App\Http\Controllers\DeliveryController::class, 'create'])->name('create');
        Route::get('/{deliveryConfirmation}', [\App\Http\Controllers\DeliveryController::class, 'show'])->name('show');
        Route::post('/{purchaseRequest}/confirm', [\App\Http\Controllers\DeliveryController::class, 'confirm'])->name('confirm');
    });

    Route::prefix('delivery')->name('delivery.')->group(function () {
        Route::get('/', [\App\Http\Controllers\DeliveryController::class, 'index'])->name('index');
        Route::get('/create/{purchaseRequest}', [\App\Http\Controllers\DeliveryController::class, 'create'])->name('create');
        Route::get('/{deliveryConfirmation}', [\App\Http\Controllers\DeliveryController::class, 'show'])->name('show');
        Route::post('/{purchaseRequest}/confirm', [\App\Http\Controllers\DeliveryController::class, 'confirm'])->name('confirm');
    });

    Route::prefix('batches')->name('batches.')->middleware('role:admin|super_admin')->group(function () {
        Route::get('/', [\App\Http\Controllers\BatchLogController::class, 'index'])->name('index');
        Route::get('/failed', [\App\Http\Controllers\BatchLogController::class, 'failed'])->name('failed');
        Route::post('/{failedBatch}/retry', [\App\Http\Controllers\BatchLogController::class, 'retry'])->name('retry');
        Route::post('/logs/{log}/retry', [\App\Http\Controllers\BatchLogController::class, 'retrySingle'])->name('retry-single');
        Route::get('/{failedBatch}/logs', [\App\Http\Controllers\BatchLogController::class, 'logs'])->name('logs');
    });
});
