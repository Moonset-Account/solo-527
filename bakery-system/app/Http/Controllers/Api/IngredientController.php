<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IngredientController extends Controller
{
    public function index(Request $request)
    {
        $query = Ingredient::with('stocks');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        if ($request->filled('low_stock')) {
            $query->whereHas('stocks', function ($q) {
                $q->select('ingredient_id')
                    ->groupBy('ingredient_id')
                    ->havingRaw('SUM(quantity) <= alert_threshold');
            });
        }

        $ingredients = $query->orderBy('name')->paginate($request->get('per_page', 15));

        foreach ($ingredients as $ingredient) {
            $ingredient->total_stock = $ingredient->total_stock;
            $ingredient->is_low_stock = $ingredient->is_low_stock;
        }

        return response()->json($ingredients);
    }

    public function show(Ingredient $ingredient)
    {
        return response()->json($ingredient->load([
            'stocks' => function ($q) {
                $q->orderBy('expiry_date', 'asc');
            },
            'recipeIngredients.recipe.product',
            'stockMovements' => function ($q) {
                $q->latest()->limit(20);
            },
        ]));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:ingredients',
            'unit' => 'required|string|max:20',
            'unit_price' => 'nullable|numeric|min:0',
            'alert_threshold' => 'integer|min:0',
            'expiry_alert_days' => 'integer|min:0',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $ingredient = Ingredient::create($request->all());

        return response()->json([
            'message' => '原料创建成功',
            'ingredient' => $ingredient,
        ], 201);
    }

    public function update(Request $request, Ingredient $ingredient)
    {
        $request->validate([
            'name' => 'string|max:255|unique:ingredients,name,' . $ingredient->id,
            'unit' => 'string|max:20',
            'unit_price' => 'nullable|numeric|min:0',
            'alert_threshold' => 'integer|min:0',
            'expiry_alert_days' => 'integer|min:0',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $ingredient->update($request->all());

        return response()->json([
            'message' => '原料更新成功',
            'ingredient' => $ingredient,
        ]);
    }

    public function destroy(Ingredient $ingredient)
    {
        $ingredient->delete();

        return response()->json(['message' => '原料已删除']);
    }

    public function addStock(Request $request, Ingredient $ingredient)
    {
        $request->validate([
            'quantity' => 'required|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'batch_number' => 'nullable|string|max:100',
            'supplier' => 'nullable|string|max:255',
            'unit_cost' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $stock = IngredientStock::create([
                'ingredient_id' => $ingredient->id,
                'quantity' => $request->quantity,
                'expiry_date' => $request->expiry_date,
                'batch_number' => $request->batch_number,
                'supplier' => $request->supplier,
                'unit_cost' => $request->unit_cost,
            ]);

            StockMovement::create([
                'ingredient_id' => $ingredient->id,
                'ingredient_stock_id' => $stock->id,
                'quantity' => $request->quantity,
                'type' => StockMovement::TYPE_IN,
                'reason' => '入库',
                'created_by' => $request->user()?->id,
            ]);

            DB::commit();

            return response()->json([
                'message' => '库存添加成功',
                'stock' => $stock,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function getExpiringSoon(Request $request)
    {
        $days = $request->get('days', 7);

        $stocks = IngredientStock::with('ingredient')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', now()->addDays($days))
            ->where('expiry_date', '>=', now())
            ->where('quantity', '>', 0)
            ->orderBy('expiry_date', 'asc')
            ->get();

        return response()->json($stocks);
    }

    public function getLowStock()
    {
        $ingredients = Ingredient::with('stocks')
            ->where('is_active', true)
            ->get()
            ->filter(function ($ingredient) {
                return $ingredient->is_low_stock;
            })
            ->values();

        return response()->json($ingredients);
    }
}
