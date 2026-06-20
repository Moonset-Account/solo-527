<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ArtClassController;
use App\Http\Controllers\ArtworkController;
use App\Http\Controllers\StageReportController;
use App\Http\Controllers\HomeSchoolFeedbackController;
use App\Http\Controllers\TrialBookingController;
use App\Http\Controllers\TeacherHourController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\ScheduleConflictController;
use App\Http\Controllers\EnrollmentConversionController;
use App\Http\Controllers\Admin\DictionaryController;
use App\Http\Controllers\Admin\TemporaryStrategyController;
use App\Http\Controllers\SavedFilterController;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('art-classes', ArtClassController::class);
    Route::resource('artworks', ArtworkController::class)->except(['edit', 'update', 'destroy']);
    Route::post('/artworks/{artwork}/feedback', [ArtworkController::class, 'updateFeedback'])->name('artworks.feedback');

    Route::resource('stage-reports', StageReportController::class);
    Route::post('/stage-reports/{stageReport}/generate', [StageReportController::class, 'generate'])->name('stage-reports.generate');
    Route::post('/stage-reports/{stageReport}/publish', [StageReportController::class, 'publish'])->name('stage-reports.publish');
    Route::get('/stage-reports/{stageReport}/export', [StageReportController::class, 'export'])->name('stage-reports.export');

    Route::resource('home-school-feedback', HomeSchoolFeedbackController::class)->only(['index', 'store']);
    Route::post('/home-school-feedback/{homeSchoolFeedback}/remind', [HomeSchoolFeedbackController::class, 'remind'])->name('home-school-feedback.remind');
    Route::post('/home-school-feedback/{homeSchoolFeedback}/reply', [HomeSchoolFeedbackController::class, 'reply'])->name('home-school-feedback.reply');
    Route::get('/home-school-feedback/export', [HomeSchoolFeedbackController::class, 'export'])->name('home-school-feedback.export');

    Route::resource('trial-bookings', TrialBookingController::class)->only(['index', 'store']);
    Route::post('/trial-bookings/{trialBooking}/confirm', [TrialBookingController::class, 'confirm'])->name('trial-bookings.confirm');
    Route::post('/trial-bookings/{trialBooking}/complete', [TrialBookingController::class, 'complete'])->name('trial-bookings.complete');
    Route::post('/trial-bookings/{trialBooking}/cancel', [TrialBookingController::class, 'cancel'])->name('trial-bookings.cancel');
    Route::post('/trial-bookings/{trialBooking}/convert', [TrialBookingController::class, 'convert'])->name('trial-bookings.convert');

    Route::resource('teacher-hours', TeacherHourController::class)->only(['index', 'store']);
    Route::post('/teacher-hours/{teacherHour}/confirm', [TeacherHourController::class, 'confirm'])->name('teacher-hours.confirm');
    Route::post('/teacher-hours/{teacherHour}/dispute', [TeacherHourController::class, 'dispute'])->name('teacher-hours.dispute');
    Route::get('/teacher-hours/summary', [TeacherHourController::class, 'summary'])->name('teacher-hours.summary');

    Route::resource('students', StudentController::class);
    Route::resource('schedule-conflicts', ScheduleConflictController::class)->only(['index', 'store']);
    Route::post('/schedule-conflicts/{scheduleConflict}/resolve', [ScheduleConflictController::class, 'resolve'])->name('schedule-conflicts.resolve');
    Route::post('/schedule-conflicts/{scheduleConflict}/ignore', [ScheduleConflictController::class, 'ignore'])->name('schedule-conflicts.ignore');
    Route::post('/schedule-conflicts/{scheduleConflict}/notify', [ScheduleConflictController::class, 'notify'])->name('schedule-conflicts.notify');

    Route::resource('enrollment-conversions', EnrollmentConversionController::class)->only(['index']);
    Route::get('/enrollment-conversions/monthly-report', [EnrollmentConversionController::class, 'monthlyReport'])->name('enrollment-conversions.monthly-report');

    Route::middleware(['role:admin,principal'])->prefix('admin')->name('admin.')->group(function () {
        Route::resource('dictionaries', DictionaryController::class);
        Route::post('/dictionaries/{dictionary}/items', [DictionaryController::class, 'storeItem'])->name('dictionaries.items.store');
        Route::put('/dictionaries/items/{dictionaryItem}', [DictionaryController::class, 'updateItem'])->name('dictionaries.items.update');
        Route::delete('/dictionaries/items/{dictionaryItem}', [DictionaryController::class, 'destroyItem'])->name('dictionaries.items.destroy');
        Route::post('/dictionaries/items/{dictionaryItem}/toggle', [DictionaryController::class, 'toggleItem'])->name('dictionaries.items.toggle');

        Route::resource('temporary-strategies', TemporaryStrategyController::class);
        Route::post('/temporary-strategies/{temporaryStrategy}/toggle', [TemporaryStrategyController::class, 'toggle'])->name('temporary-strategies.toggle');
    });

    Route::resource('saved-filters', SavedFilterController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::post('/saved-filters/{savedFilter}/apply', [SavedFilterController::class, 'apply'])->name('saved-filters.apply');
});
