<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quotation\StoreQuotationRequest;
use App\Http\Requests\Quotation\UpdateQuotationRequest;
use App\Models\Quotation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuotationApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $quotations = Quotation::with(['supplier', 'items.supply', 'createdBy', 'financialReview'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->supplier_id, fn ($q) => $q->where('supplier_id', $request->supplier_id))
            ->when($request->expiring, function ($q) {
                $q->where('status', 'active')
                    ->where('valid_until', '<=', now()->addDays(7));
            })
            ->paginate($request->per_page ?? 20);

        return response()->json($quotations);
    }

    public function store(StoreQuotationRequest $request): JsonResponse
    {
        $quotation = Quotation::create($request->safe()->except('items') + [
            'created_by' => auth()->id(),
            'valid_until' => now()->addDays($request->valid_days ?? 30),
        ]);

        if ($request->has('items')) {
            foreach ($request->items as $item) {
                $quotation->items()->create($item);
            }
        }

        return response()->json($quotation->load(['items.supply', 'supplier']), 201);
    }

    public function show(Quotation $quotation): JsonResponse
    {
        return response()->json($quotation->load(['supplier', 'items.supply', 'createdBy', 'financialReview']));
    }

    public function update(UpdateQuotationRequest $request, Quotation $quotation): JsonResponse
    {
        $quotation->update($request->validated());

        return response()->json($quotation->fresh(['items.supply']));
    }

    public function destroy(Quotation $quotation): JsonResponse
    {
        $quotation->delete();

        return response()->json(null, 204);
    }
}
