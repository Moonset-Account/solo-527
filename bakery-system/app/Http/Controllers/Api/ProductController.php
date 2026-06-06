<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('flavor', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        if ($request->filled('flavor')) {
            $query->where('flavor', $request->flavor);
        }

        if ($request->filled('size')) {
            $query->where('size', $request->size);
        }

        $products = $query->orderBy('name')->paginate($request->get('per_page', 15));

        return response()->json($products);
    }

    public function show(Product $product)
    {
        return response()->json($product->load('recipes.ingredients'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'size' => 'required|string|max:50',
            'price' => 'required|numeric|min:0',
            'deposit' => 'nullable|numeric|min:0|lte:price',
            'flavor' => 'required|string|max:100',
            'is_active' => 'boolean',
            'preparation_hours' => 'integer|min:1',
            'image' => 'nullable|string',
        ]);

        $product = Product::create($request->all());

        return response()->json([
            'message' => '产品创建成功',
            'product' => $product,
        ], 201);
    }

    public function update(Request $request, Product $product)
    {
        $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'size' => 'string|max:50',
            'price' => 'numeric|min:0',
            'deposit' => 'nullable|numeric|min:0|lte:price',
            'flavor' => 'string|max:100',
            'is_active' => 'boolean',
            'preparation_hours' => 'integer|min:1',
            'image' => 'nullable|string',
        ]);

        $product->update($request->all());

        return response()->json([
            'message' => '产品更新成功',
            'product' => $product,
        ]);
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json(['message' => '产品已删除']);
    }

    public function restore($id)
    {
        $product = Product::withTrashed()->findOrFail($id);
        $product->restore();

        return response()->json([
            'message' => '产品已恢复',
            'product' => $product,
        ]);
    }

    public function flavors()
    {
        $flavors = Product::distinct()->pluck('flavor');
        return response()->json($flavors);
    }

    public function sizes()
    {
        $sizes = Product::distinct()->pluck('size');
        return response()->json($sizes);
    }
}
