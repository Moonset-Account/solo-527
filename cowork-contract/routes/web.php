<?php

use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BillController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\ContractReviewController;
use App\Http\Controllers\ContractRiskController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\RentReminderController;
use App\Http\Controllers\ReportExportController;
use Illuminate\Support\Facades\Route;

Route::get('login', [AuthController::class, 'loginForm'])->name('login');
Route::post('login', [AuthController::class, 'login']);
Route::post('logout', [AuthController::class, 'logout'])->name('logout');

Route::get('/', function () {
    return redirect()->route('contracts.index');
});

Route::middleware(['auth', 'log.ops'])->group(function () {
    Route::resource('contracts', ContractController::class);
    Route::get('contracts/{contract}/history', [ContractController::class, 'history'])->name('contracts.history');

    Route::resource('bills', BillController::class);
    Route::put('bills/{bill}/pay', [BillController::class, 'markAsPaid'])->name('bills.pay');
    Route::get('bills-overdue', [BillController::class, 'overdue'])->name('bills.overdue');

    Route::get('reviews/pending', [ContractReviewController::class, 'pending'])->name('reviews.pending');
    Route::put('reviews/{contract}', [ContractReviewController::class, 'review'])->name('reviews.review')->middleware('role:admin');

    Route::post('attachments/upload', [AttachmentController::class, 'upload'])->name('attachments.upload');
    Route::get('attachments/{attachment}/download', [AttachmentController::class, 'download'])->name('attachments.download');
    Route::delete('attachments/{attachment}', [AttachmentController::class, 'delete'])->name('attachments.delete');

    Route::get('risks', [ContractRiskController::class, 'index'])->name('risks.index');
    Route::post('risks', [ContractRiskController::class, 'store'])->name('risks.store');
    Route::put('risks/{contractRisk}/assign', [ContractRiskController::class, 'assign'])->name('risks.assign');
    Route::put('risks/{contractRisk}/close', [ContractRiskController::class, 'close'])->name('risks.close')->middleware('role:consultant');

    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::put('notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.readAll');

    Route::get('reports/export', [ReportExportController::class, 'form'])->name('reports.export');
    Route::post('reports/export', [ReportExportController::class, 'download'])->name('reports.download');
});
