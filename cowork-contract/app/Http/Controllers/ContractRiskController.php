<?php

namespace App\Http\Controllers;

use App\Http\Requests\CloseRiskRequest;
use App\Models\ContractRisk;
use App\Services\OperationLogService;
use Inertia\Inertia;
use Inertia\Response;

class ContractRiskController extends Controller
{
    public function __construct(private OperationLogService $logService) {}

    public function index(): Response
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

        return Inertia::render('Risks/Index', [
            'risks' => $risks,
            'filters' => request()->only(['status', 'severity', 'risk_type']),
        ]);
    }

    public function store()
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

        return redirect()->route('risks.index')
            ->with('success', '风险记录已创建');
    }

    public function assign(ContractRisk $risk)
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

        return redirect()->route('risks.index')
            ->with('success', '风险已分配');
    }

    public function close(CloseRiskRequest $request, ContractRisk $risk)
    {
        if (!$request->user()->isConsultant()) {
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

        return redirect()->route('risks.index')
            ->with('success', '风险已关闭');
    }
}
