<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBillRequest;
use App\Models\Bill;
use App\Services\OperationLogService;
use Inertia\Inertia;
use Inertia\Response;

class BillController extends Controller
{
    public function __construct(private OperationLogService $logService) {}

    public function index(): Response
    {
        $query = Bill::with(['contract.property', 'contract.tenant']);

        if (request()->filled('contract_id')) {
            $query->where('contract_id', request()->input('contract_id'));
        }

        if (request()->filled('status')) {
            $query->where('status', request()->input('status'));
        }

        if (request()->filled('date_from')) {
            $query->where('due_date', '>=', request()->input('date_from'));
        }

        if (request()->filled('date_to')) {
            $query->where('due_date', '<=', request()->input('date_to'));
        }

        if (request()->filled('type')) {
            $query->where('type', request()->input('type'));
        }

        $bills = $query->orderByDesc('id')->paginate(request()->input('per_page', 15));

        return Inertia::render('Bills/Index', [
            'bills' => $bills,
            'filters' => request()->only(['contract_id', 'status', 'date_from', 'date_to', 'type']),
        ]);
    }

    public function store(StoreBillRequest $request)
    {
        $bill = Bill::create($request->validated());

        $this->logService->log(
            $request->user(),
            'create_bill',
            Bill::class,
            $bill->id,
            $request->validated()
        );

        return redirect()->route('bills.index')
            ->with('success', '账单创建成功');
    }

    public function show(Bill $bill): Response
    {
        $bill->load('contract.property', 'contract.tenant');

        return Inertia::render('Bills/Show', [
            'bill' => $bill,
        ]);
    }

    public function update(StoreBillRequest $request, Bill $bill)
    {
        $bill->update($request->validated());

        $this->logService->log(
            $request->user(),
            'update_bill',
            Bill::class,
            $bill->id,
            $request->validated()
        );

        return redirect()->route('bills.show', $bill)
            ->with('success', '账单更新成功');
    }

    public function destroy(Bill $bill)
    {
        $this->logService->log(
            request()->user(),
            'delete_bill',
            Bill::class,
            $bill->id,
            ['bill_no' => $bill->bill_no]
        );

        $bill->delete();

        return redirect()->route('bills.index')
            ->with('success', '账单已删除');
    }

    public function markAsPaid(Bill $bill)
    {
        $bill->update([
            'status' => 'paid',
            'paid_date' => now()->toDateString(),
        ]);

        $this->logService->log(
            request()->user(),
            'mark_bill_paid',
            Bill::class,
            $bill->id,
            ['bill_no' => $bill->bill_no]
        );

        return redirect()->route('bills.show', $bill)
            ->with('success', '账单已标记为已付');
    }

    public function overdue(): Response
    {
        $bills = Bill::with(['contract.property', 'contract.tenant'])
            ->where('status', 'pending')
            ->where('due_date', '<', now()->toDateString())
            ->orderBy('due_date')
            ->paginate(request()->input('per_page', 15));

        return Inertia::render('Bills/Overdue', [
            'bills' => $bills,
        ]);
    }
}
