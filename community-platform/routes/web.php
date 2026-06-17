<?php

use App\Http\Controllers\AssistanceRequestController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExceptionLogController;
use App\Http\Controllers\GridEventController;
use App\Http\Controllers\IssueController;
use App\Http\Controllers\IssueVoteController;
use App\Http\Controllers\ParticipationReportController;
use App\Http\Controllers\PublicNoticeController;
use Illuminate\Support\Facades\Route;

Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

Route::resource('grid-events', GridEventController::class);

Route::resource('issues', IssueController::class);
Route::post('issues/{issue}/vote', [IssueVoteController::class, 'store'])
    ->name('issues.vote');
Route::post('issues/{issue}/assign', [IssueController::class, 'assign'])
    ->name('issues.assign')
    ->middleware('role:admin');

Route::resource('assistance', AssistanceRequestController::class);

Route::resource('notices', PublicNoticeController::class)->only(['index', 'show']);

Route::middleware('role:admin')->group(function () {
    Route::resource('exceptions', ExceptionLogController::class)->only(['index']);
    Route::post('exceptions/{exceptionLog}/resolve', [ExceptionLogController::class, 'resolve'])
        ->name('exceptions.resolve');
    Route::post('exceptions/{exceptionLog}/retry', [ExceptionLogController::class, 'retry'])
        ->name('exceptions.retry');

    Route::get('reports', [ParticipationReportController::class, 'index'])
        ->name('reports.index');
    Route::get('reports/export', [ParticipationReportController::class, 'export'])
        ->name('reports.export');
});
