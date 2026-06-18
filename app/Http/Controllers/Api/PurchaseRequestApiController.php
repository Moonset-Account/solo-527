<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PurchaseRequest\StorePurchaseRequestRequest;
use App\Http\Requests\PurchaseRequest\UpdatePurchaseRequestRequest;
use App\Models\PurchaseRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseRequestApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $prs = PurchaseRequest::with(['requester', 'items.supply', 'approvalRecords.approver'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->requester_id, fn ($q) => $q->where('requester_id', $request->requester_id))
            ->paginate($request->per_page ?? 20);

        return response()->json($prs);
    }

    public function store(StorePurchaseRequestRequest $request): JsonResponse
    {
        $pr = PurchaseRequest::create($request->safe()->except('items'));

        if ($request->has('items')) {
            foreach ($request->items as $item) {
                $pr->items()->create($item);
            }
        }

        return response()->json($pr->load(['items.supply']), 201);
    }

    public function show(PurchaseRequest $purchaseRequest): JsonResponse
    {
        return response()->json($purchaseRequest->load(['requester', 'items.supply', 'approvalRecords.approver']));
    }

    public function update(UpdatePurchaseRequestRequest $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $purchaseRequest->update($request->validated());

        return response()->json($purchaseRequest->fresh(['items.supply']));
    }

    public function destroy(PurchaseRequest $purchaseRequest): JsonResponse
    {
        $purchaseRequest->delete();

        return response()->json(null, 204);
    }
}
