<?php

namespace App\Http\Controllers;

use App\Http\Requests\Supplier\StoreSupplierRequest;
use App\Http\Requests\Supplier\UpdateSupplierRequest;
use App\Models\Supplier;
use App\Services\SupplierRiskService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function __construct(protected SupplierRiskService $riskService) {}

    public function index(Request $request)
    {
        $suppliers = Supplier::withCount(['quotations', 'riskLogs'])
            ->when($request->risk_level, fn ($q) => $q->where('risk_level', $request->risk_level))
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('code', 'like', "%{$request->search}%"))
            ->latest()
            ->paginate(15);

        $riskStats = $this->riskService->getSupplierRiskStats();

        return Inertia::render('Suppliers/Index', [
            'suppliers' => $suppliers,
            'risk_stats' => $riskStats,
            'filters' => $request->only(['risk_level', 'search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Suppliers/Create');
    }

    public function store(StoreSupplierRequest $request)
    {
        $supplier = Supplier::create($request->validated());

        $this->riskService->assessSupplierRisk($supplier);

        activity()
            ->performedOn($supplier)
            ->causedBy(auth()->user())
            ->log('created');

        return redirect()->route('suppliers.show', $supplier)->with('success', '供应商创建成功');
    }

    public function show(Supplier $supplier)
    {
        $supplier->load(['riskLogs' => function ($q) {
            $q->latest()->limit(10);
        }, 'quotations' => function ($q) {
            $q->latest()->limit(10);
        }]);

        $riskAnalysis = $this->riskService->getDetailedRiskAnalysis($supplier);

        return Inertia::render('Suppliers/Show', [
            'supplier' => $supplier,
            'risk_analysis' => $riskAnalysis,
        ]);
    }

    public function edit(Supplier $supplier)
    {
        return Inertia::render('Suppliers/Edit', [
            'supplier' => $supplier,
        ]);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier)
    {
        $supplier->update($request->validated());

        $this->riskService->assessSupplierRisk($supplier);

        activity()
            ->performedOn($supplier)
            ->causedBy(auth()->user())
            ->withProperties(['changes' => $supplier->getChanges()])
            ->log('updated');

        return redirect()->route('suppliers.show', $supplier)->with('success', '供应商更新成功');
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();

        activity()
            ->performedOn($supplier)
            ->causedBy(auth()->user())
            ->log('deleted');

        return redirect()->route('suppliers.index')->with('success', '供应商已删除');
    }

    public function riskAnalysis(Supplier $supplier)
    {
        $analysis = $this->riskService->getDetailedRiskAnalysis($supplier);

        return Inertia::render('Suppliers/RiskAnalysis', [
            'supplier' => $supplier,
            'analysis' => $analysis,
        ]);
    }
}
