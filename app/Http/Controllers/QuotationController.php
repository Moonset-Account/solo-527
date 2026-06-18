<?php

namespace App\Http\Controllers;

use App\Enums\ConfigKey;
use App\Enums\QuotationStatus;
use App\Http\Requests\Quotation\StoreQuotationRequest;
use App\Http\Requests\Quotation\UpdateQuotationRequest;
use App\Models\PurchaseRequest;
use App\Models\Quotation;
use App\Models\Supplier;
use App\Models\Supply;
use App\Services\ConfigService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuotationController
{
    public function __construct(
        protected ConfigService $configService,
        protected NotificationService $notificationService,
    ) {}

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
        if ($request->request_id) {
            $selectedPR = PurchaseRequest::with('items.supply')->find($request->request_id);
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

        if ($quotation->request_id) {
            $pr = PurchaseRequest::find($quotation->request_id);
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

    public function edit(Quotation $quotation)
    {
        $quotation->load(['items.supply', 'supplier', 'purchaseRequest']);
        $suppliers = Supplier::where('is_active', true)->get();
        $supplies = Supply::where('is_active', true)->get();
        $purchaseRequests = PurchaseRequest::whereIn('status', ['approved', 'in_quotation'])->get();

        return Inertia::render('Quotations/Edit', [
            'quotation' => $quotation,
            'suppliers' => $suppliers,
            'supplies' => $supplies,
            'purchase_requests' => $purchaseRequests,
        ]);
    }

    public function update(UpdateQuotationRequest $request, Quotation $quotation)
    {
        $quotation->update($request->safe()->except('items'));

        if ($request->has('items')) {
            $quotation->items()->delete();

            foreach ($request->items as $item) {
                $quotation->items()->create([
                    'purchase_request_item_id' => $item['purchase_request_item_id'] ?? null,
                    'supply_id' => $item['supply_id'],
                    'supply_name' => $item['supply_name'],
                    'specification' => $item['specification'] ?? null,
                    'unit' => $item['unit'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'] ?? null,
                    'discount_rate' => $item['discount_value'] ?? null,
                    'brand' => $item['manufacturer'] ?? null,
                    'origin' => $item['origin_country'] ?? null,
                    'delivery_days' => $item['delivery_days'] ?? null,
                    'remark' => $item['remarks'] ?? null,
                ]);
            }
        }

        activity()
            ->performedOn($quotation)
            ->causedBy(auth()->user())
            ->withProperties(['changes' => $quotation->getChanges()])
            ->log('updated');

        return redirect()->route('quotations.show', $quotation)->with('success', '报价单已更新');
    }

    public function approve(Request $request, Quotation $quotation)
    {
        $quotation->update([
            'status' => QuotationStatus::APPROVED,
            'approved_at' => now(),
        ]);

        activity()
            ->performedOn($quotation)
            ->causedBy(auth()->user())
            ->log('approved');

        if ($quotation->creator) {
            $this->notificationService->sendViaChannel(
                'quotation_approved',
                [$quotation->creator->id],
                '报价单已批准',
                "您的报价单 #{$quotation->id} 已被批准。",
                ['quotation_id' => $quotation->id]
            );
        }

        return redirect()->route('quotations.show', $quotation)->with('success', '报价单已批准');
    }

    public function reject(Request $request, Quotation $quotation)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:2000'],
        ]);

        $quotation->update([
            'status' => QuotationStatus::REJECTED,
            'rejection_reason' => $validated['reason'],
        ]);

        activity()
            ->performedOn($quotation)
            ->causedBy(auth()->user())
            ->withProperties(['reason' => $validated['reason']])
            ->log('rejected');

        if ($quotation->creator) {
            $this->notificationService->sendViaChannel(
                'quotation_rejected',
                [$quotation->creator->id],
                '报价单已拒绝',
                "您的报价单 #{$quotation->id} 已被拒绝。原因: {$validated['reason']}",
                ['quotation_id' => $quotation->id, 'reason' => $validated['reason']]
            );
        }

        return redirect()->route('quotations.show', $quotation)->with('success', '报价单已拒绝');
    }

    public function disable(Request $request, Quotation $quotation)
    {
        $quotation->update([
            'status' => QuotationStatus::EXPIRED,
        ]);

        activity()
            ->performedOn($quotation)
            ->causedBy(auth()->user())
            ->log('disabled');

        return redirect()->route('quotations.show', $quotation)->with('success', '报价单已停用');
    }
}
