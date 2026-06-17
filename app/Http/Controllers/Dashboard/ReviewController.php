<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function __construct(
        protected ReportService $reportService
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'project_id' => 'nullable|integer',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $report = $this->reportService->getDifferenceReport($filters);

        return Inertia::render('Dashboard/Review/Index', [
            'filters' => $filters,
            'summary' => $report['summary'],
            'differences' => $report['differences'],
        ]);
    }

    public function auditLogs(Request $request): Response
    {
        $validated = $request->validate([
            'project_id' => 'nullable|integer',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'per_page' => 'nullable|integer|min:10|max:100',
        ]);

        $filters = array_filter([
            'project_id' => $validated['project_id'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
        ]);

        $auditLogs = collect();
        if (! empty($filters['project_id'])) {
            $report = $this->reportService->getDifferenceReport($filters);
            $auditLogs = $report['differences'];
        }

        return Inertia::render('Dashboard/Review/AuditLogs', [
            'filters' => $filters,
            'audit_logs' => $auditLogs,
            'per_page' => $validated['per_page'] ?? 20,
        ]);
    }
}
