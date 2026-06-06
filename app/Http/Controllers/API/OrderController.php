<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class OrderController extends Controller
{
    protected $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    public function index(Request $request)
    {
        Gate::authorize('order.view');

        $query = Order::with(['customer', 'salesperson', 'items.product'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->customer_id, fn($q) => $q->where('customer_id', $request->customer_id))
            ->when($request->salesperson_id, fn($q) => $q->where('salesperson_id', $request->salesperson_id))
            ->when($request->start_date, fn($q) => $q->where('created_at', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->where('created_at', '<=', $request->end_date . ' 23:59:59'))
            ->when($request->keyword, function ($q) use ($request) {
                $q->whereHas('customer', function ($subQ) use ($request) {
                    $subQ->where('name', 'like', "%{$request->keyword}%")
                        ->orWhere('customer_code', 'like', "%{$request->keyword}%");
                })->orWhere('order_no', 'like', "%{$request->keyword}%");
            })
            ->orderBy('created_at', 'desc');

        return response()->json([
            'data' => $query->paginate($request->per_page ?? 20),
        ]);
    }

    public function show(Order $order)
    {
        Gate::authorize('order.view');

        return response()->json([
            'data' => $order->load(['items.product', 'customer', 'salesperson', 'pickingLists.items.product', 'debts']),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('order.create');

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'salesperson_id' => 'nullable|exists:users,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.remarks' => 'nullable|string',
            'paid_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|string',
            'urgent_level' => 'nullable|integer|in:0,1,2',
            'expected_delivery_at' => 'nullable|date',
            'shipping_address' => 'nullable|string',
            'remarks' => 'nullable|string',
            'source' => 'nullable|string',
        ]);

        try {
            $result = $this->orderService->createOrder($validated);

            return response()->json([
                'message' => '订单创建成功',
                'data' => $result['order'],
                'split_warnings' => $result['split_warnings'],
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => '创建失败',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => '创建失败',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function confirm(Order $order)
    {
        Gate::authorize('order.confirm');

        try {
            $order = $this->orderService->confirmOrder($order);

            return response()->json([
                'message' => '订单确认成功',
                'data' => $order,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => '确认失败',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function cancel(Order $order, Request $request)
    {
        Gate::authorize('order.cancel');

        $validated = $request->validate([
            'reason' => 'required|string',
        ]);

        try {
            $order = $this->orderService->cancelOrder($order, $validated['reason']);

            return response()->json([
                'message' => '订单取消成功',
                'data' => $order,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => '取消失败',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function split(Order $order, Request $request)
    {
        Gate::authorize('order.split');

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.order_item_id' => 'required|exists:order_items,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            $orders = $this->orderService->splitOrder($order, $validated);

            return response()->json([
                'message' => '拆单成功',
                'data' => $orders,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => '拆单失败',
                'error' => $e->getMessage(),
            ], 400);
        }
    }
}
