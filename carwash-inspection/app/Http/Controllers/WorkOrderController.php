<?php

namespace App\Http\Controllers;

use App\Http\Requests\MarkNoShowRequest;
use App\Http\Requests\StoreWorkOrderRequest;
use App\Http\Requests\UpdateStatusRequest;
use App\Http\Requests\UpdateWorkOrderRequest;
use App\Models\InspectionTemplate;
use App\Models\NoShowRecord;
use App\Models\QualityReport;
use App\Models\ServiceItem;
use App\Models\StatusTimeline;
use App\Models\Technician;
use App\Models\Vehicle;
use App\Models\WorkOrder;
use App\Models\WorkStation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class WorkOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = WorkOrder::with(['vehicle', 'technician', 'station', 'serviceItem']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('scheduled_time', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('scheduled_time', '<=', $request->date_to);
        }

        if ($request->filled('technician_id')) {
            $query->where('technician_id', $request->technician_id);
        }

        $orders = $query->orderBy('created_at', 'desc')->paginate(15);

        return Inertia::render('WorkOrders/Index', [
            'orders' => $orders,
            'filters' => $request->only(['status', 'date_from', 'date_to', 'technician_id']),
            'technicians' => Technician::where('is_active', true)->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('WorkOrders/Create', [
            'vehicles' => Vehicle::all(),
            'technicians' => Technician::where('is_active', true)->get(),
            'stations' => WorkStation::where('is_active', true)->get(),
            'services' => ServiceItem::where('is_active', true)->get(),
            'inspection_templates' => InspectionTemplate::where('is_active', true)->get(),
        ]);
    }

    public function store(StoreWorkOrderRequest $request)
    {
        $data = $request->validated();
        $data['order_no'] = 'WO-' . now()->format('YmdHis') . '-' . str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);

        if (empty($data['total_amount'])) {
            $serviceItem = ServiceItem::find($data['service_item_id']);
            $data['total_amount'] = $serviceItem->price;
        }

        $order = WorkOrder::create($data);

        StatusTimeline::create([
            'work_order_id' => $order->id,
            'from_status' => '',
            'to_status' => 'pending',
            'handler_id' => Auth::id(),
            'handler_name' => Auth::user()->name,
            'created_at' => now(),
        ]);

        return redirect()->route('work-orders.show', $order)->with('success', 'Work order created.');
    }

    public function show(WorkOrder $workOrder)
    {
        $workOrder->load([
            'vehicle',
            'technician',
            'station',
            'serviceItem',
            'inspectionTemplate',
            'statusTimeline.handler',
            'inspections.inspector',
            'noShowRecords.handler',
        ]);

        return Inertia::render('WorkOrders/Show', [
            'work_order' => $workOrder,
        ]);
    }

    public function update(UpdateWorkOrderRequest $request, WorkOrder $workOrder)
    {
        $data = $request->validated();

        if (isset($data['status']) && $data['status'] !== $workOrder->status) {
            StatusTimeline::create([
                'work_order_id' => $workOrder->id,
                'from_status' => $workOrder->status,
                'to_status' => $data['status'],
                'handler_id' => Auth::id(),
                'handler_name' => Auth::user()->name,
                'created_at' => now(),
            ]);
        }

        $workOrder->update($data);

        return redirect()->route('work-orders.show', $workOrder)->with('success', 'Work order updated.');
    }

    public function markNoShow(MarkNoShowRequest $request, WorkOrder $workOrder)
    {
        DB::transaction(function () use ($request, $workOrder) {
            $oldStatus = $workOrder->status;

            $workOrder->update(['status' => 'no_show']);

            NoShowRecord::create([
                'work_order_id' => $workOrder->id,
                'handled_by' => Auth::id(),
                'handler_name' => Auth::user()->name,
                'reason' => $request->reason,
                'contact_attempts' => $request->contact_attempts ?? 0,
                'rescheduled' => $request->rescheduled,
                'created_at' => now(),
            ]);

            QualityReport::create([
                'report_date' => now()->toDateString(),
                'work_order_id' => $workOrder->id,
                'vehicle_id' => $workOrder->vehicle_id,
                'technician_id' => $workOrder->technician_id ?? 1,
                'service_item' => $workOrder->serviceItem->name ?? '',
                'no_show' => true,
                'no_show_reason' => $request->reason,
                'overall_score' => 0,
                'generated_by' => Auth::id(),
            ]);

            StatusTimeline::create([
                'work_order_id' => $workOrder->id,
                'from_status' => $oldStatus,
                'to_status' => 'no_show',
                'handler_id' => Auth::id(),
                'handler_name' => Auth::user()->name,
                'remarks' => $request->reason,
                'created_at' => now(),
            ]);
        });

        return redirect()->route('work-orders.show', $workOrder)->with('success', 'Marked as no-show.');
    }

    public function updateStatus(UpdateStatusRequest $request, WorkOrder $workOrder)
    {
        $oldStatus = $workOrder->status;
        $newStatus = $request->status;

        $updateData = ['status' => $newStatus];

        if ($newStatus === 'in_progress' && !$workOrder->started_at) {
            $updateData['started_at'] = now();
        }

        if ($newStatus === 'completed' && !$workOrder->completed_at) {
            $updateData['completed_at'] = now();
        }

        $workOrder->update($updateData);

        StatusTimeline::create([
            'work_order_id' => $workOrder->id,
            'from_status' => $oldStatus,
            'to_status' => $newStatus,
            'handler_id' => Auth::id(),
            'handler_name' => Auth::user()->name,
            'remarks' => $request->remarks,
            'created_at' => now(),
        ]);

        return redirect()->route('work-orders.show', $workOrder)->with('success', 'Status updated.');
    }
}
