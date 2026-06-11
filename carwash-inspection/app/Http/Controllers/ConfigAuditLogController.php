<?php

namespace App\Http\Controllers;

use App\Models\ConfigAuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConfigAuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ConfigAuditLog::with('changedByUser');

        if ($request->filled('config_type')) {
            $query->where('config_type', $request->config_type);
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('ConfigAuditLogs/Index', [
            'logs' => $logs,
            'filters' => $request->only(['config_type']),
        ]);
    }

    public function show(ConfigAuditLog $configAuditLog)
    {
        $configAuditLog->load('changedByUser');

        return Inertia::render('ConfigAuditLogs/Show', [
            'log' => $configAuditLog,
        ]);
    }
}
