<?php

namespace App\Http\Controllers;

use App\Models\EnvironmentAlert;
use App\Models\Greenhouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EnvironmentAlertController extends Controller
{
    public function index(Request $request)
    {
        $query = EnvironmentAlert::with(['greenhouse', 'sensor', 'acknowledgedBy', 'resolvedBy']);

        if ($greenhouseId = $request->input('greenhouse_id')) {
            $query->where('greenhouse_id', $greenhouseId);
        }

        if ($severity = $request->input('severity')) {
            $query->where('severity', $severity);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($alertType = $request->input('alert_type')) {
            $query->where('alert_type', $alertType);
        }

        $query->orderBy($request->input('sort_by', 'created_at'), $request->input('sort_direction', 'desc'));

        $alerts = $query->paginate($request->input('per_page', 15))->withQueryString();

        $greenhouses = Greenhouse::orderBy('name')->get(['id', 'name']);

        return Inertia::render('EnvironmentAlerts/Index', [
            'alerts' => $alerts,
            'greenhouses' => $greenhouses,
            'filters' => $request->only(['greenhouse_id', 'severity', 'status', 'alert_type']),
        ]);
    }

    public function show(EnvironmentAlert $environmentAlert)
    {
        $environmentAlert->load(['greenhouse', 'sensor', 'acknowledgedBy', 'resolvedBy']);

        return Inertia::render('EnvironmentAlerts/Show', [
            'alert' => $environmentAlert,
        ]);
    }

    public function acknowledge(Request $request, EnvironmentAlert $environmentAlert)
    {
        $environmentAlert->update([
            'status' => $environmentAlert->status === 'active' ? 'acknowledged' : $environmentAlert->status,
            'acknowledged_by' => Auth::id(),
            'acknowledged_at' => now(),
        ]);

        return redirect()->back()->with('success', '告警已确认');
    }

    public function resolve(Request $request, EnvironmentAlert $environmentAlert)
    {
        $request->validate([
            'resolution_note' => 'nullable|string|max:1000',
        ]);

        $environmentAlert->update([
            'status' => 'resolved',
            'resolved_by' => Auth::id(),
            'resolved_at' => now(),
        ]);

        return redirect()->back()->with('success', '告警已处理');
    }
}
