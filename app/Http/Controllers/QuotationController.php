<?php

namespace App\Http\Controllers;

use App\Enums\ConfigKey;
use App\Http\Requests\Quotation\StoreQuotationRequest;
use App\Models\PurchaseRequest;
use App\Models\Quotation;
use App\Models\Supplier;
use App\Models\Supply;
use App\Services\ConfigService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuotationController
{
    public function __construct(protected ConfigService $configService) {}

    public function index(Request $request)
    {
        $quotations = Quotation::with(['supplier', 'purchaseRequest', 'items.supply', 'createdBy'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->supplier_id, fn ($q) => $q->where('supplier_id', $request->supplier_id))
            ->when($request->expiring, function ($q) {
                $days = $this->configService->get(ConfigKey::QUOTATION_EXPIRY_REMINDER_DAYS->value, 7);
                $q->where('valid_until', '<=', now()->addDays($days))
                    ->where('valid_until', '>=', now())
                    ->where('status', 'active');
            })
            ->latest()
            ->paginate(15);

        $suppliers = Supplier::where('is_active', true)->get();

        return Inertia::render('Quotations/Index', [
            'quotations' => $quotations,
            'suppliers' => $suppliers,
            'filters' => $request->only(['status', 'supplier_id', 'expiring']),
        ]);
    }

    public function create(Request $request)
    {
        $suppliers = Supplier::where('is_active', true)->get();
        $supplies = Supply::where('is_active', true)->get();
        $purchaseRequests = PurchaseRequest::whereIn('status', ['approved', 'in_quotation'])->get();

        $selectedPR = null;
        if ($request->purchase_request_id) {
            $selectedPR = PurchaseRequest::with('items.supply')->find($request->purchase_request_id);
        }

        return Inertia::render('Quotations/Create', [
            'suppliers' => $suppliers,
            'supplies' => $supplies,
            'purchase_requests' => $purchaseRequests,
            'selected_purchase_request' => $selectedPR,
        ]);
    }

    public function store(StoreQuotationRequest $request)
    {
        $validDays = $request->valid_days ?? $this->configService->get(ConfigKey::QUOTATION_EXPIRY_DAYS->value, 30);

        $quotation = Quotation::create(array_merge(
            $request->safe()->except('items'),
            [
                'created_by' => auth()->id(),
                'valid_until' => now()->addDays($validDays),
                'status' => 'draft',
            ]
        ));

        $totalAmount = 0;
        foreach ($request->items as $item) {
            $subtotal = $item['quantity'] * $item['unit_price'];
            $quotation->items()->create([
                'supply_id' => $item['supply_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'subtotal' => $subtotal,
                'note' => $item['note'] ?? null,
            ]);
            $totalAmount += $subtotal;
        }

        $quotation->update(['total_amount' => $totalAmount]);

        if ($quotation->purchase_request_id) {
            $pr = PurchaseRequest::find($quotation->purchase_request_id);
            if ($pr && $pr->status === 'approved') {
                $pr->update(['status' => 'in_quotation']);
            }
        }

        return redirect()->route('quotations.show', $quotation)->with('success', '报价单已创建');
    }

    public function show(Quotation $quotation)
    {
        $quotation->load([
            'supplier',
            'purchaseRequest',
            'items.supply',
            'createdBy',
            'financialReview.reviewer',
            'expiryReminders',
        ]);

        return Inertia::render('Quotations/Show', [
            'quotation' => $quotation,
        ]);
    }

    public function expiring(Request $request)
    {
        $days = $this->configService->get(ConfigKey::QUOTATION_EXPIRY_REMINDER_DAYS->value, 7);

        $expiring = Quotation::with(['supplier', 'expiryReminders'])
            ->where('status', 'active')
            ->where('valid_until', '<=', now()->addDays($days))
            ->orderBy('valid_until')
            ->paginate(20);

        $expired = Quotation::with('supplier')
            ->where('status', 'active')
            ->where('valid_until', '<', now())
            ->orderBy('valid_until', 'desc')
            ->limit(20)
            ->get();

        return Inertia::render('Quotations/Expiring', [
            'expiring' => $expiring,
            'expired' => $expired,
            'reminder_days' => $days,
        ]);
    }
}
