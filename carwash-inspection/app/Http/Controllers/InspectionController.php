<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInspectionRequest;
use App\Models\WorkOrder;
use App\Models\WorkOrderInspection;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InspectionController extends Controller
{
    public function show(WorkOrder $workOrder)
    {
        $workOrder->load(['vehicle', 'technician', 'serviceItem', 'inspectionTemplate', 'inspections']);

        return Inertia::render('Inspections/Show', [
            'work_order' => $workOrder,
            'template_items' => $workOrder->inspectionTemplate ? $workOrder->inspectionTemplate->items : [],
        ]);
    }

    public function store(StoreInspectionRequest $request, WorkOrder $workOrder)
    {
        $templateId = $workOrder->inspection_template_id;

        foreach ($request->items as $item) {
            WorkOrderInspection::create([
                'work_order_id' => $workOrder->id,
                'inspection_template_id' => $templateId,
                'item_name' => $item['item_name'],
                'category' => $item['category'],
                'result' => $item['result'],
                'remarks' => $item['remarks'] ?? null,
                'inspected_by' => Auth::id(),
                'inspected_at' => now(),
            ]);
        }

        return redirect()->route('work-orders.show', $workOrder)->with('success', 'Inspection saved.');
    }
}
