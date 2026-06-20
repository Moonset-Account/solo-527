<?php

namespace App\Http\Controllers;

use App\Models\ArtClass;
use App\Models\StageReport;
use App\Models\StageReportItem;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StageReportController extends Controller
{
    public function index(Request $request)
    {
        $reports = StageReport::with('artClass')
            ->when($request->search, fn($q, $v) => $q->where('title', 'like', "%{$v}%"))
            ->when($request->art_class_id, fn($q, $v) => $q->where('art_class_id', $v))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->stage_type, fn($q, $v) => $q->where('stage_type', $v))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('StageReports/Index', [
            'reports' => $reports,
            'filters' => $request->only(['search', 'art_class_id', 'status', 'stage_type']),
        ]);
    }

    public function show($id)
    {
        $report = StageReport::with(['items.student', 'artClass'])
            ->findOrFail($id);

        return Inertia::render('StageReports/Show', [
            'report' => $report,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'art_class_id' => 'required|exists:art_classes,id',
            'title' => 'required|string|max:255',
            'stage_type' => 'required|string|max:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'config' => 'nullable|array',
            'status' => 'required|string|max:50',
        ]);

        StageReport::create($validated);

        return redirect()->back()->with('success', '阶段报告创建成功');
    }

    public function generate($id)
    {
        $report = StageReport::with('artClass.students')->findOrFail($id);

        DB::transaction(function () use ($report) {
            foreach ($report->artClass->students as $student) {
                $attendanceRate = $student->stageReportItems()
                    ->whereHas('stageReport', fn($q) => $q->where('art_class_id', $report->art_class_id))
                    ->avg('attendance_rate') ?? 0;

                $homeworkScore = $student->stageReportItems()
                    ->whereHas('stageReport', fn($q) => $q->where('art_class_id', $report->art_class_id))
                    ->avg('homework_score') ?? 0;

                $artworkScore = $student->artworks()
                    ->where('art_class_id', $report->art_class_id)
                    ->avg('id') ?? 0;

                $overallScore = ($attendanceRate * 0.3) + ($homeworkScore * 0.3) + ($artworkScore * 0.4);

                StageReportItem::create([
                    'stage_report_id' => $report->id,
                    'student_id' => $student->id,
                    'attendance_rate' => round($attendanceRate, 2),
                    'homework_score' => round($homeworkScore, 2),
                    'artwork_score' => round($artworkScore, 2),
                    'overall_score' => round($overallScore, 2),
                ]);
            }

            $report->update([
                'status' => 'generated',
                'generated_at' => now(),
            ]);
        });

        return redirect()->back()->with('success', '报告生成成功');
    }

    public function publish($id)
    {
        $report = StageReport::findOrFail($id);
        $report->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        return redirect()->back()->with('success', '报告已发布');
    }

    public function export($id)
    {
        $report = StageReport::with(['items.student', 'artClass'])->findOrFail($id);

        $pdf = Pdf::loadView('reports.stage-report', ['report' => $report]);

        return $pdf->download("stage-report-{$report->id}.pdf");
    }

    public function destroy($id)
    {
        $report = StageReport::findOrFail($id);
        $report->items()->delete();
        $report->delete();

        return redirect()->back()->with('success', '报告删除成功');
    }
}
