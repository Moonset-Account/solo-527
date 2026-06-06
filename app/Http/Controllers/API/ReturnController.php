<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ReturnRequest;
use App\Models\ReturnItem;
use App\Services\ReturnService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ReturnController extends Controller
{
    protected $returnService;

    public function __construct(ReturnService $returnService)
    {
        $this->returnService = $returnService;
    }

    public function index(Request $request)
    {
        Gate::authorize('return.view');

        $query = ReturnRequest::with(['customer', 'order', 'creator', 'items.product'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->customer_id, fn($q) => $q->where('customer_id', $request->customer_id))
            ->when($request->order_id, fn($q) => $q->where('order_id', $request->order_id))
            ->when($request->return_type, fn($q) => $q->where('return_type', $request->return_type))
            ->when($request->start_date, fn($q) => $q->where('created_at', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->where('created_at', '<=', $request->end_date . ' 23:59:59'))
            ->orderBy('created_at', 'desc');

        return response()->json([
            'data' => $query->paginate($request->per_page ?? 20),
        ]);
    }

    public function show(ReturnRequest $returnRequest)
    {
        Gate::authorize('return.view');

        return response()->json([
            'data' => $returnRequest->load(['customer', 'order', 'creator', 'approver', 'items.product', 'items.orderItem']),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('return.create');

        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'reason' => 'nullable|string',
            'return_type' => 'required|in:quality,wrong,damage,other',
            'items' => 'required|array|min:1',
            'items.*.order_item_id' => 'required|exists:order_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.reason' => 'nullable|string',
        ]);

        try {
            $return = $this->returnService->createReturn($validated);

            return response()->json([
                'message' => '退货申请创建成功',
                'data' => $return,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => '创建失败',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function approve(ReturnRequest $returnRequest, Request $request)
    {
        Gate::authorize('return.approve');

        $validated = $request->validate([
            'remarks' => 'nullable|string',
        ]);

        try {
            $returnRequest = $this->returnService->approveReturn($returnRequest, $validated['remarks'] ?? '');

            return response()->json([
                'message' => '退货审批通过',
                'data' => $returnRequest,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => '审批失败',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function reject(ReturnRequest $returnRequest, Request $request)
    {
        Gate::authorize('return.approve');

        $validated = $request->validate([
            'reason' => 'required|string',
        ]);

        try {
            $returnRequest = $this->returnService->rejectReturn($returnRequest, $validated['reason']);

            return response()->json([
                'message' => '退货已拒绝',
                'data' => $returnRequest,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => '操作失败',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function receiveItem(ReturnItem $returnItem, Request $request)
    {
        Gate::authorize('return.receive');

        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'receiver_id' => 'required|exists:users,id',
        ]);

        try {
            $returnItem = $this->returnService->receiveReturnItem(
                $returnItem,
                $validated['quantity'],
                $validated['receiver_id']
            );

            return response()->json([
                'message' => '退货收货成功',
                'data' => $returnItem,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => '收货失败',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function restockItem(ReturnItem $returnItem, Request $request)
    {
        Gate::authorize('return.restock');

        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'location_id' => 'required|exists:locations,id',
        ]);

        try {
            $returnItem = $this->returnService->restockReturnItem(
                $returnItem,
                $validated['quantity'],
                $validated['location_id']
            );

            return response()->json([
                'message' => '退货入库成功',
                'data' => $returnItem,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => '入库失败',
                'error' => $e->getMessage(),
            ], 400);
        }
    }
}
