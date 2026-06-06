<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Debt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use App\Models\AuditTrail;

class DebtController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('debt.view');

        $query = Debt::with('customer', 'order')
            ->when($request->keyword, function ($q) use ($request) {
                $q->where('debt_no', 'like', "%{$request->keyword}%")
                    ->orWhereHas('customer', function ($subQ) use ($request) {
                        $subQ->where('name', 'like', "%{$request->keyword}%");
                    });
            })
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->customer_id, fn($q) => $q->where('customer_id', $request->customer_id))
            ->when($request->is_overdue, function ($q) {
                $q->where('due_date', '<', now())->whereIn('status', ['pending', 'partial']);
            })
            ->orderBy('created_at', 'desc');

        return response()->json([
            'data' => $query->paginate($request->per_page ?? 20),
        ]);
    }

    public function show(Debt $debt)
    {
        Gate::authorize('debt.view');

        return response()->json([
            'data' => $debt->load('customer', 'order', 'payments.cashier'),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('debt.create');

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'order_id' => 'nullable|exists:orders,id',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'remarks' => 'nullable|string',
        ]);

        $validated['debt_no'] = 'DBT' . date('YmdHis') . rand(100, 999);
        $validated['remaining_amount'] = $validated['amount'];
        $validated['status'] = Debt::STATUS_PENDING;

        $debt = DB::transaction(function () use ($validated) {
            $debt = Debt::create($validated);

            $customer = $debt->customer;
            $customer->increment('current_debt', $validated['amount']);

            return $debt;
        });

        AuditTrail::log(AuditTrail::ACTION_CREATE, 'debts', $debt->id, null, $debt->toArray());

        return response()->json([
            'message' => '欠款记录创建成功',
            'data' => $debt,
        ], 201);
    }

    public function addPayment(Request $request, Debt $debt)
    {
        Gate::authorize('debt.payment');

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,bank,transfer,wechat,alipay,other',
            'payment_date' => 'nullable|date',
            'transaction_no' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        if ($validated['amount'] > $debt->remaining_amount) {
            return response()->json([
                'message' => '还款金额不能超过剩余欠款',
            ], 422);
        }

        $payment = DB::transaction(function () use ($debt, $validated, $request) {
            $payment = $debt->payments()->create([
                'payment_no' => 'PAY' . date('YmdHis') . rand(100, 999),
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'payment_date' => $validated['payment_date'] ?? now(),
                'transaction_no' => $validated['transaction_no'] ?? null,
                'remarks' => $validated['remarks'] ?? null,
                'cashier_id' => $request->user()->id,
            ]);

            $debt->decrement('remaining_amount', $validated['amount']);
            $debt->customer->decrement('current_debt', $validated['amount']);

            if ($debt->remaining_amount <= 0) {
                $debt->update(['status' => Debt::STATUS_PAID, 'paid_at' => now()]);
            } elseif ($debt->remaining_amount < $debt->amount) {
                $debt->update(['status' => Debt::STATUS_PARTIAL]);
            }

            return $payment;
        });

        AuditTrail::log(AuditTrail::ACTION_UPDATE, 'debts', $debt->id, null, $payment->toArray());

        return response()->json([
            'message' => '还款成功',
            'data' => $payment,
        ]);
    }

    public function update(Request $request, Debt $debt)
    {
        Gate::authorize('debt.edit');

        $validated = $request->validate([
            'due_date' => 'nullable|date',
            'remarks' => 'nullable|string',
        ]);

        $oldValues = $debt->toArray();
        $debt->update($validated);

        AuditTrail::log(AuditTrail::ACTION_UPDATE, 'debts', $debt->id, $oldValues, $debt->toArray());

        return response()->json([
            'message' => '欠款记录更新成功',
            'data' => $debt,
        ]);
    }
}
