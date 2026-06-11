<?php

namespace App\Http\Controllers;

use App\Models\ApiFailureLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ApiFailureLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ApiFailureLog::query();

        if ($request->filled('api_type')) {
            $query->where('api_type', $request->api_type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('ApiFailureLogs/Index', [
            'logs' => $logs,
            'filters' => $request->only(['api_type', 'status']),
        ]);
    }

    public function retry(ApiFailureLog $log)
    {
        $log->increment('retry_count');
        $log->update([
            'last_retry_at' => now(),
            'status' => 'retrying',
        ]);

        return redirect()->route('api-failure-logs.index')->with('success', 'Retry initiated.');
    }

    public function resolve(ApiFailureLog $log)
    {
        $log->update([
            'status' => 'resolved',
            'resolved_at' => now(),
        ]);

        return redirect()->route('api-failure-logs.index')->with('success', 'Failure resolved.');
    }
}
