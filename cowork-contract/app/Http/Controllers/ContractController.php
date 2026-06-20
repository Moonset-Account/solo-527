<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContractRequest;
use App\Http\Requests\UpdateContractRequest;
use App\Models\Contract;
use App\Services\OperationLogService;
use Inertia\Inertia;
use Inertia\Response;

class ContractController extends Controller
{
    public function __construct(private OperationLogService $logService) {}

    public function index(): Response
    {
        $query = Contract::with([
            'property.responsiblePerson',
            'deposits.operator',
            'followUps.consultant',
            'tenant',
            'consultant',
        ]);

        if (request()->filled('status')) {
            $query->where('status', request()->input('status'));
        }

        if (request()->filled('property_id')) {
            $query->where('property_id', request()->input('property_id'));
        }

        if (request()->filled('date_from')) {
            $query->where('start_date', '>=', request()->input('date_from'));
        }

        if (request()->filled('date_to')) {
            $query->where('start_date', '<=', request()->input('date_to'));
        }

        if (request()->filled('contract_no')) {
            $query->where('contract_no', 'like', '%' . request()->input('contract_no') . '%');
        }

        $contracts = $query->orderByDesc('id')->paginate(request()->input('per_page', 15));

        return Inertia::render('Contracts/Index', [
            'contracts' => $contracts,
            'filters' => request()->only(['status', 'property_id', 'date_from', 'date_to', 'contract_no']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Contracts/Create');
    }

    public function store(StoreContractRequest $request)
    {
        $contract = Contract::create($request->validated());

        $this->logService->log(
            $request->user(),
            'create_contract',
            Contract::class,
            $contract->id,
            $request->validated()
        );

        return redirect()->route('contracts.show', $contract)
            ->with('success', '合同创建成功');
    }

    public function show(Contract $contract): Response
    {
        $contract->load([
            'property.responsiblePerson',
            'deposits.operator',
            'followUps.consultant',
            'tenant',
            'consultant',
            'risks.assignedTo',
            'risks.resolvedBy',
            'attachments.uploader',
            'bills',
        ]);

        return Inertia::render('Contracts/Show', [
            'contract' => $contract,
        ]);
    }

    public function edit(Contract $contract): Response
    {
        $contract->load(['property', 'tenant', 'consultant']);

        return Inertia::render('Contracts/Edit', [
            'contract' => $contract,
        ]);
    }

    public function update(UpdateContractRequest $request, Contract $contract)
    {
        $contract->update($request->validated());

        $this->logService->log(
            $request->user(),
            'update_contract',
            Contract::class,
            $contract->id,
            $request->validated()
        );

        return redirect()->route('contracts.show', $contract)
            ->with('success', '合同更新成功');
    }

    public function destroy(Contract $contract)
    {
        $this->logService->log(
            request()->user(),
            'delete_contract',
            Contract::class,
            $contract->id,
            ['contract_no' => $contract->contract_no]
        );

        $contract->delete();

        return redirect()->route('contracts.index')
            ->with('success', '合同已删除');
    }

    public function history(Contract $contract): Response
    {
        $contract->load([
            'property.responsiblePerson',
            'deposits.operator',
            'followUps.consultant',
            'risks.assignedTo',
            'risks.resolvedBy',
        ]);

        $logs = \App\Models\OperationLog::where('subject_type', Contract::class)
            ->where('subject_id', $contract->id)
            ->with('user')
            ->orderByDesc('id')
            ->paginate(20);

        return Inertia::render('Contracts/History', [
            'contract' => $contract,
            'logs' => $logs,
        ]);
    }
}
