<?php

use App\Http\Controllers\ChecklistController;
use App\Http\Controllers\ChecklistRecordController;
use App\Http\Controllers\ComplianceGapController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReminderRuleController;
use App\Http\Controllers\SavedFilterController;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/dev-login/{userId?}', function ($userId = null) {
    $user = $userId ? User::find($userId) : User::first();
    if (!$user) {
        $user = User::create([
            'name' => '合规经理',
            'email' => 'compliance@example.com',
            'password' => bcrypt('password123'),
            'role' => 'compliance_manager',
            'department' => '合规部',
        ]);
        User::create([
            'name' => '项目秘书',
            'email' => 'secretary@example.com',
            'password' => bcrypt('password123'),
            'role' => 'project_secretary',
            'department' => '项目办',
        ]);
        User::create([
            'name' => '管理员',
            'email' => 'admin@example.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
            'department' => '技术部',
        ]);
    }
    Auth::login($user);
    return redirect()->route('dashboard');
})->name('dev-login');

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('dev-login');
});

Route::middleware('web')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('checklists')->name('checklists.')->group(function () {
        Route::get('/', [ChecklistController::class, 'index'])->name('index');
        Route::get('/create', [ChecklistController::class, 'create'])->name('create');
        Route::post('/', [ChecklistController::class, 'store'])->name('store');
        Route::get('/{checklist}', [ChecklistController::class, 'show'])->name('show');
        Route::get('/{checklist}/edit', [ChecklistController::class, 'edit'])->name('edit');
        Route::put('/{checklist}', [ChecklistController::class, 'update'])->name('update');
        Route::delete('/{checklist}', [ChecklistController::class, 'destroy'])->name('destroy');
        Route::post('/{checklist}/toggle', [ChecklistController::class, 'toggleActive'])->name('toggle');
    });

    Route::prefix('checklist-records')->name('checklist-records.')->group(function () {
        Route::get('/', [ChecklistRecordController::class, 'index'])->name('index');
        Route::get('/create/{checklist}', [ChecklistRecordController::class, 'create'])->name('create');
        Route::post('/{checklist}', [ChecklistRecordController::class, 'store'])->name('store');
        Route::get('/{record}', [ChecklistRecordController::class, 'show'])->name('show');
        Route::get('/{record}/edit', [ChecklistRecordController::class, 'edit'])->name('edit');
        Route::put('/{record}', [ChecklistRecordController::class, 'update'])->name('update');
        Route::post('/{record}/submit', [ChecklistRecordController::class, 'submit'])->name('submit');
        Route::post('/{record}/review', [ChecklistRecordController::class, 'review'])->name('review');
        Route::delete('/{record}', [ChecklistRecordController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('compliance-gaps')->name('compliance-gaps.')->group(function () {
        Route::get('/', [ComplianceGapController::class, 'index'])->name('index');
        Route::get('/create', [ComplianceGapController::class, 'create'])->name('create');
        Route::post('/', [ComplianceGapController::class, 'store'])->name('store');
        Route::get('/{gap}', [ComplianceGapController::class, 'show'])->name('show');
        Route::put('/{gap}', [ComplianceGapController::class, 'update'])->name('update');
        Route::delete('/{gap}', [ComplianceGapController::class, 'destroy'])->name('destroy');
        Route::post('/{gap}/status', [ComplianceGapController::class, 'updateStatus'])->name('status');
        Route::post('/{gap}/comments', [ComplianceGapController::class, 'addComment'])->name('comments.store');
        Route::post('/{gap}/evidences', [ComplianceGapController::class, 'uploadEvidence'])->name('evidences.store');
        Route::get('/evidences/{evidence}/download', [ComplianceGapController::class, 'downloadEvidence'])->name('evidences.download');
        Route::delete('/evidences/{evidence}', [ComplianceGapController::class, 'deleteEvidence'])->name('evidences.destroy');
        Route::get('/export', [ComplianceGapController::class, 'export'])->name('export');
    });

    Route::prefix('reminder-rules')->name('reminder-rules.')->group(function () {
        Route::get('/', [ReminderRuleController::class, 'index'])->name('index');
        Route::get('/create', [ReminderRuleController::class, 'create'])->name('create');
        Route::post('/', [ReminderRuleController::class, 'store'])->name('store');
        Route::get('/{reminderRule}', [ReminderRuleController::class, 'show'])->name('show');
        Route::get('/{reminderRule}/edit', [ReminderRuleController::class, 'edit'])->name('edit');
        Route::put('/{reminderRule}', [ReminderRuleController::class, 'update'])->name('update');
        Route::post('/{reminderRule}/toggle', [ReminderRuleController::class, 'toggle'])->name('toggle');
        Route::delete('/{reminderRule}', [ReminderRuleController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('saved-filters')->name('saved-filters.')->group(function () {
        Route::get('/', [SavedFilterController::class, 'index'])->name('index');
        Route::post('/', [SavedFilterController::class, 'store'])->name('store');
        Route::put('/{savedFilter}', [SavedFilterController::class, 'update'])->name('update');
        Route::put('/{savedFilter}/rename', [SavedFilterController::class, 'rename'])->name('rename');
        Route::delete('/{savedFilter}', [SavedFilterController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('reminders')->name('reminders.')->group(function () {
        Route::get('/', [DashboardController::class, 'reminders'])->name('index');
        Route::post('/{reminder}/read', [DashboardController::class, 'markReminderRead'])->name('read');
        Route::post('/mark-all-read', [DashboardController::class, 'markAllRemindersRead'])->name('mark-all-read');
    });

    Route::prefix('download-logs')->name('download-logs.')->group(function () {
        Route::get('/', [DashboardController::class, 'downloadLogs'])->name('index');
    });
});
