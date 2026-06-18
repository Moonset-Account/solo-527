<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Supply\StoreSupplyRequest;
use App\Http\Requests\Supply\UpdateSupplyRequest;
use App\Models\Supply;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplyApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $supplies = Supply::with(['category', 'specAttachments', 'monthlyUsages'])
            ->when($request->category_id, fn ($q) => $q->where('category_id', $request->category_id))
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->paginate($request->per_page ?? 20);

        return response()->json($supplies);
    }

    public function store(StoreSupplyRequest $request): JsonResponse
    {
        $supply = Supply::create($request->validated());

        return response()->json($supply->load(['category']), 201);
    }

    public function show(Supply $supply): JsonResponse
    {
        return response()->json($supply->load(['category', 'specAttachments', 'monthlyUsages', 'priceHistories']));
    }

    public function update(UpdateSupplyRequest $request, Supply $supply): JsonResponse
    {
        $supply->update($request->validated());

        return response()->json($supply->fresh(['category']));
    }

    public function destroy(Supply $supply): JsonResponse
    {
        $supply->delete();

        return response()->json(null, 204);
    }
}
