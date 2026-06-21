<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\ExportRecord;
use App\Services\ExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ExportController extends Controller
{
    protected ExportService $exportService;

    public function __construct(ExportService $exportService)
    {
        $this->exportService = $exportService;
    }

    public function index(Request $request)
    {
        $eventId = $request->input('event_id');
        $events = Event::orderBy('start_time', 'desc')->get(['id', 'name']);

        return Inertia::render('Admin/Export/Index', [
            'events' => $events,
            'selectedEventId' => $eventId,
            'export_types' => ExportRecord::EXPORT_TYPES,
            'export_columns' => [
                'registrations' => $this->exportService->getExportColumns('registrations'),
                'summary' => $this->exportService->getExportColumns('summary'),
                'attendance' => $this->exportService->getExportColumns('attendance'),
            ],
        ]);
    }

    public function exportRegistrations(Request $request)
    {
        $validated = $request->validate([
            'event_id' => ['nullable', 'exists:events,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'conversion_stage' => ['nullable', 'string'],
            'registration_status' => ['nullable', 'string'],
            'attendance_status' => ['nullable', 'string'],
            'source_channel' => ['nullable', 'string'],
            'quality_level' => ['nullable', 'string'],
            'export_columns' => ['nullable', 'array'],
        ]);

        $record = $this->exportService->createExport($validated, 'registrations');

        return redirect()->back()->with('success', "导出成功，共导出 {$record->record_count} 条记录");
    }

    public function exportSummary(Request $request)
    {
        $validated = $request->validate([
            'event_id' => ['required', 'exists:events,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'export_columns' => ['nullable', 'array'],
        ]);

        $record = $this->exportService->createExport($validated, 'summary');

        return redirect()->back()->with('success', "汇总数据导出成功");
    }

    public function exportAttendance(Request $request)
    {
        $validated = $request->validate([
            'event_id' => ['required', 'exists:events,id'],
            'session_id' => ['nullable', 'exists:event_sessions,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'export_columns' => ['nullable', 'array'],
        ]);

        $record = $this->exportService->createExport($validated, 'attendance');

        return redirect()->back()->with('success', "到场数据导出成功");
    }

    public function history(Request $request)
    {
        $exportType = $request->input('export_type');
        $eventId = $request->input('event_id');
        $mineOnly = $request->boolean('mine_only', false);

        $events = Event::orderBy('start_time', 'desc')->get(['id', 'name']);

        $query = ExportRecord::with(['event:id,name', 'exporter:id,name,department'])
            ->when($eventId, fn($q, $eid) => $q->where('event_id', $eid))
            ->when($exportType, fn($q, $t) => $q->where('export_type', $t))
            ->when($mineOnly, fn($q) => $q->byUser(auth()->id()))
            ->recent(90);

        $records = $query->orderBy('created_at', 'desc')
            ->paginate(30)
            ->through(fn($r) => [
                'id' => $r->id,
                'event_id' => $r->event_id,
                'event_name' => $r->event?->name,
                'export_type' => $r->export_type,
                'export_type_text' => $r->export_type_text,
                'file_name' => $r->file_name,
                'file_format' => $r->file_format,
                'record_count' => $r->record_count,
                'file_size' => $r->file_size,
                'file_size_text' => $this->formatFileSize($r->file_size),
                'query_criteria' => $r->query_criteria,
                'query_criteria_text' => $r->getQueryCriteriaText(),
                'exported_by_name' => $r->exported_by_name,
                'exported_by_dept' => $r->exported_by_dept,
                'exported_from_ip' => $r->exported_from_ip,
                'sql_hash' => $r->sql_hash,
                'download_count' => $r->download_count,
                'status' => $r->status,
                'expired_at' => $r->expired_at?->toDateTimeString(),
                'is_available' => $r->isAvailable(),
                'is_expired' => $r->isExpired(),
                'created_at' => $r->created_at?->toDateTimeString(),
            ]);

        $stats = [
            'total' => (clone $query)->count(),
            'today' => (clone $query)->whereDate('created_at', today())->count(),
            'this_week' => (clone $query)->where('created_at', '>=', now()->startOfWeek())->count(),
            'total_records' => (clone $query)->sum('record_count'),
        ];

        return Inertia::render('Admin/Export/History', [
            'events' => $events,
            'filters' => $request->only(['export_type', 'event_id', 'mine_only']),
            'records' => $records,
            'stats' => $stats,
            'export_types' => ExportRecord::EXPORT_TYPES,
        ]);
    }

    public function download(ExportRecord $export)
    {
        $download = $this->exportService->download($export);

        $headers = $download['headers'];
        $headerLine = '';
        foreach ($headers as $label => $value) {
            $headerLine .= "{$label}：{$value}" . PHP_EOL;
        }

        $originalContent = file_get_contents($download['path']);
        $tempPath = tempnam(sys_get_temp_dir(), 'export_');
        $finalContent = "\xEF\xBB\xBF" . '===== 报表信息 =====' . PHP_EOL . $headerLine . PHP_EOL . '===== 数据内容 =====' . PHP_EOL . str_replace("\xEF\xBB\xBF", '', $originalContent);
        file_put_contents($tempPath, $finalContent);

        return response()->download($tempPath, $download['file_name'], [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ])->deleteFileAfterSend(true);
    }

    protected function formatFileSize(?int $bytes): string
    {
        if (!$bytes) return '0 B';
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = floor(log($bytes, 1024));
        return round($bytes / pow(1024 ** $i), 2) . ' ' . $units[$i];
    }
}
