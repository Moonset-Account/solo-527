<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\ChangeWindow;
use App\Models\DutySchedule;
use App\Models\InspectionRecord;
use App\Models\Notification;
use App\Models\OperationLog;
use Illuminate\Support\Facades\Redis;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $alertStats = $this->getAlertStats();
        $dutyStats = $this->getDutyStats();
        $recentAlerts = $this->getRecentAlerts();
        $currentDuty = $this->getCurrentDuty();
        $upcomingChanges = $this->getUpcomingChanges();
        $recentActivities = $this->getRecentActivities();
        $pendingApprovals = $this->getPendingApprovals();
        $unreadNotifications = $this->getUnreadNotifications();
        $inspectionStats = $this->getInspectionStats();

        return Inertia::render('Dashboard/Index', [
            'alertStats' => $alertStats,
            'dutyStats' => $dutyStats,
            'recentAlerts' => $recentAlerts,
            'currentDuty' => $currentDuty,
            'upcomingChanges' => $upcomingChanges,
            'recentActivities' => $recentActivities,
            'pendingApprovals' => $pendingApprovals,
            'unreadNotifications' => $unreadNotifications,
            'inspectionStats' => $inspectionStats,
            'isAdmin' => $user->isAdmin(),
        ]);
    }

    protected function getAlertStats()
    {
        $cacheKey = 'dashboard:alert_stats';
        $cached = Redis::get($cacheKey);
        if ($cached) {
            return json_decode($cached, true);
        }

        $stats = [
            'total' => Alert::count(),
            'open' => Alert::open()->count(),
            'critical' => Alert::critical()->open()->count(),
            'warning' => Alert::byLevel('warning')->open()->count(),
            'acknowledged' => Alert::byStatus('acknowledged')->count(),
            'processing' => Alert::byStatus('processing')->count(),
            'resolved_today' => Alert::closed()
                ->where('closed_at', '>=', today())
                ->count(),
            'resolved_this_week' => Alert::closed()
                ->where('closed_at', '>=', now()->startOfWeek())
                ->count(),
            'not_inspected' => Alert::notInspected()->count(),
        ];

        Redis::setex($cacheKey, 300, json_encode($stats));

        return $stats;
    }

    protected function getDutyStats()
    {
        return [
            'current_on_duty' => DutySchedule::current()->with('user')->get(),
            'upcoming' => DutySchedule::upcoming(24)->with('user')->get(),
            'my_schedule' => auth()->user()->dutySchedules()
                ->where('end_time', '>=', now())
                ->orderBy('start_time')
                ->with('user')
                ->take(5)
                ->get(),
        ];
    }

    protected function getRecentAlerts()
    {
        return Alert::with(['acknowledgedBy', 'processedBy'])
            ->latest()
            ->take(10)
            ->get();
    }

    protected function getCurrentDuty()
    {
        return DutySchedule::current()
            ->with('user')
            ->orderBy('type')
            ->get();
    }

    protected function getUpcomingChanges()
    {
        return ChangeWindow::with('createdBy', 'approvedBy')
            ->upcoming(48)
            ->orderBy('start_time')
            ->take(5)
            ->get();
    }

    protected function getRecentActivities()
    {
        return OperationLog::with('user')
            ->latest()
            ->take(15)
            ->get();
    }

    protected function getPendingApprovals()
    {
        if (! auth()->user()->isAdmin()) {
            return collect();
        }

        return \App\Models\AccountApplication::with('applicant')
            ->pending()
            ->latest()
            ->take(5)
            ->get();
    }

    protected function getUnreadNotifications()
    {
        return auth()->user()->notifications()
            ->unread()
            ->latest()
            ->take(10)
            ->get();
    }

    protected function getInspectionStats()
    {
        $todayStart = today();
        $todayEnd = now();

        $stats = [
            'today_total' => InspectionRecord::whereBetween('created_at', [$todayStart, $todayEnd])->count(),
            'today_missed' => InspectionRecord::missed()
                ->whereBetween('created_at', [$todayStart, $todayEnd])
                ->count(),
            'today_pass' => InspectionRecord::whereBetween('created_at', [$todayStart, $todayEnd])
                ->where('status', 'pass')
                ->count(),
            'today_fail' => InspectionRecord::whereBetween('created_at', [$todayStart, $todayEnd])
                ->where('status', 'fail')
                ->count(),
            'missed_records' => InspectionRecord::missed()
                ->with('user', 'alert')
                ->latest()
                ->take(10)
                ->get(),
        ];

        return $stats;
    }

    public function getRealtimeStats()
    {
        $stats = [
            'open_alerts' => Alert::open()->count(),
            'critical_alerts' => Alert::critical()->open()->count(),
            'unread_notifications' => auth()->user()->unreadNotificationsCount(),
        ];

        return response()->json($stats);
    }
}
