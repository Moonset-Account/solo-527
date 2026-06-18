<?php

namespace App\Http\Controllers;

use App\Enums\ConfigKey;
use App\Enums\PurchaseRequestStatus;
use App\Models\DeliveryConfirmation;
use App\Models\DeliveryDiscrepancy;
use App\Models\DeliveryItem;
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
        $deliveries = DeliveryConfirmation::with(['purchaseRequest', 'supplier', 'receiver', 'items.supply'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(15);

        $pendingCount = PurchaseRequest::where('status', 'approved')
            ->whereDoesntHave('deliveryConfirmations')
            ->count();

        $approvedPurchaseRequests = PurchaseRequest::where('status', 'approved')
            ->whereDoesntHave('deliveryConfirmations')
            ->with(['items.supply', 'quotations.supplier'])
            ->latest()
            ->get();

        return Inertia::render('Delivery/Index', [
            'deliveries' => $deliveries,
            'pending_count' => $pendingCount,
            'approved_purchase_requests' => $approvedPurchaseRequests,
            'filters' => $request->only(['status']),
            'confirmation_enabled' => $this->configService->getBoolean(ConfigKey::DELIVERY_CONFIRMATION_ENABLED->value, true),
        ]);
    }

    public function create(PurchaseRequest $purchaseRequest)
    {
        $purchaseRequest->load(['items.supply', 'quotations.supplier']);

        return Inertia::render('Delivery/Show', [
            'purchaseRequest' => $purchaseRequest,
            'delivery' => null,
        ]);
    }

    public function show(DeliveryConfirmation $deliveryConfirmation)
    {
        $deliveryConfirmation->load([
            'purchaseRequest.requester',
            'supplier',
            'receiver',
            'items.supply',
            'discrepancies',
        ]);

        return Inertia::render('Delivery/Show', [
            'delivery' => $deliveryConfirmation,
        ]);
    }

    public function confirm(Request $request, PurchaseRequest $purchaseRequest)
    {
        $validated = $request->validate([
            'delivery_time' => ['required', 'date'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'supplier_name' => ['required', 'string', 'max:255'],
            'delivery_no' => ['nullable', 'string', 'max:100'],
            'logistics_company' => ['nullable', 'string', 'max:100'],
            'tracking_no' => ['nullable', 'string', 'max:100'],
            'delivery_address' => ['nullable', 'string', 'max:500'],
            'inspector_name' => ['nullable', 'string', 'max:100'],
            'inspection_time' => ['nullable', 'date'],
            'inspection_result' => ['nullable', 'string', 'max:2000'],
            'remark' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array'],
            'items.*.supply_id' => ['required', 'exists:supplies,id'],
            'items.*.supply_name' => ['required', 'string', 'max:255'],
            'items.*.specification' => ['nullable', 'string', 'max:255'],
            'items.*.unit' => ['nullable', 'string', 'max:50'],
            'items.*.expected_quantity' => ['required', 'numeric', 'min:0'],
            'items.*.received_quantity' => ['required', 'numeric', 'min:0'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.batch_no' => ['nullable', 'string', 'max:100'],
            'items.*.remark' => ['nullable', 'string', 'max:500'],
        ]);

        $code = (new DeliveryConfirmation)->generateCode();

        $totalQty = collect($validated['items'])->sum('expected_quantity');
        $receivedQty = collect($validated['items'])->sum('received_quantity');
        $totalAmount = collect($validated['items'])->reduce(function ($carry, $item) {
            return $carry + ($item['received_quantity'] ?? 0) * ($item['unit_price'] ?? 0);
        }, 0);

        $hasDiscrepancy = false;
        foreach ($validated['items'] as $item) {
            if ($item['received_quantity'] != $item['expected_quantity']) {
                $hasDiscrepancy = true;
                break;
            }
        }

        $confirmation = DeliveryConfirmation::create([
            'code' => $code,
            'quotation_id' => $purchaseRequest->quotation_id ?? null,
            'request_id' => $purchaseRequest->id,
            'supplier_id' => $validated['supplier_id'],
            'supplier_name' => $validated['supplier_name'],
            'delivery_no' => $validated['delivery_no'] ?? null,
            'logistics_company' => $validated['logistics_company'] ?? null,
            'tracking_no' => $validated['tracking_no'] ?? null,
            'delivery_time' => $validated['delivery_time'],
            'receiver_id' => auth()->id(),
            'receiver_name' => auth()->user()->name,
            'delivery_address' => $validated['delivery_address'] ?? null,
            'inspector_name' => $validated['inspector_name'] ?? null,
            'inspection_time' => $validated['inspection_time'] ?? null,
            'inspection_result' => $validated['inspection_result'] ?? null,
            'status' => 'confirmed',
            'total_quantity' => $totalQty,
            'received_quantity' => $receivedQty,
            'total_amount' => $totalAmount,
            'remark' => $validated['remark'] ?? null,
            'has_discrepancy' => $hasDiscrepancy,
            'created_by' => auth()->id(),
        ]);

        foreach ($validated['items'] as $item) {
            $diff = $item['received_quantity'] - $item['expected_quantity'];

            DeliveryItem::create([
                'delivery_confirmation_id' => $confirmation->id,
                'supply_id' => $item['supply_id'],
                'supply_name' => $item['supply_name'],
                'specification' => $item['specification'] ?? null,
                'unit' => $item['unit'] ?? null,
                'expected_quantity' => $item['expected_quantity'],
                'received_quantity' => $item['received_quantity'],
                'unit_price' => $item['unit_price'] ?? null,
                'total_price' => ($item['received_quantity'] ?? 0) * ($item['unit_price'] ?? 0),
                'batch_no' => $item['batch_no'] ?? null,
                'remark' => $item['remark'] ?? null,
            ]);

            if ($diff != 0) {
                DeliveryDiscrepancy::create([
                    'delivery_id' => $confirmation->id,
                    'supply_id' => $item['supply_id'],
                    'supply_name' => $item['supply_name'],
                    'specification' => $item['specification'] ?? null,
                    'unit' => $item['unit'] ?? null,
                    'discrepancy_type' => 'quantity',
                    'expected_quantity' => $item['expected_quantity'],
                    'actual_quantity' => $item['received_quantity'],
                    'difference' => $diff,
                    'severity' => abs($diff) / max($item['expected_quantity'], 1) > 0.2 ? 'major' : 'minor',
                    'status' => 'reported',
                    'created_by' => auth()->id(),
                ]);
            }

            $supply = Supply::find($item['supply_id']);
            if ($supply) {
                $supply->increment('current_stock', $item['received_quantity']);
            }
        }

        if ($hasDiscrepancy) {
            $purchaseRequest->update(['status' => PurchaseRequestStatus::DELIVERED->value]);
        } else {
            $purchaseRequest->update(['status' => PurchaseRequestStatus::COMPLETED->value]);
        }

        activity()
            ->performedOn($confirmation)
            ->causedBy(auth()->user())
            ->withProperties(['purchase_request_id' => $purchaseRequest->id])
            ->log('delivery confirmed');

        return redirect()->route('deliveries.show', $confirmation)->with('success', '到货确认完成');
    }
}
