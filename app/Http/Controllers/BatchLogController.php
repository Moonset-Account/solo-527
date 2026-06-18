<?php

namespace App\Http\Controllers;

use App\Models\FailedBatch;
use App\Models\RetryLog;
use App\Services\BatchProcessingService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BatchLogController extends Controller
{
    public function __construct(protected BatchProcessingService $batchService) {}

    public function index(Request $request)
    {
        $batches = FailedBatch::with('creator')
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->batch_type, fn ($q) => $q->where('batch_type', $request->batch_type))
            ->when($request->search, fn ($q) => $q->where('batch_number', 'like', "%{$request->search}%"))
            ->latest()
            ->paginate(20);

        $stats = $this->batchService->getBatchStats();

        return Inertia::render('Batches/Index', [
            'batches' => $batches,
            'stats' => $stats,
            'filters' => $request->only(['status', 'batch_type', 'search']),
        ]);
    }

    public function failed(Request $request)
    {
        $batches = FailedBatch::with('retryLogs', 'creator')
            ->whereIn('status', ['failed', 'retrying'])
            ->when($request->batch_type, fn ($q) => $q->where('batch_type', $request->batch_type))
            ->latest()
            ->paginate(20);

        return Inertia::render('Batches/Failed', [
            'batches' => $batches,
            'filters' => $request->only(['batch_type']),
        ]);
    }

    public function retry(Request $request, FailedBatch $failedBatch)
    {
        try {
            $this->batchService->retryBatch($failedBatch, auth()->user());

            return back()->with('success', '批次已重新执行');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function logs(FailedBatch $failedBatch)
    {
        $logs = $this->batchService->getRetryHistory($failedBatch);

        return Inertia::render('Batches/Logs', [
            'batch' => $failedBatch,
            'retry_logs' => $logs,
        ]);
    }

    public function retrySingle($logId)
    {
        try {
            $retryLog = RetryLog::findOrFail($logId);
            $failedBatch = $retryLog->failedBatch;

            $this->batchService->retryBatch($failedBatch, auth()->user());

            activity()
                ->performedOn($failedBatch)
                ->causedBy(auth()->user())
                ->withProperties(['retry_log_id' => $logId])
                ->log('single retry');

            return back()->with('success', '单条记录已重新执行');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
