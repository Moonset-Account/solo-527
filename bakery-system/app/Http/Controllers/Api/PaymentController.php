<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with(['order', 'processedBy']);

        if ($request->filled('order_id')) {
            $query->where('order_id', $request->order_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('method')) {
            $query->where('method', $request->method);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }

        $payments = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json($payments);
    }

    public function show(Payment $payment)
    {
        return response()->json($payment->load('order.items.product', 'processedBy', 'refunds'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|in:deposit,balance,full',
            'method' => 'required|in:cash,wechat,alipay,bank_transfer,other',
            'transaction_id' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $order = Order::findOrFail($request->order_id);

        $totalPaid = $order->payments()
            ->where('status', Payment::STATUS_COMPLETED)
            ->sum('amount');

        $totalRefunded = $order->refunds()
            ->where('status', 'completed')
            ->sum('amount');

        $netPaid = $totalPaid - $totalRefunded;
        $remaining = max(0, $order->total_amount - $netPaid);

        if ($remaining <= 0) {
            return response()->json(['message' => '订单款项已付清，无需重复收款'], 422);
        }

        if ($request->amount > $remaining) {
            return response()->json(['message' => "收款金额超过剩余应付款 {$remaining} 元"], 422);
        }

        $depositPaidNet = max(0, $netPaid);
        $depositDeficit = max(0, $order->deposit_amount - $depositPaidNet);

        if ($request->type === 'deposit') {
            if ($depositDeficit <= 0) {
                return response()->json(['message' => '定金已足额支付'], 422);
            }
            if ($request->amount > $depositDeficit) {
                return response()->json(['message' => "定金不足部分为 {$depositDeficit} 元"], 422);
            }
        }

        if ($request->type === 'full') {
            if ($request->amount != $remaining) {
                return response()->json(['message' => "收全款金额应为剩余应付款 {$remaining} 元"], 422);
            }
        }

        if ($request->type === 'balance') {
            if ($depositPaidNet < $order->deposit_amount) {
                return response()->json(['message' => '请先补足定金后再收尾款'], 422);
            }
            if ($request->amount > $remaining) {
                return response()->json(['message' => "尾款金额不能超过剩余应付款 {$remaining} 元"], 422);
            }
        }

        DB::beginTransaction();
        try {
            $payment = Payment::create(array_merge(
                $request->all(),
                [
                    'status' => Payment::STATUS_COMPLETED,
                    'processed_by' => $request->user()?->id,
                    'paid_at' => now(),
                ]
            ));

            $this->updateOrderPaymentStatus($order);

            DB::commit();

            return response()->json([
                'message' => '支付记录创建成功',
                'payment' => $payment->load('order'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function update(Request $request, Payment $payment)
    {
        $request->validate([
            'transaction_id' => 'nullable|string|max:255',
            'method' => 'in:cash,wechat,alipay,bank_transfer,other',
            'status' => 'in:pending,completed,failed,refunded',
            'notes' => 'nullable|string',
        ]);

        $payment->update($request->all());

        return response()->json([
            'message' => '支付记录更新成功',
            'payment' => $payment,
        ]);
    }

    public function destroy(Payment $payment)
    {
        if ($payment->status === Payment::STATUS_COMPLETED) {
            return response()->json(['message' => '已完成的支付记录无法删除'], 422);
        }

        $payment->delete();

        return response()->json(['message' => '支付记录已删除']);
    }

    protected function updateOrderPaymentStatus(Order $order)
    {
        $totalPaid = $order->payments()
            ->where('status', Payment::STATUS_COMPLETED)
            ->sum('amount');

        $refundedAmount = $order->refunds()
            ->where('status', 'completed')
            ->sum('amount');

        $netPaid = $totalPaid - $refundedAmount;

        if ($netPaid <= 0 && $refundedAmount > 0) {
            $order->payment_status = Order::PAYMENT_FULL_REFUND;
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
