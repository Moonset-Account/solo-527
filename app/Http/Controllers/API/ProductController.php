<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Models\AuditTrail;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('product.view');

        $query = Product::with('inventories.location')
            ->when($request->keyword, function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->keyword}%")
                    ->orWhere('sku', 'like', "%{$request->keyword}%")
                    ->orWhere('barcode', 'like', "%{$request->keyword}%");
            })
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->when($request->brand, fn($q) => $q->where('brand', $request->brand))
            ->when($request->is_active, fn($q) => $q->where('is_active', $request->is_active))
            ->when($request->is_low_stock, function ($q) {
                $q->whereHas('inventories', function ($subQ) {
                    $subQ->whereRaw('available_quantity <= warning_stock');
                });
            })
            ->orderBy('created_at', 'desc');

        return response()->json([
            'data' => $query->paginate($request->per_page ?? 20),
        ]);
    }

    public function show(Product $product)
    {
        Gate::authorize('product.view');

        return response()->json([
            'data' => $product->load('inventories.location', 'priceLists.customer'),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('product.create');

        $validated = $request->validate([
            'sku' => 'required|string|unique:products,sku',
            'barcode' => 'nullable|string|unique:products,barcode',
            'name' => 'required|string',
            'description' => 'nullable|string',
            'category' => 'nullable|string',
            'brand' => 'nullable|string',
            'unit' => 'nullable|string',
            'specification' => 'nullable|string',
            'cost_price' => 'nullable|numeric|min:0',
            'standard_price' => 'nullable|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'weight' => 'nullable|numeric|min:0',
            'volume' => 'nullable|numeric|min:0',
            'warning_stock' => 'nullable|integer|min:0',
            'remarks' => 'nullable|string',
        ]);

        $product = Product::create($validated);

        AuditTrail::log(AuditTrail::ACTION_CREATE, 'products', $product->id, null, $product->toArray());

        return response()->json([
            'message' => '商品创建成功',
            'data' => $product,
        ], 201);
    }

    public function update(Request $request, Product $product)
    {
        Gate::authorize('product.edit');

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'description' => 'nullable|string',
            'category' => 'nullable|string',
            'brand' => 'nullable|string',
            'unit' => 'nullable|string',
            'specification' => 'nullable|string',
            'cost_price' => 'nullable|numeric|min:0',
            'standard_price' => 'nullable|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'weight' => 'nullable|numeric|min:0',
            'volume' => 'nullable|numeric|min:0',
            'warning_stock' => 'nullable|integer|min:0',
            'remarks' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $oldValues = $product->toArray();
        $product->update($validated);

        AuditTrail::log(AuditTrail::ACTION_UPDATE, 'products', $product->id, $oldValues, $product->toArray());

        return response()->json([
            'message' => '商品更新成功',
            'data' => $product,
        ]);
    }

    public function search(Request $request)
    {
        Gate::authorize('product.view');

        $keyword = $request->keyword;
        $products = Product::where('is_active', true)
            ->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('sku', 'like', "%{$keyword}%")
                    ->orWhere('barcode', 'like', "%{$keyword}%");
            })
            ->with('inventories.location')
            ->limit(20)
            ->get();

        return response()->json([
            'data' => $products,
        ]);
    }
}
