<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PickupSlot;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\IngredientStock;
use App\Models\ProductionSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['pickupSlot', 'items.product', 'customer']);

        if ($request->user()->isCustomer()) {
            $query->where('customer_id', $request->user()->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('pickup_date')) {
            $query->whereHas('pickupSlot', function ($q) use ($request) {
                $q->where('date', $request->pickup_date);
            });
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('order_number', 'like', '%' . $request->search . '%')
                    ->orWhere('customer_name', 'like', '%' . $request->search . '%')
                    ->orWhere('customer_phone', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }

        $orders = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($orders);
    }

    public function show(Order $order)
    {
        $this->checkOrderPermission($order);

        return response()->json($order->load([
            'items.product',
            'pickupSlot',
            'payments',
            'refunds',
            'productionSchedules.assignedTo',
            'customer',
            'assignedTo',
        ]));
    }

    public function store(Request $request)
    {
        $request->validate([
            'pickup_slot_id' => 'required|exists:pickup_slots,id',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'customer_email' => 'nullable|email',
            'special_notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.customization' => 'nullable|string',
        ]);

        $pickupSlot = PickupSlot::findOrFail($request->pickup_slot_id);

        if ($pickupSlot->is_full) {
            throw ValidationException::withMessages([
                'pickup_slot_id' => ['该取货时段已满，请选择其他时段。'],
            ]);
        }

        DB::beginTransaction();
        try {
            $totalAmount = 0;
            $totalDeposit = 0;
            $orderItems = [];

            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);
                $subtotal = $product->price * $item['quantity'];
                $totalAmount += $subtotal;
                $totalDeposit += $product->deposit * $item['quantity'];

                $orderItems[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->price,
                    'subtotal' => $subtotal,
                    'customization' => $item['customization'] ?? null,
                ];
            }

            $order = Order::create([
                'customer_id' => $request->user()?->id,
                'pickup_slot_id' => $request->pickup_slot_id,
                'customer_name' => $request->customer_name,
                'customer_phone' => $request->customer_phone,
                'customer_email' => $request->customer_email,
                'special_notes' => $request->special_notes,
                'total_amount' => $totalAmount,
                'deposit_amount' => $totalDeposit,
                'balance_amount' => $totalAmount - $totalDeposit,
                'status' => Order::STATUS_PENDING,
                'payment_status' => Order::PAYMENT_UNPAID,
                'created_by' => $request->user()?->id,
            ]);

            foreach ($orderItems as $item) {
                $order->items()->create($item);
            }

            $pickupSlot->increment('current_orders');

            DB::commit();

            return response()->json([
                'message' => '订单创建成功',
                'order' => $order->load('items.product'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function update(Request $request, Order $order)
    {
        $this->checkOrderPermission($order);

        $request->validate([
            'customer_name' => 'string|max:255',
            'customer_phone' => 'string|max:20',
            'customer_email' => 'nullable|email',
            'special_notes' => 'nullable|string',
            'status' => 'in:pending,confirmed,in_production,ready,picked_up,cancelled,refunded',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $order->update($request->only([
            'customer_name',
            'customer_phone',
            'customer_email',
            'special_notes',
            'status',
            'assigned_to',
        ]));

        return response()->json([
            'message' => '订单更新成功',
            'order' => $order,
        ]);
    }

    public function confirm(Request $request, Order $order)
    {
        if ($order->status !== Order::STATUS_PENDING) {
            return response()->json(['message' => '订单状态不允许确认'], 400);
        }

        $order->update(['status' => Order::STATUS_CONFIRMED]);

        return response()->json([
            'message' => '订单已确认',
            'order' => $order,
        ]);
    }

    public function cancel(Request $request, Order $order)
    {
        $this->checkOrderPermission($order);

        if (!$order->canCancel()) {
            return response()->json(['message' => '订单状态不允许取消'], 400);
        }

        DB::beginTransaction();
        try {
            $order->update(['status' => Order::STATUS_CANCELLED]);

            $order->pickupSlot->decrement('current_orders');

            DB::commit();

            return response()->json([
                'message' => '订单已取消',
                'order' => $order,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function startProduction(Request $request, Order $order)
    {
        if (!$order->canStartProduction()) {
            return response()->json(['message' => '订单无法开始生产，请确认定金已支付'], 400);
        }

        DB::beginTransaction();
        try {
            $order->update(['status' => Order::STATUS_IN_PRODUCTION]);

            foreach ($order->items as $item) {
                $product = $item->product;
                $recipe = $product->recipes()->first();

                if ($recipe) {
                    foreach ($recipe->recipeIngredients as $recipeIngredient) {
                        $quantityNeeded = $recipeIngredient->quantity * $item->quantity;

                        $stocks = IngredientStock::where('ingredient_id', $recipeIngredient->ingredient_id)
                            ->where('quantity', '>', 0)
                            ->orderBy('expiry_date', 'asc')
                            ->get();

                        $remaining = $quantityNeeded;
                        foreach ($stocks as $stock) {
                            if ($remaining <= 0) break;

                            $deduct = min($stock->quantity, $remaining);
                            $stock->decrement('quantity', $deduct);
                            $remaining -= $deduct;

                            StockMovement::create([
                                'ingredient_id' => $recipeIngredient->ingredient_id,
                                'ingredient_stock_id' => $stock->id,
                                'order_id' => $order->id,
                                'quantity' => -$deduct,
                                'type' => StockMovement::TYPE_OUT,
                                'reason' => "生产订单 {$order->order_number}",
                                'created_by' => $request->user()?->id,
                            ]);
                        }
                    }
                }

                ProductionSchedule::create([
                    'order_id' => $order->id,
                    'order_item_id' => $item->id,
                    'assigned_to' => $request->assigned_to ?? null,
                    'status' => ProductionSchedule::STATUS_PENDING,
                    'scheduled_at' => now(),
                    'priority' => 0,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => '生产已开始，库存已扣减',
                'order' => $order->load('productionSchedules'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function markReady(Request $request, Order $order)
    {
        if ($order->status !== Order::STATUS_IN_PRODUCTION) {
            return response()->json(['message' => '订单状态不允许标记为就绪'], 400);
        }

        $order->update(['status' => Order::STATUS_READY]);

        ProductionSchedule::where('order_id', $order->id)
            ->update([
                'status' => ProductionSchedule::STATUS_COMPLETED,
                'completed_at' => now(),
            ]);

        return response()->json([
            'message' => '订单已就绪',
            'order' => $order,
        ]);
    }

    public function pickup(Request $request, Order $order)
    {
        if (!$order->canPickup()) {
            return response()->json(['message' => '订单无法取货，请确认款项已付清且商品已就绪'], 400);
        }

        $order->update([
            'status' => Order::STATUS_PICKED_UP,
            'picked_up_at' => now(),
        ]);

        return response()->json([
            'message' => '取货核销成功',
            'order' => $order,
        ]);
    }

    protected function checkOrderPermission(Order $order)
    {
        $user = request()->user();

        if ($user->isCustomer() && $order->customer_id !== $user->id) {
            abort(403, '无权访问此订单');
        }
    }
}
