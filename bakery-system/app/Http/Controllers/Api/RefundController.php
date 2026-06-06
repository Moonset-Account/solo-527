<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Refund;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RefundController extends Controller
{
    public function index(Request $request)
    {
        $query = Refund::with(['order', 'payment', 'processedBy']);

        if ($request->filled('order_id')) {
            $query->where('order_id', $request->order_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }

        $refunds = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json($refunds);
    }

    public function show(Refund $refund)
    {
        return response()->json($refund->load('order.items.product', 'payment', 'processedBy'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'payment_id' => 'nullable|exists:payments,id',
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|in:full,partial,deposit',
            'method' => 'required|in:cash,wechat,alipay,bank_transfer,other',
            'reason' => 'required|string',
        ]);

        $order = Order::findOrFail($request->order_id);

        if ($order->status === Order::STATUS_REFUNDED) {
            return response()->json(['message' => '该订单已全额退款'], 422);
        }

        $totalPaid = $order->payments()
            ->where('status', 'completed')
            ->sum('amount');

        $totalRefunded = $order->refunds()
            ->where('status', Refund::STATUS_COMPLETED)
            ->sum('amount');

        if ($totalPaid <= 0) {
            return response()->json(['message' => '该订单尚无支付记录，无法退款'], 422);
        }

        $newTotalRefunded = $totalRefunded + $request->amount;
        if ($newTotalRefunded > $totalPaid) {
            return response()->json(['message' => "退款金额超过已支付金额 {$totalPaid} 元"], 422);
        }

        if ($newTotalRefunded > $order->total_amount) {
            return response()->json(['message' => '退款金额超过订单总额'], 422);
        }

        $isFullRefund = $newTotalRefunded >= $totalPaid;
        $wasFullyRefunded = $totalRefunded >= $totalPaid;

        DB::beginTransaction();
        try {
            $refund = Refund::create(array_merge(
                $request->all(),
                [
                    'status' => Refund::STATUS_COMPLETED,
                    'processed_by' => $request->user()?->id,
                    'refunded_at' => now(),
                ]
            ));

            if ($isFullRefund && !$wasFullyRefunded && $order->pickupSlot) {
                $originalStatus = $order->status;
                $shouldDecrement = !in_array($originalStatus, [
                    Order::STATUS_CANCELLED,
                    Order::STATUS_REFUNDED,
                    Order::STATUS_PICKED_UP,
                ]);
                if ($shouldDecrement && $order->pickupSlot->current_orders > 0) {
                    $order->pickupSlot->decrement('current_orders');
                }
            }

            $this->updateOrderRefundStatus($order);

            if ($request->payment_id) {
                $payment = Payment::find($request->payment_id);
                if ($payment) {
                    $payment->update(['status' => Payment::STATUS_REFUNDED]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => '退款记录创建成功',
                'refund' => $refund->load('order'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function update(Request $request, Refund $refund)
    {
        $request->validate([
            'status' => 'in:pending,completed,failed',
            'method' => 'in:cash,wechat,alipay,bank_transfer,other',
            'reason' => 'string',
        ]);

        $refund->update($request->all());

        if ($request->status === Refund::STATUS_COMPLETED && !$refund->refunded_at) {
            $refund->update(['refunded_at' => now()]);
            $this->updateOrderRefundStatus($refund->order);
        }

        return response()->json([
            'message' => '退款记录更新成功',
            'refund' => $refund,
        ]);
    }

    protected function updateOrderRefundStatus(Order $order)
    {
        $totalRefunded = $order->refunds()
            ->where('status', Refund::STATUS_COMPLETED)
            ->sum('amount');

        $totalPaid = $order->payments()
            ->where('status', 'completed')
            ->sum('amount');

        $netPaid = $totalPaid - $totalRefunded;

        if ($totalPaid > 0 && $netPaid <= 0) {
            $order->payment_status = Order::PAYMENT_FULL_REFUND;
            if (!in_array($order->status, [Order::STATUS_PICKED_UP, Order::STATUS_CANCELLED, Order::STATUS_REFUNDED])) {
                $order->status = Order::STATUS_REFUNDED;
            }
        } elseif ($netPaid >= $order->total_amount) {
            $order->payment_status = Order::PAYMENT_PAID;
        } elseif ($netPaid >= $order->deposit_amount) {
            $order->payment_status = Order::PAYMENT_DEPOSIT_PAID;
        } elseif ($netPaid > 0) {
            $order->payment_status = Order::PAYMENT_PARTIAL_REFUND;
        } else {
            $order->payment_status = Order::PAYMENT_UNPAID;
        }

        $order->save();
    }
}
