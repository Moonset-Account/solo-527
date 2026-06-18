<?php

namespace App\Http\Controllers;

use App\Models\OperationLog;
use App\Models\SavedQuery;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OperationLogController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', OperationLog::class);

        $query = OperationLog::with('user')->latest();

        if ($keyword = $request->input('keyword')) {
            $query->search($keyword);
        }

        if ($userId = $request->input('user_id')) {
            $query->byUser($userId);
        }

        if ($action = $request->input('action')) {
            $query->byAction($action);
        }

        if ($modelType = $request->input('model_type')) {
            $query->byModel($modelType);
        }

        if ($startDate = $request->input('start_date')) {
            $endDate = $request->input('end_date', now());
            $query->byDateRange($startDate, $endDate);
        }

        if ($missedOnly = $request->input('missed_only')) {
            if ($missedOnly === 'yes') {
                $query->inspectionMissed();
            }
        }

        $logs = $query->paginate(30)->withQueryString();

        $savedQueries = SavedQuery::accessible($request->user())
            ->byModel(OperationLog::class)
            ->ordered()
            ->get();

        $users = \App\Models\User::all(['id', 'name', 'email']);

        $actions = OperationLog::distinct()->pluck('action');

        $modelTypes = OperationLog::distinct()->pluck('model_type')->filter();

        $stats = [
            'total' => OperationLog::count(),
            'today' => OperationLog::where('created_at', '>=', today())->count(),
            'missed' => OperationLog::inspectionMissed()->count(),
        ];

        return Inertia::render('OperationLogs/Index', [
            'logs' => $logs,
            'filters' => $request->all(),
            'savedQueries' => $savedQueries,
            'users' => $users,
            'actions' => $actions,
            'modelTypes' => $modelTypes,
            'stats' => $stats,
        ]);
    }

    public function show(OperationLog $log)
    {
        $this->authorize('view', $log);

        $log->load('user', 'model');

        return Inertia::render('OperationLogs/Show', [
            'log' => $log,
        ]);
    }

    public function export(Request $request)
    {
        $this->authorize('viewAny', OperationLog::class);

        $query = OperationLog::with('user');

        if ($keyword = $request->input('keyword')) {
            $query->search($keyword);
        }

        if ($userId = $request->input('user_id')) {
            $query->byUser($userId);
        }

        if ($action = $request->input('action')) {
            $query->byAction($action);
        }

        if ($startDate = $request->input('start_date')) {
            $endDate = $request->input('end_date', now());
            $query->byDateRange($startDate, $endDate);
        }

        $logs = $query->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="operation_logs.csv"',
        ];

        $callback = function () use ($logs) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', '用户', '操作', '模型', '描述', 'IP地址', '创建时间']);

            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->id,
                    $log->user?->name ?? 'System',
                    $log->action,
                    $log->model_type,
                    $log->description,
                    $log->ip_address,
                    $log->created_at,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
