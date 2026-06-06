<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ImportExportTask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use App\Jobs\ImportDataJob;
use App\Jobs\ExportDataJob;

class ImportExportController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('import_export.view');

        $query = ImportExportTask::with('createdBy')
            ->when($request->type, fn($q) => $q->where('type', $request->type))
            ->when($request->module, fn($q) => $q->where('module', $request->module))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->orderBy('created_at', 'desc');

        return response()->json([
            'data' => $query->paginate($request->per_page ?? 20),
        ]);
    }

    public function import(Request $request, $module)
    {
        Gate::authorize('import_export.import');

        $validated = $request->validate([
            'file' => 'required|file|mimes:xlsx,csv,xls|max:10240',
        ]);

        $allowedModules = ['customers', 'products', 'orders', 'inventories'];
        if (!in_array($module, $allowedModules)) {
            return response()->json([
                'message' => '不支持的模块',
            ], 422);
        }

        $file = $request->file('file');
        $filePath = $file->store('imports', 'public');

        $task = ImportExportTask::create([
            'task_no' => 'IMP' . date('YmdHis') . rand(100, 999),
            'type' => 'import',
            'module' => $module,
            'file_path' => $filePath,
            'original_file_name' => $file->getClientOriginalName(),
            'status' => 'pending',
            'created_by' => $request->user()->id,
        ]);

        ImportDataJob::dispatch($task);

        return response()->json([
            'message' => '导入任务已创建，正在后台处理',
            'data' => $task,
        ], 202);
    }

    public function export(Request $request, $module)
    {
        Gate::authorize('import_export.export');

        $allowedModules = ['customers', 'products', 'orders', 'inventories', 'debts', 'statements'];
        if (!in_array($module, $allowedModules)) {
            return response()->json([
                'message' => '不支持的模块',
            ], 422);
        }

        $filters = $request->except(['module']);

        $task = ImportExportTask::create([
            'task_no' => 'EXP' . date('YmdHis') . rand(100, 999),
            'type' => 'export',
            'module' => $module,
            'filters' => $filters,
            'status' => 'pending',
            'created_by' => $request->user()->id,
        ]);

        ExportDataJob::dispatch($task);

        return response()->json([
            'message' => '导出任务已创建，正在后台处理',
            'data' => $task,
        ], 202);
    }

    public function download(ImportExportTask $task)
    {
        Gate::authorize('import_export.download');

        if ($task->status !== 'completed' || !$task->file_path) {
            return response()->json([
                'message' => '文件不可下载',
            ], 422);
        }

        if (!Storage::disk('public')->exists($task->file_path)) {
            return response()->json([
                'message' => '文件不存在',
            ], 404);
        }

        return Storage::disk('public')->download($task->file_path, $task->original_file_name ?? $task->task_no . '.xlsx');
    }
}
