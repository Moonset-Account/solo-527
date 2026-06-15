<?php

namespace App\Http\Controllers;

use App\Models\ComplianceGap;
use App\Models\ChecklistRecord;
use App\Models\DownloadLog;
use App\Models\ReminderLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $period = $request->input('period', '30'); // 天数

        $startDate = now()->subDays($period);

        $statistics = $this->getOverallStatistics($startDate);
        $gapTrend = $this->getGapTrendData($startDate);
        $reviewEfficiency = $this->getReviewEfficiencyData($startDate);
        $severityDistribution = $this->getSeverityDistribution();
        $statusDistribution = $this->getStatusDistribution();
        $recentActivities = $this->getRecentActivities();
        $myTasks = $this->getMyTasks($user);
        $overdueItems = $this->getOverdueItems();
        $downloadStats = $this->getDownloadStats($startDate);

        return Inertia::render('Dashboard/Index', [
            'statistics' => $statistics,
            'gapTrend' => $gapTrend,
            'reviewEfficiency' => $reviewEfficiency,
            'severityDistribution' => $severityDistribution,
            'statusDistribution' => $statusDistribution,
            'recentActivities' => $recentActivities,
            'myTasks' => $myTasks,
            'overdueItems' => $overdueItems,
            'downloadStats' => $downloadStats,
            'period' => $period,
        ]);
    }

    protected function getOverallStatistics($startDate): array
    {
        $gapsCreated = ComplianceGap::where('created_at', '>=', $startDate)->count();
        $gapsClosed = ComplianceGap::whereIn('status', ['resolved', 'closed'])
            ->where('closed_date', '>=', $startDate)
            ->count();
        $recordsSubmitted = ChecklistRecord::where('status', 'submitted')
            ->where('submitted_at', '>=', $startDate)
            ->count();
        $recordsReviewed = ChecklistRecord::whereIn('status', ['reviewed', 'closed'])
            ->where('reviewed_at', '>=', $startDate)
            ->count();

        $avgResolutionTime = ComplianceGap::whereIn('status', ['resolved', 'closed'])
            ->where('closed_date', '>=', $startDate)
            ->whereNotNull('handling_duration_hours')
            ->avg('handling_duration_hours');

        $avgReviewTime = ComplianceGap::whereIn('status', ['resolved', 'closed'])
            ->where('closed_date', '>=', $startDate)
            ->whereNotNull('review_duration_hours')
            ->avg('review_duration_hours');

        $openGaps = ComplianceGap::open()->count();
        $overdueGaps = ComplianceGap::overdue()->count();
        $criticalGaps = ComplianceGap::where('severity', 'critical')->open()->count();

        return [
            'gaps_created' => $gapsCreated,
            'gaps_closed' => $gapsClosed,
            'records_submitted' => $recordsSubmitted,
            'records_reviewed' => $recordsReviewed,
            'open_gaps' => $openGaps,
            'overdue_gaps' => $overdueGaps,
            'critical_gaps' => $criticalGaps,
            'avg_resolution_hours' => round($avgResolutionTime, 1),
            'avg_review_hours' => round($avgReviewTime, 1),
            'closure_rate' => $gapsCreated > 0 ? round(($gapsClosed / $gapsCreated) * 100, 1) : 0,
        ];
    }

    protected function getGapTrendData($startDate): array
    {
        $days = $startDate->diffInDays(now());
        $trend = [];

        for ($i = $days; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();

            $created = ComplianceGap::whereDate('created_at', $date)->count();
            $closed = ComplianceGap::whereDate('closed_date', $date)
                ->whereIn('status', ['resolved', 'closed'])
                ->count();

            $trend[] = [
                'date' => $date,
                'created' => $created,
                'closed' => $closed,
            ];
        }

        return $trend;
    }

    protected function getReviewEfficiencyData($startDate): array
    {
        $users = User::whereIn('role', ['compliance_manager', 'admin', 'project_secretary'])
            ->orderBy('name')
            ->get();

        $efficiency = [];

        foreach ($users as $user) {
            $reviewedGaps = ComplianceGap::where('closed_by', $user->id)
                ->where('closed_date', '>=', $startDate)
                ->count();

            $avgReviewTime = ComplianceGap::where('closed_by', $user->id)
                ->where('closed_date', '>=', $startDate)
                ->whereNotNull('review_duration_hours')
                ->avg('review_duration_hours');

            $avgHandlingTime = ComplianceGap::where('responsible_user_id', $user->id)
                ->where('closed_date', '>=', $startDate)
                ->whereNotNull('handling_duration_hours')
                ->avg('handling_duration_hours');

            $pendingCount = ReminderLog::where('recipient_id', $user->id)
                ->whereNull('read_at')
                ->count();

            $efficiency[] = [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'role' => $user->role,
                'department' => $user->department,
                'reviewed_gaps' => $reviewedGaps,
                'avg_review_hours' => round($avgReviewTime, 1),
                'avg_handling_hours' => round($avgHandlingTime, 1),
                'pending_tasks' => $pendingCount,
            ];
        }

        return collect($efficiency)->sortByDesc('reviewed_gaps')->values()->all();
    }

    protected function getSeverityDistribution(): array
    {
        $distribution = ComplianceGap::select('severity', DB::raw('count(*) as total'))
            ->groupBy('severity')
            ->pluck('total', 'severity')
            ->toArray();

        return [
            'critical' => $distribution['critical'] ?? 0,
            'high' => $distribution['high'] ?? 0,
            'medium' => $distribution['medium'] ?? 0,
            'low' => $distribution['low'] ?? 0,
        ];
    }

    protected function getStatusDistribution(): array
    {
        $distribution = ComplianceGap::select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        return [
            'open' => $distribution['open'] ?? 0,
            'in_progress' => $distribution['in_progress'] ?? 0,
            'pending_review' => $distribution['pending_review'] ?? 0,
            'resolved' => $distribution['resolved'] ?? 0,
            'closed' => $distribution['closed'] ?? 0,
        ];
    }

    protected function getRecentActivities(): array
    {
        $gapLogs = DB::table('gap_handling_logs')
            ->select(
                'gap_handling_logs.id',
                'gap_handling_logs.action_type',
                'gap_handling_logs.comment',
                'gap_handling_logs.created_at',
                'gap_handling_logs.compliance_gap_id as gap_id',
                'compliance_gaps.gap_no',
                'compliance_gaps.title as gap_title',
                'users.name as user_name'
            )
            ->join('compliance_gaps', 'gap_handling_logs.compliance_gap_id', '=', 'compliance_gaps.id')
            ->join('users', 'gap_handling_logs.user_id', '=', 'users.id')
            ->orderBy('gap_handling_logs.created_at', 'desc')
            ->limit(20)
            ->get();

        return $gapLogs->map(function ($log) {
            return [
                'id' => $log->id,
                'type' => 'gap',
                'action_type' => $log->action_type,
                'gap_id' => $log->gap_id,
                'gap_no' => $log->gap_no,
                'gap_title' => $log->gap_title,
                'user_name' => $log->user_name,
                'comment' => $log->comment,
                'created_at' => $log->created_at,
            ];
        })->toArray();
    }

    protected function getMyTasks($user): array
    {
        $myGaps = ComplianceGap::where('responsible_user_id', $user->id)
            ->open()
            ->orderBy('due_date', 'asc')
            ->limit(10)
            ->get(['id', 'gap_no', 'title', 'severity', 'status', 'due_date']);

        $toReview = ComplianceGap::where('status', 'pending_review')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get(['id', 'gap_no', 'title', 'severity', 'status', 'created_at']);

        return [
            'my_gaps' => $myGaps,
            'to_review' => $toReview,
        ];
    }

    protected function getOverdueItems(): array
    {
        $overdueGaps = ComplianceGap::overdue()
            ->with('responsibleUser')
            ->orderBy('due_date', 'asc')
            ->limit(10)
            ->get(['id', 'gap_no', 'title', 'severity', 'due_date', 'responsible_user_id']);

        return $overdueGaps;
    }

    protected function getDownloadStats($startDate): array
    {
        $totalDownloads = DownloadLog::where('created_at', '>=', $startDate)->count();

        $byType = DownloadLog::select('download_type', DB::raw('count(*) as total'))
            ->where('created_at', '>=', $startDate)
            ->groupBy('download_type')
            ->pluck('total', 'download_type')
            ->toArray();

        $topDownloads = DownloadLog::select(
            'file_name',
            'download_type',
            DB::raw('count(*) as download_count')
        )
            ->where('created_at', '>=', $startDate)
            ->groupBy('file_name', 'download_type')
            ->orderBy('download_count', 'desc')
            ->limit(10)
            ->get();

        return [
            'total' => $totalDownloads,
            'by_type' => $byType,
            'top_downloads' => $topDownloads,
        ];
    }

    public function reminders(Request $request)
    {
        $user = auth()->user();

        $query = ReminderLog::with(['notifiable', 'reminderRule'])
            ->where('recipient_id', $user->id)
            ->when($request->input('type'), function ($q, $type) {
                $q->where('type', $type);
            })
            ->when($request->input('is_read') === 'false', function ($q) {
                $q->whereNull('read_at');
            })
            ->orderBy('created_at', 'desc');

        $reminders = $query->paginate(20)->withQueryString();

        $unreadCount = ReminderLog::where('recipient_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return Inertia::render('Reminders/Index', [
            'reminders' => $reminders,
            'unread_count' => $unreadCount,
            'filters' => $request->all(),
        ]);
    }

    public function markReminderRead(ReminderLog $reminder)
    {
        if ($reminder->recipient_id !== auth()->id()) {
            abort(403);
        }

        $reminder->markAsRead();

        return response()->json(['success' => true]);
    }

    public function markAllRemindersRead()
    {
        auth()->user()->reminderLogs()
            ->whereNull('read_at')
            ->update(['read_at' => now(), 'status' => 'read']);

        return back()->with('success', '所有提醒已标记为已读');
    }

    public function downloadLogs(Request $request)
    {
        $query = DownloadLog::with('user')
            ->when($request->input('user_id'), function ($q, $userId) {
                $q->where('user_id', $userId);
            })
            ->when($request->input('download_type'), function ($q, $type) {
                $q->where('download_type', $type);
            })
            ->when($request->input('date_from'), function ($q, $date) {
                $q->whereDate('created_at', '>=', $date);
            })
            ->when($request->input('date_to'), function ($q, $date) {
                $q->whereDate('created_at', '<=', $date);
            })
            ->when($request->input('search'), function ($q, $search) {
                $q->where('file_name', 'like', "%{$search}%");
            })
            ->orderBy('created_at', 'desc');

        $logs = $query->paginate(20)->withQueryString();

        $users = User::orderBy('name')->get(['id', 'name']);
        $downloadTypes = [
            'gap_report' => '缺口报告',
            'checklist' => '检查清单',
            'evidence' => '证据材料',
            'compliance_summary' => '合规汇总',
        ];

        return Inertia::render('DownloadLogs/Index', [
            'logs' => $logs,
            'users' => $users,
            'download_types' => $downloadTypes,
            'filters' => $request->all(),
        ]);
    }
}
