<?php

namespace App\Http\Controllers;

use App\Http\Requests\ResolveExceptionRequest;
use App\Models\ExceptionLog;
use Inertia\Inertia;

class ExceptionLogController extends Controller
{
    public function index()
    {
        $filters = request()->only(['type', 'status']);

        $exceptions = ExceptionLog::with('resolver')
            ->when($filters['type'] ?? null, fn($q, $type) => $q->where('type', $type))
            ->when($filters['status'] ?? null, fn($q, $status) => $q->where('status', $status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Exception/Index', [
            'exceptions' => $exceptions,
            'filters' => $filters,
        ]);
    }

    public function resolve(ResolveExceptionRequest $request, ExceptionLog $exceptionLog)
    {
        $exceptionLog->update([
            'status' => 'resolved',
            'resolved_by' => auth()->id(),
            'resolved_at' => now(),
        ]);

        return redirect()->back()->with('success', '异常已解决');
    }

    public function retry(ExceptionLog $exceptionLog)
    {
        $exceptionLog->increment('retry_count');

        return redirect()->back()->with('success', '已重新尝试处理异常');
    }
}
