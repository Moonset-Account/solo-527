<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\PickingList;
use App\Models\PickingItem;
use App\Models\Order;
use App\Services\PickingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PickingController extends Controller
{
    protected $pickingService;

    public function __construct(PickingService $pickingService)
    {
        $this->pickingService = $pickingService;
    }

    public function index(Request $request)
    {
        Gate::authorize('picking.view');

        $query = PickingList::with(['order.customer', 'picker', 'items.product', 'items.location'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->picker_id, fn($q) => $q->where('picker_id', $request->picker_id))
            ->when($request->order_id, fn($q) => $q->where('order_id', $request->order_id))
            ->when($request->start_date, fn($q) => $q->where('created_at', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->where('created_at', '<=', $request->end_date . ' 23:59:59'))
            ->when($request->is_timeout, fn($q) => $q->where('created_at', '<', now()->subHours(24))->whereIn('status', ['pending', 'picking']))
            ->orderBy('created_at', 'desc');

        return response()->json([
            'data' => $query->paginate($request->per_page ?? 20),
        ]);
    }

    public function show(PickingList $pickingList)
    {
        Gate::authorize('picking.view');

        return response()->json([
            'data' => $pickingList->load(['order.customer', 'picker', 'items.product', 'items.location', 'items.orderItem', 'scans']),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('picking.create');

        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'picker_id' => 'nullable|exists:users,id',
        ]);

        try {
            $order = Order::findOrFail($validated['order_id']);
            $pickingList = $this->pickingService->createPickingList($order, $validated['picker_id'] ?? null);

            return response()->json([
                'message' => '拣货单创建成功',
                'data' => $pickingList,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => '创建失败',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function start(PickingList $pickingList, Request $request)
    {
        Gate::authorize('picking.execute');

        $validated = $request->validate([
            'picker_id' => 'required|exists:users,id',
        ]);

        try {
            $pickingList = $this->pickingService->startPicking($pickingList, $validated['picker_id']);

            return response()->json([
                'message' => '开始拣货',
                'data' => $pickingList,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => '操作失败',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function scan(PickingItem $pickingItem, Request $request)
    {
        Gate::authorize('picking.scan');

        $validated = $request->validate([
            'barcode' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'picker_id' => 'required|exists:users,id',
        ]);

        try {
            $pickingItem = $this->pickingService->scanPickItem(
                $pickingItem,
                $validated['barcode'],
                $validated['quantity'],
                $validated['picker_id']
            );

            return response()->json([
                'message' => '拣货扫描成功',
                'data' => $pickingItem->load('pickingList'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => '扫描失败',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function skip(PickingItem $pickingItem, Request $request)
    {
        Gate::authorize('picking.execute');

        $validated = $request->validate([
            'reason' => 'required|string',
            'picker_id' => 'required|exists:users,id',
        ]);

        try {
            $pickingItem = $this->pickingService->skipPickItem(
                $pickingItem,
                $validated['reason'],
                $validated['picker_id']
            );

            return response()->json([
                'message' => '已跳过',
                'data' => $pickingItem,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => '操作失败',
                'error' => $e->getMessage(),
            ], 400);
        }
    }
}
