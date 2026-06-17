<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard/Index', [
            'stats' => [
                'total_receivable' => 12580000,
                'total_received' => 8620000,
                'pending_amount' => 3960000,
                'overdue_amount' => 1280000,
                'total_projects' => 28,
                'active_projects' => 15,
                'pending_differences' => 23,
                'pending_writeoffs' => 8,
            ],
        ]);
    })->name('dashboard');

    Route::prefix('operate')->name('operate.')->group(function () {
        Route::get('/statement/upload', function () {
            return Inertia::render('Operate/UploadStatement', [
                'projects' => [
                    ['id' => 1, 'name' => '智慧城市一期项目'],
                    ['id' => 2, 'name' => '数据分析平台'],
                    ['id' => 3, 'name' => 'ERP系统升级'],
                    ['id' => 4, 'name' => '移动端应用开发'],
                ],
            ]);
        })->name('statement.upload');

        Route::get('/difference/confirm', function () {
            return Inertia::render('Operate/ConfirmDifference', [
                'differences' => [
                    'data' => [
                        ['id' => 1, 'project_name' => '智慧城市一期', 'difference_type' => 'amount_mismatch', 'amount' => 20000, 'status' => 'pending', 'created_at' => '2026-06-17'],
                        ['id' => 2, 'project_name' => 'ERP系统升级', 'difference_type' => 'date_mismatch', 'amount' => 800000, 'status' => 'processing', 'created_at' => '2026-06-16'],
                        ['id' => 3, 'project_name' => '移动端应用开发', 'difference_type' => 'missing_record', 'amount' => 250000, 'status' => 'pending', 'created_at' => '2026-06-15'],
                    ],
                    'current_page' => 1,
                    'per_page' => 10,
                    'total' => 3,
                    'last_page' => 1,
                ],
            ]);
        })->name('difference.confirm');
    });

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/difference', function () {
            return Inertia::render('Admin/DifferenceAssignment', [
                'differences' => [
                    'data' => [
                        ['id' => 1, 'project_name' => '智慧城市一期', 'difference_type' => 'amount_mismatch', 'amount' => 20000, 'assigned_to' => null, 'status' => 'pending', 'created_at' => '2026-06-17'],
                        ['id' => 2, 'project_name' => 'ERP系统升级', 'difference_type' => 'date_mismatch', 'amount' => 800000, 'assigned_to' => '李四', 'status' => 'processing', 'created_at' => '2026-06-16'],
                    ],
                    'current_page' => 1,
                    'per_page' => 10,
                    'total' => 2,
                    'last_page' => 1,
                ],
                'users' => [
                    ['id' => 1, 'name' => '张三'],
                    ['id' => 2, 'name' => '李四'],
                    ['id' => 3, 'name' => '王五'],
                ],
            ]);
        })->name('difference.index');

        Route::get('/writeoff', function () {
            return Inertia::render('Admin/WriteOffManagement', [
                'writeoffs' => [
                    'data' => [
                        ['id' => 1, 'project_name' => '移动端应用开发', 'amount' => 50000, 'reason' => '客户破产，无法收回', 'applicant' => '王五', 'status' => 'waiting_approval', 'created_at' => '2026-06-15'],
                        ['id' => 2, 'project_name' => '旧系统维护', 'amount' => 15000, 'reason' => '历史遗留坏账', 'applicant' => '张三', 'status' => 'approved', 'created_at' => '2026-06-10'],
                    ],
                    'current_page' => 1,
                    'per_page' => 10,
                    'total' => 2,
                    'last_page' => 1,
                ],
            ]);
        })->name('writeoff.index');
    });

    Route::prefix('report')->name('report.')->group(function () {
        Route::get('/difference', function () {
            return Inertia::render('Report/DifferenceReport', [
                'filters' => [],
                'summary' => [
                    'total_differences' => 23,
                    'total_amount' => 1280000,
                    'pending_count' => 8,
                    'processing_count' => 10,
                    'resolved_count' => 5,
                ],
                'differences' => [
                    'data' => [
                        ['id' => 1, 'project_name' => '智慧城市一期', 'difference_type' => 'amount_mismatch', 'amount' => 20000, 'status' => 'pending', 'created_at' => '2026-06-17'],
                        ['id' => 2, 'project_name' => 'ERP系统升级', 'difference_type' => 'date_mismatch', 'amount' => 800000, 'status' => 'processing', 'created_at' => '2026-06-16'],
                        ['id' => 3, 'project_name' => '移动端应用开发', 'difference_type' => 'missing_record', 'amount' => 250000, 'status' => 'pending', 'created_at' => '2026-06-15'],
                        ['id' => 4, 'project_name' => '数据分析平台', 'difference_type' => 'amount_mismatch', 'amount' => 50000, 'status' => 'resolved', 'created_at' => '2026-06-14'],
                        ['id' => 5, 'project_name' => '旧系统维护', 'difference_type' => 'missing_record', 'amount' => 160000, 'status' => 'resolved', 'created_at' => '2026-06-13'],
                    ],
                    'current_page' => 1,
                    'per_page' => 10,
                    'total' => 5,
                    'last_page' => 1,
                ],
                'projects' => [
                    ['id' => 1, 'name' => '智慧城市一期项目'],
                    ['id' => 2, 'name' => '数据分析平台'],
                    ['id' => 3, 'name' => 'ERP系统升级'],
                    ['id' => 4, 'name' => '移动端应用开发'],
                ],
                'users' => [
                    ['id' => 1, 'name' => '张三'],
                    ['id' => 2, 'name' => '李四'],
                    ['id' => 3, 'name' => '王五'],
                ],
            ]);
        })->name('difference');
    });

    Route::prefix('dashboard')->name('dashboard.')->group(function () {
        Route::get('/business-overview', function () {
            return Inertia::render('Dashboard/BusinessOverview', [
                'stats' => [
                    'total_receivable' => 12580000,
                    'total_received' => 8620000,
                    'pending_amount' => 3960000,
                    'overdue_amount' => 1280000,
                    'total_projects' => 28,
                    'active_projects' => 15,
                ],
                'paymentRecords' => [
                    'data' => [
                        ['id' => 'PAY001', 'project_name' => '智慧城市一期', 'payer_name' => 'ABC科技', 'amount' => 500000, 'payment_method' => '银行转账', 'transaction_date' => '2026-06-15', 'status' => 'confirmed'],
                        ['id' => 'PAY002', 'project_name' => '数据分析平台', 'payer_name' => 'XYZ公司', 'amount' => 300000, 'payment_method' => '银行转账', 'transaction_date' => '2026-06-10', 'status' => 'confirmed'],
                        ['id' => 'PAY003', 'project_name' => 'ERP系统升级', 'payer_name' => 'DEF集团', 'amount' => 800000, 'payment_method' => '承兑汇票', 'transaction_date' => '2026-06-05', 'status' => 'pending'],
                    ],
                    'current_page' => 1,
                    'per_page' => 10,
                    'total' => 3,
                    'last_page' => 1,
                ],
            ]);
        })->name('business-overview');

        Route::get('/review', function () {
            return Inertia::render('Dashboard/ReviewPanel', [
                'filters' => [],
                'summary' => [
                    'total_projects' => 28,
                    'total_receivable' => 12580000,
                    'total_recovered' => 8620000,
                    'total_written_off' => 210000,
                    'recovery_rate' => 68.5,
                ],
                'differences' => [
                    'data' => [
                        ['id' => 1, 'project_name' => '智慧城市一期', 'difference_type' => 'amount_mismatch', 'amount' => 20000, 'status' => 'pending', 'resolution' => null, 'created_at' => '2026-06-17', 'resolved_at' => null],
                        ['id' => 2, 'project_name' => 'ERP系统升级', 'difference_type' => 'date_mismatch', 'amount' => 800000, 'status' => 'processing', 'resolution' => null, 'created_at' => '2026-06-16', 'resolved_at' => null],
                        ['id' => 4, 'project_name' => '数据分析平台', 'difference_type' => 'amount_mismatch', 'amount' => 50000, 'status' => 'resolved', 'resolution' => '已调账处理', 'created_at' => '2026-06-14', 'resolved_at' => '2026-06-16'],
                    ],
                    'current_page' => 1,
                    'per_page' => 10,
                    'total' => 3,
                    'last_page' => 1,
                ],
                'projects' => [
                    ['id' => 1, 'name' => '智慧城市一期项目'],
                    ['id' => 2, 'name' => '数据分析平台'],
                    ['id' => 3, 'name' => 'ERP系统升级'],
                    ['id' => 4, 'name' => '移动端应用开发'],
                ],
            ]);
        })->name('review');
    });
});

require __DIR__ . '/auth.php';
