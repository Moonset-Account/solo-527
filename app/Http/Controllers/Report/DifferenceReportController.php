<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DifferenceReportController extends Controller
{
    public function __construct(
        protected ReportService $reportService
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'project_id' => 'nullable|integer',
            'status' => 'nullable|string',
            'type' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'responsible_user_id' => 'nullable|integer',
        ]);

        $report = $this->reportService->getDifferenceReport($filters);

        return Inertia::render('Report/DifferenceReport/Index', [
            'filters' => $filters,
            'summary' => $report['summary'],
            'differences' => $report['differences'],
        ]);
    }

    public function export(Request $request): BinaryFileResponse
    {
        $filters = $request->validate([
            'project_id' => 'nullable|integer',
            'status' => 'nullable|string',
            'type' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'responsible_user_id' => 'nullable|integer',
        ]);

        $filePath = $this->reportService->exportReport($filters);

        return response()->download($filePath)->deleteFileAfterSend();
    }
}
