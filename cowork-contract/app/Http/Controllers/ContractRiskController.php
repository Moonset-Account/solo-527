<?php

namespace App\Http\Controllers;

use App\Http\Requests\CloseRiskRequest;
use App\Models\ContractRisk;
use App\Services\OperationLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ContractRiskController extends Controller
{
    public function __construct(private OperationLogService $logService) {}

    public function index(): Response|JsonResponse
    {
        $query = ContractRisk::with(['contract.property', 'assignedTo', 'resolvedBy']);

        if (request()->filled('status')) {
            $query->where('status', request()->input('status'));
        } else {
            $query->where('status', 'open');
        }

        if (request()->filled('severity')) {
            $query->where('severity', request()->input('severity'));
        }

        if (request()->filled('risk_type')) {
            $query->where('risk_type', request()->input('risk_type'));
        }

        $risks = $query->orderByDesc('id')->paginate(request()->input('per_page', 15));

        if (request()->expectsJson() || request()->is('api/*')) {
            return response()->json([
                'data' => $risks->items(),
                'meta' => [
                    'total' => $risks->total(),
                    'per_page' => $risks->perPage(),
                    'current_page' => $risks->currentPage(),
                    'last_page' => $risks->lastPage(),
                    'open_count' => ContractRisk::where('status', 'open')->count(),
                ],
            ]);
        }

        return Inertia::render('Risks/Index', [
            'risks' => $risks,
            'filters' => request()->only(['status', 'severity', 'risk_type']),
        ]);
    }

    public function store(): RedirectResponse|JsonResponse
    {
        $data = request()->validate([
            'contract_id' => 'required|exists:contracts,id',
            'risk_type' => 'required|string',
            'severity' => 'required|in:low,medium,high',
            'description' => 'required|string',
        ]);

        $risk = ContractRisk::create($data);

        $this->logService->log(
            request()->user(),
            'create_risk',
            ContractRisk::class,
            $risk->id,
            $data
        );

        if (request()->expectsJson() || request()->is('api/*')) {
            return response()->json([
                'message' => '风险记录已创建',
                'risk' => $risk->load(['contract.property', 'assignedTo', 'resolvedBy']),
            ], 201);
        }

        return redirect()->route('risks.index')
            ->with('success', '风险记录已创建');
    }

    public function assign(ContractRisk $risk): RedirectResponse|JsonResponse
    {
        $data = request()->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $risk->update($data);

        $this->logService->log(
            request()->user(),
            'assign_risk',
            ContractRisk::class,
            $risk->id,
            $data
        );

        if (request()->expectsJson() || request()->is('api/*')) {
            return response()->json([
                'message' => '风险已分配',
                'risk' => $risk->load(['contract.property', 'assignedTo', 'resolvedBy']),
            ]);
        }

        return redirect()->route('risks.index')
            ->with('success', '风险已分配');
    }

    public function close(CloseRiskRequest $request, ContractRisk $risk): RedirectResponse|JsonResponse
    {
        if (!$request->user()->isConsultant()) {
            if (request()->expectsJson() || request()->is('api/*')) {
                return response()->json(['message' => '仅招商顾问可关闭风险'], 403);
            }
            abort(403, '仅招商顾问可关闭风险');
        }

        $risk->update([
            'status' => 'closed',
            'close_remark' => $request->input('close_remark'),
            'resolved_by' => $request->user()->id,
            'resolved_at' => now(),
        ]);

        $this->logService->log(
            $request->user(),
            'close_risk',
            ContractRisk::class,
            $risk->id,
            ['close_remark' => $request->input('close_remark')]
        );

        if (request()->expectsJson() || request()->is('api/*')) {
            return response()->json([
                'message' => '风险已关闭',
                'risk' => $risk->load(['contract.property', 'assignedTo', 'resolvedBy']),
            ]);
        }

        return redirect()->route('risks.index')
            ->with('success', '风险已关闭');
    }
}
