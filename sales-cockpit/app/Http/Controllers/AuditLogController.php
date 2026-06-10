<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index()
    {
        if (!request()->user()->hasPermission('audit_log.view')) {
            abort(403);
        }

        $query = AuditLog::with('user');

        if ($entityType = request('entity_type')) {
            $query->where('entity_type', $entityType);
        }

        if ($entityId = request('entity_id')) {
            $query->where('entity_id', $entityId);
        }

        if ($userId = request('user_id')) {
            $query->where('user_id', $userId);
        }

        if ($action = request('action')) {
            $query->where('action', $action);
        }

        if ($startDate = request('start_date')) {
            $query->where('created_at', '>=', $startDate);
        }

        if ($endDate = request('end_date')) {
            $query->where('created_at', '<=', $endDate . ' 23:59:59');
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('AuditLogs/Index', [
            'logs' => $logs,
            'filters' => request()->only(['entity_type', 'entity_id', 'user_id', 'action', 'start_date', 'end_date']),
        ]);
    }
}
