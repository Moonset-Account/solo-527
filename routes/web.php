<?php

use App\Http\Controllers\AccountApplicationController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChangeWindowController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DutyScheduleController;
use App\Http\Controllers\EscalationRuleController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OperationLogController;
use App\Http\Controllers\SavedQueryController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/login', [AuthController::class, 'authenticate'])->name('login.authenticate');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::get('/', function () {
        return redirect()->route('dashboard');
    });

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/api/realtime-stats', [DashboardController::class, 'getRealtimeStats'])->name('api.realtime-stats');

    Route::get('/profile', [AuthController::class, 'profile'])->name('profile');
    Route::put('/profile', [AuthController::class, 'updateProfile'])->name('profile.update');
    Route::put('/profile/password', [AuthController::class, 'updatePassword'])->name('profile.password.update');

    Route::get('/alerts', [AlertController::class, 'index'])->name('alerts.index');
    Route::get('/alerts/create', [AlertController::class, 'create'])->name('alerts.create');
    Route::post('/alerts', [AlertController::class, 'store'])->name('alerts.store');
    Route::get('/alerts/{alert}', [AlertController::class, 'show'])->name('alerts.show');
    Route::post('/alerts/{alert}/acknowledge', [AlertController::class, 'acknowledge'])->name('alerts.acknowledge');
    Route::post('/alerts/{alert}/process', [AlertController::class, 'startProcessing'])->name('alerts.process');
    Route::post('/alerts/{alert}/resolve', [AlertController::class, 'resolve'])->name('alerts.resolve');
    Route::post('/alerts/{alert}/close', [AlertController::class, 'close'])->name('alerts.close');
    Route::post('/alerts/{alert}/escalate', [AlertController::class, 'escalate'])->name('alerts.escalate');
    Route::post('/alerts/{alert}/inspect', [AlertController::class, 'markInspected'])->name('alerts.inspect');
    Route::post('/alerts/{alert}/comments', [AlertController::class, 'addComment'])->name('alerts.comments.store');
    Route::post('/alerts/batch-acknowledge', [AlertController::class, 'batchAcknowledge'])->name('alerts.batch-acknowledge');
    Route::post('/alerts/batch-close', [AlertController::class, 'batchClose'])->name('alerts.batch-close');
    Route::get('/alerts/export', [AlertController::class, 'export'])->name('alerts.export');

    Route::get('/duty', [DutyScheduleController::class, 'index'])->name('duty.index');
    Route::get('/duty/calendar', [DutyScheduleController::class, 'calendar'])->name('duty.calendar');
    Route::get('/duty/my', [DutyScheduleController::class, 'mySchedule'])->name('duty.my');
    Route::get('/duty/create', [DutyScheduleController::class, 'create'])->name('duty.create');
    Route::post('/duty', [DutyScheduleController::class, 'store'])->name('duty.store');
    Route::get('/duty/{schedule}/edit', [DutyScheduleController::class, 'edit'])->name('duty.edit');
    Route::put('/duty/{schedule}', [DutyScheduleController::class, 'update'])->name('duty.update');
    Route::delete('/duty/{schedule}', [DutyScheduleController::class, 'destroy'])->name('duty.destroy');
    Route::post('/duty/swap', [DutyScheduleController::class, 'swap'])->name('duty.swap');

    Route::get('/escalation', [EscalationRuleController::class, 'index'])->name('escalation.index');
    Route::get('/escalation/create', [EscalationRuleController::class, 'create'])->name('escalation.create');
    Route::post('/escalation', [EscalationRuleController::class, 'store'])->name('escalation.store');
    Route::get('/escalation/{rule}/edit', [EscalationRuleController::class, 'edit'])->name('escalation.edit');
    Route::put('/escalation/{rule}', [EscalationRuleController::class, 'update'])->name('escalation.update');
    Route::post('/escalation/{rule}/toggle', [EscalationRuleController::class, 'toggle'])->name('escalation.toggle');
    Route::delete('/escalation/{rule}', [EscalationRuleController::class, 'destroy'])->name('escalation.destroy');
    Route::post('/escalation/run-check', [EscalationRuleController::class, 'runEscalationCheck'])->name('escalation.run-check');

    Route::get('/account-applications', [AccountApplicationController::class, 'index'])->name('account-applications.index');
    Route::get('/account-applications/create', [AccountApplicationController::class, 'create'])->name('account-applications.create');
    Route::post('/account-applications', [AccountApplicationController::class, 'store'])->name('account-applications.store');
    Route::get('/account-applications/{application}', [AccountApplicationController::class, 'show'])->name('account-applications.show');
    Route::post('/account-applications/{application}/approve', [AccountApplicationController::class, 'approve'])->name('account-applications.approve');
    Route::post('/account-applications/{application}/reject', [AccountApplicationController::class, 'reject'])->name('account-applications.reject');
    Route::post('/account-applications/{application}/cancel', [AccountApplicationController::class, 'cancel'])->name('account-applications.cancel');
    Route::get('/account-applications/export', [AccountApplicationController::class, 'export'])->name('account-applications.export');

    Route::get('/change-windows', [ChangeWindowController::class, 'index'])->name('change-windows.index');
    Route::get('/change-windows/calendar', [ChangeWindowController::class, 'calendar'])->name('change-windows.calendar');
    Route::get('/change-windows/create', [ChangeWindowController::class, 'create'])->name('change-windows.create');
    Route::post('/change-windows', [ChangeWindowController::class, 'store'])->name('change-windows.store');
    Route::get('/change-windows/{window}', [ChangeWindowController::class, 'show'])->name('change-windows.show');
    Route::get('/change-windows/{window}/edit', [ChangeWindowController::class, 'edit'])->name('change-windows.edit');
    Route::put('/change-windows/{window}', [ChangeWindowController::class, 'update'])->name('change-windows.update');
    Route::post('/change-windows/{window}/approve', [ChangeWindowController::class, 'approve'])->name('change-windows.approve');
    Route::post('/change-windows/{window}/start', [ChangeWindowController::class, 'start'])->name('change-windows.start');
    Route::post('/change-windows/{window}/complete', [ChangeWindowController::class, 'complete'])->name('change-windows.complete');
    Route::post('/change-windows/{window}/cancel', [ChangeWindowController::class, 'cancel'])->name('change-windows.cancel');
    Route::delete('/change-windows/{window}', [ChangeWindowController::class, 'destroy'])->name('change-windows.destroy');
    Route::get('/change-windows/export', [ChangeWindowController::class, 'export'])->name('change-windows.export');

    Route::get('/operation-logs', [OperationLogController::class, 'index'])->name('operation-logs.index');
    Route::get('/operation-logs/{log}', [OperationLogController::class, 'show'])->name('operation-logs.show');
    Route::get('/operation-logs/export', [OperationLogController::class, 'export'])->name('operation-logs.export');

    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/{notification}', [NotificationController::class, 'show'])->name('notifications.show');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/{notification}/unread', [NotificationController::class, 'markAsUnread'])->name('notifications.unread');
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
    Route::get('/api/notifications/unread-count', [NotificationController::class, 'getUnreadCount'])->name('api.notifications.unread-count');
    Route::get('/api/notifications/latest', [NotificationController::class, 'getLatest'])->name('api.notifications.latest');

    Route::get('/api/saved-queries', [SavedQueryController::class, 'index'])->name('api.saved-queries.index');
    Route::post('/saved-queries', [SavedQueryController::class, 'store'])->name('saved-queries.store');
    Route::put('/saved-queries/{query}', [SavedQueryController::class, 'update'])->name('saved-queries.update');
    Route::delete('/saved-queries/{query}', [SavedQueryController::class, 'destroy'])->name('saved-queries.destroy');
    Route::post('/saved-queries/{query}/favorite', [SavedQueryController::class, 'toggleFavorite'])->name('saved-queries.favorite');
    Route::post('/saved-queries/reorder', [SavedQueryController::class, 'reorder'])->name('saved-queries.reorder');

    Route::middleware('role:admin,manager')->group(function () {
        Route::get('/users', [AuthController::class, 'users'])->name('users.index');
        Route::get('/users/create', [AuthController::class, 'createUser'])->name('users.create');
        Route::post('/users', [AuthController::class, 'storeUser'])->name('users.store');
        Route::get('/users/{user}/edit', [AuthController::class, 'editUser'])->name('users.edit');
        Route::put('/users/{user}', [AuthController::class, 'updateUser'])->name('users.update');
        Route::post('/users/{user}/toggle-duty', [AuthController::class, 'toggleDutyStatus'])->name('users.toggle-duty');
    });
});
