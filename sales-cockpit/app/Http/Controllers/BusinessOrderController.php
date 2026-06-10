<?php

namespace App\Http\Controllers;

use App\Models\BusinessOrder;
use App\Services\AuditService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BusinessOrderController extends Controller
{
    public function index()
    {
        if (!request()->user()->hasPermission('business_order.view')) {
            abort(403);
        }

        $query = BusinessOrder::with(['handler', 'creator', 'alertRules', 'dimensions', 'datasetPermissions']);

        if ($status = request('status')) {
            $query->where('status', $status);
        }

        $orders = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('BusinessOrders/Index', [
            'orders' => $orders,
            'filters' => request()->only(['status']),
        ]);
    }

    public function store()
    {
        if (!request()->user()->hasPermission('business_order.create')) {
            abort(403);
        }

        $validated = request()->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
        ]);

        $order = DB::transaction(function () use ($validated) {
            $orderNo = $this->generateOrderNo();

            $order = BusinessOrder::create([
                'order_no' => $orderNo,
                'title' => $validated['title'],
                'description' => $validated['description'],
                'status' => 'pending',
                'created_by' => Auth::id(),
            ]);

            app(AuditService::class)->log(
                'create',
                'business_order',
                $order->id,
                null,
                $order->toArray(),
            );

            return $order;
        });

        return redirect()->back()->with('message', '业务工单创建成功');
    }

    public function show(BusinessOrder $businessOrder)
    {
        if (!request()->user()->hasPermission('business_order.view')) {
            abort(403);
        }

        $businessOrder->load([
            'alertRules.indicator',
            'dimensions',
            'datasetPermissions.user',
            'handler',
            'creator',
        ]);

        return Inertia::render('BusinessOrders/Show', [
            'order' => $businessOrder,
        ]);
    }

    public function handle(BusinessOrder $businessOrder)
    {
        if (!request()->user()->hasPermission('business_order.handle')) {
            abort(403);
        }

        $validated = request()->validate([
            'remarks' => ['nullable', 'string'],
        ]);

        $oldValues = $businessOrder->toArray();

        DB::transaction(function () use ($businessOrder, $validated, $oldValues) {
            $businessOrder->update([
                'handler_id' => Auth::id(),
                'handled_at' => now(),
                'status' => 'processing',
                'remarks' => $validated['remarks'] ?? $businessOrder->remarks,
            ]);

            app(AuditService::class)->log(
                'handle',
                'business_order',
                $businessOrder->id,
                $oldValues,
                $businessOrder->fresh()->toArray(),
            );
        });

        return redirect()->back()->with('message', '工单已受理');
    }

    public function close(BusinessOrder $businessOrder)
    {
        if (!request()->user()->hasPermission('business_order.close')) {
            abort(403);
        }

        $validated = request()->validate([
            'remarks' => ['nullable', 'string'],
        ]);

        $oldValues = $businessOrder->toArray();

        DB::transaction(function () use ($businessOrder, $validated, $oldValues) {
            $businessOrder->update([
                'status' => 'closed',
                'remarks' => $validated['remarks'] ?? $businessOrder->remarks,
            ]);

            app(AuditService::class)->log(
                'close',
                'business_order',
                $businessOrder->id,
                $oldValues,
                $businessOrder->fresh()->toArray(),
            );
        });

        return redirect()->back()->with('message', '工单已关闭');
    }

    private function generateOrderNo(): string
    {
        $date = now()->format('Ymd');
        $lastOrder = BusinessOrder::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastOrder
            ? (int) substr($lastOrder->order_no, -4) + 1
            : 1;

        return 'BO-' . $date . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
