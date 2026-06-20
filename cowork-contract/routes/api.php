<?php

use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\BillController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\ContractReviewController;
use App\Http\Controllers\ContractRiskController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\RentReminderController;
use App\Http\Controllers\ReportExportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'log.ops'])->prefix('v1')->group(function () {
    Route::apiResource('contracts', ContractController::class);
    Route::get('contracts/{contract}/history', [ContractController::class, 'history']);

    Route::apiResource('bills', BillController::class);
    Route::put('bills/{bill}/pay', [BillController::class, 'markAsPaid']);
    Route::get('bills-overdue', [BillController::class, 'overdue']);

    Route::get('reviews/pending', [ContractReviewController::class, 'pending']);
    Route::put('reviews/{contract}', [ContractReviewController::class, 'review'])->middleware('role:admin');

    Route::post('attachments/upload', [AttachmentController::class, 'upload']);
    Route::get('attachments/{attachment}/download', [AttachmentController::class, 'download']);
    Route::delete('attachments/{attachment}', [AttachmentController::class, 'delete']);

    Route::get('rent-reminders', [RentReminderController::class, 'check']);
    Route::post('rent-reminders/notify', [RentReminderController::class, 'notify']);

    Route::get('risks', [ContractRiskController::class, 'index']);
    Route::post('risks', [ContractRiskController::class, 'store']);
    Route::put('risks/{contractRisk}/assign', [ContractRiskController::class, 'assign']);
    Route::put('risks/{contractRisk}/close', [ContractRiskController::class, 'close'])->middleware('role:consultant');

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::put('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);

    Route::get('reports/export', [ReportExportController::class, 'export']);
});
