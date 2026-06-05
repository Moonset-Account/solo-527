<?php

use App\Http\Controllers\Api\AnnotationController;
use App\Http\Controllers\Api\ApprovalController;
use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\PaymentReminderController;
use App\Http\Controllers\Api\ProgressBoardController;
use App\Http\Controllers\Api\RecordingController;
use App\Http\Controllers\Api\SavedFilterController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('v1')->group(function () {
    Route::apiResource('assignments', AssignmentController::class);
    Route::post('assignments/{id}/publish', [AssignmentController::class, 'publish']);
    Route::post('assignments/{id}/withdraw', [AssignmentController::class, 'withdraw']);

    Route::apiResource('recordings', RecordingController::class);

    Route::apiResource('annotations', AnnotationController::class);

    Route::get('progress-board', [ProgressBoardController::class, 'index']);

    Route::apiResource('payment-reminders', PaymentReminderController::class);
    Route::post('payment-reminders/{id}/mark-paid', [PaymentReminderController::class, 'markPaid']);

    Route::apiResource('saved-filters', SavedFilterController::class);

    Route::get('approval-flows', [ApprovalController::class, 'index']);
    Route::post('approval-flows/{id}/approve', [ApprovalController::class, 'approve']);
    Route::post('approval-flows/{id}/reject', [ApprovalController::class, 'reject']);
    Route::post('approval-flows/{id}/withdraw', [ApprovalController::class, 'withdraw']);

    Route::get('exports/assignments', [ExportController::class, 'assignments']);
    Route::get('exports/recordings', [ExportController::class, 'recordings']);
    Route::get('exports/payments', [ExportController::class, 'payments']);
});
