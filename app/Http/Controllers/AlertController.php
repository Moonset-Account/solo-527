<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\AlertComment;
use App\Models\Notification;
use App\Models\SavedQuery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Inertia\Inertia;

class AlertController extends Controller
{
    public function index(Request $request)
    {
        $query = Alert::with(['acknowledgedBy', 'processedBy', 'closedBy'])->latest();

        if ($keyword = $request->input('keyword')) {
            $query->search($keyword);
        }

        if ($status = $request->input('status')) {
            $query->byStatus($status);
        }

        if ($level = $request->input('level')) {
            $query->byLevel($level);
        }

        if ($serverIp = $request->input('server_ip')) {
            $query->byServerIp($serverIp);
        }

        if ($startDate = $request->input('start_date')) {
            $endDate = $request->input('end_date', now());
            $query->byDateRange($startDate, $endDate);
        }

        if ($isInspected = $request->input('is_inspected')) {
            if ($isInspected === 'yes') {
                $query->where('is_inspected', true);
            } elseif ($isInspected === 'no') {
                $query->where('is_inspected', false);
            }
        }

        $alerts = $query->paginate(20)->withQueryString();

        $savedQueries = SavedQuery::accessible($request->user())
            ->byModel(Alert::class)
            ->ordered()
            ->get();

        $stats = $this->getAlertStats();

        return Inertia::render('Alerts/Index', [
            'alerts' => $alerts,
            'filters' => $request->all(),
            'savedQueries' => $savedQueries,
            'stats' => $stats,
        ]);
    }

    public function show(Alert $alert)
    {
        $alert->load([
            'acknowledgedBy',
            'processedBy',
            'closedBy',
            'inspectedBy',
            'comments.user',
            'inspectionRecords.user',
        ]);

        return Inertia::render('Alerts/Show', [
            'alert' => $alert,
        ]);
    }

    public function create()
    {
        return Inertia::render('Alerts/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'level' => 'required|in:critical,warning,info,debug',
            'source' => 'nullable|string|max:255',
            'server_ip' => 'nullable|string|max:45',
            'service' => 'nullable|string|max:255',
            'hostname' => 'nullable|string|max:255',
            'tags' => 'nullable|string',
        ]);

        $alert = Alert::create($validated);

        Redis::publish('alerts', json_encode([
            'id' => $alert->id,
            'title' => $alert->title,
            'level' => $alert->level,
            'created_at' => $alert->created_at->toISOString(),
        ]));

        $this->notifyOnCallEngineers($alert);

        return redirect()->route('alerts.show', $alert)
            ->with('success', '告警创建成功');
    }

    public function acknowledge(Alert $alert)
    {
        $alert->acknowledge(auth()->user());

        return back()->with('success', '告警已确认');
    }

    public function startProcessing(Alert $alert)
    {
        $alert->startProcessing(auth()->user());

        return back()->with('success', '已开始处理告警');
    }

    public function resolve(Request $request, Alert $alert)
    {
        $validated = $request->validate([
            'resolution' => 'required|string',
        ]);

        $alert->resolve(auth()->user(), $validated['resolution']);

        AlertComment::addComment($alert, auth()->user(), $validated['resolution'], 'resolution');

        return back()->with('success', '告警已解决');
    }

    public function close(Alert $alert)
    {
        $alert->close(auth()->user());

        return back()->with('success', '告警已关闭');
    }

    public function escalate(Request $request, Alert $alert)
    {
        $validated = $request->validate([
            'level' => 'required|integer|min:1|max:5',
            'reason' => 'required|string',
        ]);

        $alert->escalate($validated['level'], $validated['reason']);

        AlertComment::addComment($alert, auth()->user(), $validated['reason'], 'escalation');

        $this->notifyEscalation($alert, $validated['level']);

        return back()->with('success', '告警已升级');
    }

    public function markInspected(Request $request, Alert $alert)
    {
        $validated = $request->validate([
            'was_missed' => 'boolean',
            'missed_reason' => 'nullable|string|required_if:was_missed,true',
        ]);

        $alert->markInspected(
            auth()->user(),
            $validated['was_missed'] ?? false,
            $validated['missed_reason'] ?? null
        );

        return back()->with('success', '巡检已记录');
    }

    public function addComment(Request $request, Alert $alert)
    {
        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        AlertComment::addComment($alert, auth()->user(), $validated['content']);

        return back()->with('success', '评论已添加');
    }

    public function batchAcknowledge(Request $request)
    {
        $ids = $request->input('ids', []);
        Alert::whereIn('id', $ids)->where('status', 'open')->each(function ($alert) {
            $alert->acknowledge(auth()->user());
        });

        return back()->with('success', '批量确认成功');
    }

    public function batchClose(Request $request)
    {
        $ids = $request->input('ids', []);
        Alert::whereIn('id', $ids)->whereIn('status', ['resolved', 'processing'])->each(function ($alert) {
            $alert->close(auth()->user());
        });

        return back()->with('success', '批量关闭成功');
    }

    public function export(Request $request)
    {
        $query = Alert::query();

        if ($keyword = $request->input('keyword')) {
            $query->search($keyword);
        }

        if ($status = $request->input('status')) {
            $query->byStatus($status);
        }

        if ($level = $request->input('level')) {
            $query->byLevel($level);
        }

        if ($startDate = $request->input('start_date')) {
            $endDate = $request->input('end_date', now());
            $query->byDateRange($startDate, $endDate);
        }

        $alerts = $query->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="alerts.csv"',
        ];

        $callback = function () use ($alerts) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', '标题', '级别', '状态', '服务器IP', '服务', '创建时间', '确认时间', '关闭时间']);

            foreach ($alerts as $alert) {
                fputcsv($file, [
                    $alert->id,
                    $alert->title,
                    $alert->level,
                    $alert->status,
                    $alert->server_ip,
                    $alert->service,
                    $alert->created_at,
                    $alert->acknowledged_at,
                    $alert->closed_at,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    protected function getAlertStats()
    {
        $stats = Redis::get('alert:stats');
        if ($stats) {
            return json_decode($stats, true);
        }

        $stats = [
            'total' => Alert::count(),
            'open' => Alert::open()->count(),
            'critical' => Alert::critical()->open()->count(),
            'acknowledged' => Alert::byStatus('acknowledged')->count(),
            'processing' => Alert::byStatus('processing')->count(),
            'resolved_today' => Alert::resolved()
                ->where('closed_at', '>=', today())
                ->count(),
            'not_inspected' => Alert::notInspected()->count(),
        ];

        Redis::setex('alert:stats', 60, json_encode($stats));

        return $stats;
    }

    protected function notifyOnCallEngineers(Alert $alert)
    {
        $onDutyUsers = \App\Models\User::onDuty()->get();

        foreach ($onDutyUsers as $user) {
            Notification::sendToUser(
                $user,
                "新告警: {$alert->title}",
                "级别: {$alert->level}\n服务器: {$alert->server_ip}\n服务: {$alert->service}",
                'alert',
                $alert->level === 'critical' ? 'critical' : 'warning',
                $alert,
                ['site', 'email']
            );
        }
    }

    protected function notifyEscalation(Alert $alert, int $level)
    {
        $admins = \App\Models\User::whereIn('role', ['admin', 'manager'])->get();

        foreach ($admins as $user) {
            Notification::sendToUser(
                $user,
                "告警升级通知 #{$alert->id}",
                "告警已升级到级别 {$level}\n标题: {$alert->title}\n级别: {$alert->level}",
                'escalation',
                'critical',
                $alert,
                ['site', 'email', 'sms']
            );
        }
    }
}
