<?php

namespace App\Http\Controllers;

use App\Models\QualityReport;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QualityReportController extends Controller
{
    public function index(Request $request)
    {
        $query = QualityReport::with(['workOrder', 'vehicle', 'technician']);

        if ($request->filled('date_from')) {
            $query->whereDate('report_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('report_date', '<=', $request->date_to);
        }

        if ($request->filled('technician_id')) {
            $query->where('technician_id', $request->technician_id);
        }

        $reports = $query->orderBy('report_date', 'desc')->paginate(20);

        return Inertia::render('QualityReports/Index', [
            'reports' => $reports,
            'filters' => $request->only(['date_from', 'date_to', 'technician_id']),
        ]);
    }

    public function show(QualityReport $qualityReport)
    {
        $qualityReport->load(['workOrder', 'vehicle', 'technician', 'generatedBy']);

        return Inertia::render('QualityReports/Show', [
            'report' => $qualityReport,
        ]);
    }
}
