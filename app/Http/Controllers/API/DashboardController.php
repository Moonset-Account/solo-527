<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DashboardController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function overview()
    {
        Gate::authorize('dashboard.view');

        return response()->json([
            'data' => $this->dashboardService->getOverview(),
        ]);
    }

    public function timeoutAlerts(Request $request)
    {
        Gate::authorize('dashboard.timeout');

        $filters = $request->only([
            'hours', 'status', 'assignee', 'start_date', 'end_date',
        ]);

        return response()->json([
            'data' => $this->dashboardService->getTimeoutAlerts($filters),
        ]);
    }

    public function resourceUtilization(Request $request)
    {
        Gate::authorize('dashboard.resource');

        $filters = $request->only(['start_date', 'end_date']);

        return response()->json([
            'data' => $this->dashboardService->getResourceUtilization($filters),
        ]);
    }

    public function workflowStats(Request $request)
    {
        Gate::authorize('dashboard.view');

        $filters = $request->only(['start_date', 'end_date', 'assignee']);

        return response()->json([
            'data' => $this->dashboardService->getWorkflowStats($filters),
        ]);
    }
}
