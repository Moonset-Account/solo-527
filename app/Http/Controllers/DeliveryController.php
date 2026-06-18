<?php

namespace App\Http\Controllers;

use App\Enums\ConfigKey;
use App\Models\DeliveryConfirmation;
use App\Models\PurchaseRequest;
use App\Models\Supply;
use App\Services\ConfigService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeliveryController extends Controller
{
    public function __construct(protected ConfigService $configService) {}

    public function index(Request $request)
    {
        $deliveries = DeliveryConfirmation::with(['purchaseRequest', 'items.supply', 'confirmedBy'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(15);

        $pendingCount = PurchaseRequest::where('status', 'approved')
            ->whereDoesntHave('deliveryConfirmations')
            ->count();

        return Inertia::render('Delivery/Index', [
            'deliveries' => $deliveries,
            'pending_count' => $pendingCount,
            'filters' => $request->only(['status']),
            'confirmation_enabled' => $this->configService->getBoolean(ConfigKey::DELIVERY_CONFIRMATION_ENABLED->value, true),
        ]);
    }

    public function show(DeliveryConfirmation $deliveryConfirmation)
    {
        $deliveryConfirmation->load([
            'purchaseRequest.requester',
            'items.supply',
            'confirmedBy',
            'discrepancies',
        ]);

        return Inertia::render('Delivery/Show', [
            'delivery' => $deliveryConfirmation,
        ]);
    }

    public function confirm(Request $request, PurchaseRequest $purchaseRequest)
    {
        $validated = $request->validate([
            'delivery_date' => ['required', 'date'],
            'items' => ['required', 'array'],
            'items.*.supply_id' => ['required', 'exists:supplies,id'],
            'items.*.expected_quantity' => ['required', 'numeric', 'min:0'],
            'items.*.actual_quantity' => ['required', 'numeric', 'min:0'],
            'items.*.note' => ['nullable', 'string', 'max:500'],
            'note' => ['nullable', 'string', 'max:2000'],
            'attachments' => ['nullable', 'array'],
        ]);

        $confirmation = DeliveryConfirmation::create([
            'purchase_request_id' => $purchaseRequest->id,
            'delivery_date' => $validated['delivery_date'],
            'confirmed_by' => auth()->id(),
            'note' => $validated['note'] ?? null,
            'status' => 'confirmed',
        ]);

        $hasDiscrepancy = false;
        foreach ($validated['items'] as $item) {
            $diff = $item['actual_quantity'] - $item['expected_quantity'];
            $itemHasDiff = $diff != 0;
            if ($itemHasDiff) {
                $hasDiscrepancy = true;
            }

            $confirmation->items()->create([
                'supply_id' => $item['supply_id'],
                'expected_quantity' => $item['expected_quantity'],
                'actual_quantity' => $item['actual_quantity'],
                'difference' => $diff,
                'has_discrepancy' => $itemHasDiff,
                'note' => $item['note'] ?? null,
            ]);

            $supply = Supply::find($item['supply_id']);
            if ($supply) {
                $supply->increment('stock_quantity', $item['actual_quantity']);
            }
        }

        $confirmation->update(['has_discrepancy' => $hasDiscrepancy]);

        if ($hasDiscrepancy) {
            $purchaseRequest->update(['status' => 'delivered_with_discrepancy']);
        } else {
            $purchaseRequest->update(['status' => 'completed']);
        }

        activity()
            ->performedOn($confirmation)
            ->causedBy(auth()->user())
            ->withProperties(['purchase_request_id' => $purchaseRequest->id])
            ->log('delivery confirmed');

        return redirect()->route('deliveries.show', $confirmation)->with('success', '到货确认完成');
    }
}
