<?php

namespace App\Http\Controllers;

use App\Models\Greenhouse;
use App\Models\Order;
use App\Models\Shipment;
use App\Models\SortingTask;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ShipmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Shipment::with(['order', 'sortingTask', 'greenhouse', 'shippedBy']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('shipment_no', 'like', "%{$search}%")
                    ->orWhere('tracking_no', 'like', "%{$search}%")
                    ->orWhere('receiver_name', 'like', "%{$search}%")
                    ->orWhere('receiver_phone', 'like', "%{$search}%")
                    ->orWhereHas('order', function ($subQ) use ($search) {
                        $subQ->where('order_no', 'like', "%{$search}%");
                    });
            });
        }

        if ($greenhouseId = $request->input('greenhouse_id')) {
            $query->where('greenhouse_id', $greenhouseId);
        }

        if ($orderId = $request->input('order_id')) {
            $query->where('order_id', $orderId);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($logisticsCompany = $request->input('logistics_company')) {
            $query->where('logistics_company', 'like', "%{$logisticsCompany}%");
        }

        if ($startDate = $request->input('start_date')) {
            $query->whereDate('shipment_date', '>=', $startDate);
        }

        if ($endDate = $request->input('end_date')) {
            $query->whereDate('shipment_date', '<=', $endDate);
        }

        $query->orderBy($request->input('sort_by', 'created_at'), $request->input('sort_direction', 'desc'));

        $shipments = $query->paginate($request->input('per_page', 15))->withQueryString();

        $shipments->getCollection()->transform(function ($item) {
            return array_merge($item->toArray(), [
                'order_no' => $item->order?->order_no,
                'logistics_provider' => $item->logistics_company,
                'shipped_at' => $item->shipment_date,
                'recipient_name' => $item->receiver_name,
                'recipient_phone' => $item->receiver_phone,
                'recipient_address' => $item->receiver_address,
                'estimated_delivery' => $item->estimated_arrival,
                'notes' => $item->remark,
            ]);
        });

        $greenhouses = Greenhouse::orderBy('name')->get(['id', 'name']);
        $orders = Order::orderBy('created_at', 'desc')->limit(100)->get(['id', 'order_no', 'customer_name']);
        $sortingTasks = SortingTask::where('status', 'completed')->orderBy('created_at', 'desc')->limit(100)->get(['id', 'task_no']);

        return Inertia::render('Shipments/Index', [
            'shipments' => $shipments,
            'greenhouses' => $greenhouses,
            'orders' => $orders,
            'sortingTasks' => $sortingTasks,
            'filters' => $request->only([
                'search', 'greenhouse_id', 'order_id', 'status',
                'logistics_company', 'start_date', 'end_date',
            ]),
        ]);
    }

    public function create()
    {
        $greenhouses = Greenhouse::orderBy('name')->get(['id', 'name']);
        $orders = Order::whereIn('status', ['processing', 'shipped'])->orderBy('created_at', 'desc')->get(['id', 'order_no', 'customer_name', 'customer_phone', 'customer_address']);
        $sortingTasks = SortingTask::where('status', 'completed')->whereDoesntHave('shipment')->orderBy('created_at', 'desc')->get(['id', 'task_no', 'order_id', 'actual_quantity']);
        $shippers = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Shipments/Create', [
            'greenhouses' => $greenhouses,
            'orders' => $orders,
            'sortingTasks' => $sortingTasks,
            'shippers' => $shippers,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'sorting_task_id' => 'nullable|exists:sorting_tasks,id',
            'greenhouse_id' => 'required|exists:greenhouses,id',
            'logistics_company' => 'required|string|max:100',
            'tracking_no' => 'nullable|string|max:100',
            'shipment_date' => 'required|date',
            'estimated_arrival' => 'nullable|date',
            'actual_arrival' => 'nullable|date',
            'receiver_name' => 'required|string|max:255',
            'receiver_phone' => 'required|string|max:20',
            'receiver_address' => 'required|string|max:500',
            'status' => 'required|string|in:pending,picked,transit,delivered,returned,cancelled',
            'weight' => 'nullable|numeric|min:0',
            'packages' => 'nullable|integer|min:1',
            'remark' => 'nullable|string|max:1000',
        ]);

        $validated['shipment_no'] = generate_no('SHP');
        $validated['shipped_by'] = Auth::id();

        $shipment = Shipment::create($validated);

        return redirect()->route('shipments.show', $shipment)->with('success', '发货单创建成功');
    }

    public function edit(Shipment $shipment)
    {
        $greenhouses = Greenhouse::orderBy('name')->get(['id', 'name']);
        $orders = Order::orderBy('created_at', 'desc')->limit(100)->get(['id', 'order_no', 'customer_name', 'customer_phone', 'customer_address']);
        $sortingTasks = SortingTask::orderBy('created_at', 'desc')->limit(100)->get(['id', 'task_no', 'order_id', 'actual_quantity']);
        $shippers = User::orderBy('name')->get(['id', 'name']);

        $data = array_merge($shipment->toArray(), [
            'logistics_provider' => $shipment->logistics_company,
            'shipped_at' => $shipment->shipment_date,
            'estimated_delivery' => $shipment->estimated_arrival,
            'recipient_name' => $shipment->receiver_name,
            'recipient_phone' => $shipment->receiver_phone,
            'recipient_address' => $shipment->receiver_address,
            'notes' => $shipment->remark,
        ]);

        return Inertia::render('Shipments/Edit', [
            'shipment' => $data,
            'greenhouses' => $greenhouses,
            'orders' => $orders,
            'sortingTasks' => $sortingTasks,
            'shippers' => $shippers,
        ]);
    }

    public function show(Shipment $shipment)
    {
        $shipment->load([
            'order',
            'sortingTask',
            'greenhouse',
            'shippedBy',
            'attachments',
            'comments' => function ($query) {
                $query->with('user')->orderBy('created_at', 'desc');
            },
            'auditLogs' => function ($query) {
                $query->with('user')->orderBy('created_at', 'desc');
            },
        ]);

        $data = array_merge($shipment->toArray(), [
            'order_no' => $shipment->order?->order_no,
            'logistics_provider' => $shipment->logistics_company,
            'shipped_at' => $shipment->shipment_date,
            'recipient_name' => $shipment->receiver_name,
            'recipient_phone' => $shipment->receiver_phone,
            'recipient_address' => $shipment->receiver_address,
            'estimated_delivery' => $shipment->estimated_arrival,
            'notes' => $shipment->remark,
        ]);

        $comments = $shipment->comments->map(fn($c) => array_merge($c->toArray(), [
            'user_name' => $c->user?->name,
        ]));

        $auditLogs = $shipment->auditLogs->map(fn($l) => array_merge($l->toArray(), [
            'user_name' => $l->user?->name,
        ]));

        return Inertia::render('Shipments/Show', [
            'shipment' => $data,
            'comments' => $comments,
            'attachments' => $shipment->attachments,
            'auditLogs' => $auditLogs,
        ]);
    }

    public function update(Request $request, Shipment $shipment)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'sorting_task_id' => 'nullable|exists:sorting_tasks,id',
            'greenhouse_id' => 'required|exists:greenhouses,id',
            'logistics_company' => 'required|string|max:100',
            'tracking_no' => 'nullable|string|max:100',
            'shipment_date' => 'required|date',
            'estimated_arrival' => 'nullable|date',
            'actual_arrival' => 'nullable|date',
            'receiver_name' => 'required|string|max:255',
            'receiver_phone' => 'required|string|max:20',
            'receiver_address' => 'required|string|max:500',
            'status' => 'required|string|in:pending,picked,transit,delivered,returned,cancelled',
            'weight' => 'nullable|numeric|min:0',
            'packages' => 'nullable|integer|min:1',
            'remark' => 'nullable|string|max:1000',
        ]);

        $shipment->update($validated);

        return redirect()->route('shipments.show', $shipment)->with('success', '发货单更新成功');
    }

    public function track(Shipment $shipment)
    {
        $shipment->load(['order', 'greenhouse', 'shippedBy']);

        $trackingEvents = [
            [
                'status' => '已发货',
                'time' => $shipment->shipment_date,
                'description' => '包裹已从发货地发出',
                'location' => $shipment->greenhouse?->location ?? '发货仓库',
            ],
        ];

        if ($shipment->status === 'transit') {
            $trackingEvents[] = [
                'status' => '运输中',
                'time' => now(),
                'description' => '包裹正在运输途中',
                'location' => '运输途中',
            ];
        }

        if ($shipment->status === 'delivered' && $shipment->actual_arrival) {
            $trackingEvents[] = [
                'status' => '已送达',
                'time' => $shipment->actual_arrival,
                'description' => '包裹已成功送达',
                'location' => $shipment->receiver_address,
            ];
        }

        return Inertia::render('Shipments/Track', [
            'shipment' => $shipment,
            'tracking_events' => $trackingEvents,
        ]);
    }
}
