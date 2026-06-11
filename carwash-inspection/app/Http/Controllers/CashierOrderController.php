<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCashierOrderRequest;
use App\Http\Requests\UpdateCashierOrderRequest;
use App\Models\CashierOrder;
use App\Models\WorkOrder;
use App\Traits\LogsConfigAudit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CashierOrderController extends Controller
{
    use LogsConfigAudit;

    public function index(Request $request)
    {
        $query = CashierOrder::with(['vehicle', 'serviceItem', 'workOrder', 'operator']);

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $orders = $query->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('CashierOrders/Index', [
            'orders' => $orders,
            'filters' => $request->only(['payment_status', 'date_from', 'date_to']),
        ]);
    }

    public function store(StoreCashierOrderRequest $request)
    {
        DB::transaction(function () use ($request) {
            $data = $request->validated();
            $data['order_no'] = 'CO-' . now()->format('YmdHis') . '-' . str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);
            $data['operator_id'] = Auth::id();
            $data['operator_name'] = Auth::user()->name;

            if (($data['payment_status'] ?? 'unpaid') === 'paid') {
                $data['paid_at'] = now();
            }

            $cashierOrder = CashierOrder::create($data);

            $this->logConfigCreate('cashier_order', $cashierOrder->id, $cashierOrder->toArray());

            if (!empty($data['work_order_id'])) {
                $workOrder = WorkOrder::find($data['work_order_id']);
                if ($workOrder && $cashierOrder->payment_status === 'paid') {
                    $workOrder->update([
                        'payment_status' => 'paid',
                        'paid_amount' => $cashierOrder->amount,
                        'payment_method' => $cashierOrder->payment_method,
                        'payment_paid_at' => now(),
                    ]);
                }
            }
        });

        return redirect()->route('cashier-orders.index')->with('success', 'Cashier order created.');
    }

    public function update(UpdateCashierOrderRequest $request, CashierOrder $cashierOrder)
    {
        DB::transaction(function () use ($request, $cashierOrder) {
            $oldValues = $cashierOrder->toArray();

            $data = $request->validated();

            if (isset($data['payment_status']) && $data['payment_status'] === 'paid' && $cashierOrder->payment_status !== 'paid') {
                $data['paid_at'] = now();
            }

            $cashierOrder->update($data);

            $this->logConfigUpdate('cashier_order', $cashierOrder->id, $oldValues, $cashierOrder->fresh()->toArray());

            if ($cashierOrder->work_order_id && $cashierOrder->payment_status === 'paid') {
                $workOrder = WorkOrder::find($cashierOrder->work_order_id);
                if ($workOrder) {
                    $workOrder->update([
                        'payment_status' => 'paid',
                        'paid_amount' => $cashierOrder->amount,
                        'payment_method' => $cashierOrder->payment_method,
                        'payment_paid_at' => now(),
                    ]);
                }
            }
        });

        return redirect()->route('cashier-orders.index')->with('success', 'Cashier order updated.');
    }
}
