<?php

namespace App\Http\Controllers;

use App\Models\ConsistencyCheck;
use App\Services\AuditService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ConsistencyCheckController extends Controller
{
    public function index()
    {
        if (!request()->user()->hasPermission('consistency_check.view')) {
            abort(403);
        }

        $query = ConsistencyCheck::with('indicator');

        if ($indicatorId = request('indicator_id')) {
            $query->where('indicator_id', $indicatorId);
        }

        if ($status = request('status')) {
            $query->where('status', $status);
        }

        $checks = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('ConsistencyChecks/Index', [
            'checks' => $checks,
            'filters' => request()->only(['indicator_id', 'status']),
        ]);
    }

    public function store()
    {
        if (!request()->user()->hasPermission('consistency_check.create')) {
            abort(403);
        }

        $validated = request()->validate([
            'indicator_id' => ['required', 'integer', 'exists:indicators,id'],
            'check_type' => ['required', 'string', 'max:100'],
            'expected_value' => ['required', 'numeric'],
            'actual_value' => ['required', 'numeric'],
        ]);

        $discrepancy = (float) $validated['actual_value'] - (float) $validated['expected_value'];
        $status = abs($discrepancy) < 0.0001 ? 'passed' : 'failed';

        DB::transaction(function () use ($validated, $discrepancy, $status) {
            $check = ConsistencyCheck::create([
                'indicator_id' => $validated['indicator_id'],
                'check_type' => $validated['check_type'],
                'expected_value' => $validated['expected_value'],
                'actual_value' => $validated['actual_value'],
                'discrepancy' => $discrepancy,
                'status' => $status,
                'checked_by' => Auth::id(),
                'checked_at' => now(),
            ]);

            app(AuditService::class)->log(
                'create',
                'consistency_check',
                $check->id,
                null,
                $check->toArray(),
            );
        });

        return redirect()->back()->with('message', '一致性校验创建成功');
    }

    public function show(ConsistencyCheck $consistencyCheck)
    {
        if (!request()->user()->hasPermission('consistency_check.view')) {
            abort(403);
        }

        $consistencyCheck->load('indicator');

        return Inertia::render('ConsistencyChecks/Show', [
            'check' => $consistencyCheck,
        ]);
    }
}
