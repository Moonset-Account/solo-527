<?php

namespace App\Http\Controllers;

use App\Models\EnvironmentData;
use App\Models\Greenhouse;
use App\Models\Order;
use App\Models\SubsidyVoucher;
use App\Models\MachineryAppointment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $todayAnomalies = EnvironmentData::where('is_anomaly', true)
            ->whereDate('recorded_at', Carbon::today())
            ->with('greenhouse')
            ->orderBy('recorded_at', 'desc')
            ->limit(5)
            ->get();

        $pendingSubsidyVouchers = SubsidyVoucher::where('status', 'pending')
            ->with(['greenhouse', 'applicant'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $pendingMachineryAppointments = MachineryAppointment::where('status', 'pending')
            ->with(['greenhouse', 'applicant'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $query = Order::with(['greenhouse', 'createdBy', 'sortingTasks']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_no', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%")
                    ->orWhere('product_name', 'like', "%{$search}%");
            });
        }

        if ($greenhouseId = $request->input('greenhouse_id')) {
            $query->where('greenhouse_id', $greenhouseId);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($paymentStatus = $request->input('payment_status')) {
            $query->where('payment_status', $paymentStatus);
        }

        if ($startDate = $request->input('start_date')) {
            $query->whereDate('created_at', '>=', $startDate);
        }

        if ($endDate = $request->input('end_date')) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        if ($deliveryStart = $request->input('delivery_start')) {
            $query->whereDate('expected_delivery_date', '>=', $deliveryStart);
        }

        if ($deliveryEnd = $request->input('delivery_end')) {
            $query->whereDate('expected_delivery_date', '<=', $deliveryEnd);
        }

        $query->orderBy($request->input('sort_by', 'created_at'), $request->input('sort_direction', 'desc'));

        $user = Auth::user();
        $userRoleIds = $user->roles()->pluck('id')->toArray();

        $savedFilters = \App\Models\SavedFilter::where(function ($q) use ($user, $userRoleIds) {
            $q->where('user_id', $user->id)
                ->orWhere(function ($subQ) use ($userRoleIds) {
                    $subQ->where('is_public', true)
                        ->whereIn('role_id', $userRoleIds);
                });
        })
            ->where('module', 'orders')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $orders = $query->paginate($request->input('per_page', 15))->withQueryString();

        $orders->getCollection()->transform(function ($order) {
            $latestEnv = $order->greenhouse->environmentData()
                ->latest('recorded_at')
                ->first();

            $subsidyVoucher = $order->greenhouse->subsidyVouchers()
                ->latest()
                ->first();

            $machineryAppointment = $order->greenhouse->machineryAppointments()
                ->latest()
                ->first();

            return array_merge($order->toArray(), [
                'latest_temperature' => $latestEnv?->temperature ? number_format($latestEnv->temperature, 1) : null,
                'latest_humidity' => $latestEnv?->humidity ? number_format($latestEnv->humidity, 0) : null,
                'subsidy_status' => $subsidyVoucher?->status ?? 'not_applied',
                'machinery_status' => $machineryAppointment?->status ?? 'not_applied',
            ]);
        });

        $greenhouses = Greenhouse::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Orders/Index', [
            'orders' => $orders,
            'greenhouses' => $greenhouses,
            'today_anomalies' => $todayAnomalies,
            'pending_subsidy_vouchers' => $pendingSubsidyVouchers,
            'pending_machinery_appointments' => $pendingMachineryAppointments,
            'savedFilters' => $savedFilters,
            'filters' => $request->only([
                'search', 'greenhouse_id', 'status', 'payment_status',
                'start_date', 'end_date', 'delivery_start', 'delivery_end',
            ]),
        ]);
    }

    public function create()
    {
        $greenhouses = Greenhouse::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Orders/Create', [
            'greenhouses' => $greenhouses,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'greenhouse_id' => 'required|exists:greenhouses,id',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'customer_address' => 'nullable|string|max:500',
            'product_name' => 'required|string|max:255',
            'product_spec' => 'nullable|string|max:100',
            'quantity' => 'required|numeric|min:0',
            'unit' => 'nullable|string|max:20',
            'unit_price' => 'required|numeric|min:0',
            'expected_delivery_date' => 'required|date',
            'status' => 'nullable|string|in:pending,confirmed,sorting,shipped,completed,cancelled',
            'payment_status' => 'nullable|string|in:unpaid,partial,paid',
            'remark' => 'nullable|string|max:1000',
        ]);

        $validated['order_no'] = generate_no('ORD');
        $validated['unit'] = $validated['unit'] ?? 'kg';
        $validated['total_amount'] = round($validated['quantity'] * $validated['unit_price'], 2);
        $validated['status'] = $validated['status'] ?? 'pending';
        $validated['payment_status'] = $validated['payment_status'] ?? 'unpaid';
        $validated['created_by'] = Auth::id();

        $order = Order::create($validated);

        return redirect()->route('orders.show', $order)->with('success', '订单创建成功');
    }

    public function show(Order $order)
    {
        $order->load([
            'greenhouse',
            'createdBy',
            'attachments',
            'comments' => function ($query) {
                $query->with('user')->orderBy('created_at', 'desc');
            },
            'auditLogs' => function ($query) {
                $query->with('user')->orderBy('created_at', 'desc');
            },
            'sortingTasks',
            'shipments',
        ]);

        return Inertia::render('Orders/Show', [
            'order' => $order,
        ]);
    }

    public function edit(Order $order)
    {
        $greenhouses = Greenhouse::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Orders/Edit', [
            'order' => $order,
            'greenhouses' => $greenhouses,
        ]);
    }

    public function update(Request $request, Order $order)
    {
        $validated = $request->validate([
            'order_no' => 'required|string|unique:orders,order_no,' . $order->id . '|max:50',
            'greenhouse_id' => 'required|exists:greenhouses,id',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'customer_address' => 'nullable|string|max:500',
            'product_name' => 'required|string|max:255',
            'product_spec' => 'nullable|string|max:100',
            'quantity' => 'required|numeric|min:0',
            'unit' => 'nullable|string|max:20',
            'unit_price' => 'required|numeric|min:0',
            'expected_delivery_date' => 'required|date',
            'status' => 'required|string|in:pending,confirmed,sorting,shipped,completed,cancelled',
            'payment_status' => 'required|string|in:unpaid,partial,paid',
            'remark' => 'nullable|string|max:1000',
        ]);

        $validated['total_amount'] = round($validated['quantity'] * $validated['unit_price'], 2);

        $order->update($validated);

        return redirect()->route('orders.show', $order)->with('success', '订单更新成功');
    }

    public function destroy(Order $order)
    {
        $order->delete();

        return redirect()->route('orders.index')->with('success', '订单已删除');
    }
}
