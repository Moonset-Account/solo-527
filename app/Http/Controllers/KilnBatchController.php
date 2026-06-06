<?php

namespace App\Http\Controllers;

use App\Models\KilnBatch;
use App\Models\Work;
use App\Services\ConflictCheckService;
use App\Services\KilnSchedulingService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class KilnBatchController extends Controller
{
    protected KilnSchedulingService $schedulingService;
    protected ConflictCheckService $conflictCheckService;

    public function __construct(
        KilnSchedulingService $schedulingService,
        ConflictCheckService $conflictCheckService
    ) {
        $this->schedulingService = $schedulingService;
        $this->conflictCheckService = $conflictCheckService;
    }

    public function index(Request $request)
    {
        $query = KilnBatch::with(['kiln', 'firingCurveTemplate', 'createdBy']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('kiln_id')) {
            $query->where('kiln_id', $request->kiln_id);
        }

        $batches = $query->latest('scheduled_fire_date')->paginate(15);

        return response()->json($batches);
    }

    public function show(KilnBatch $batch)
    {
        $batch->load([
            'kiln',
            'firingCurveTemplate.points',
            'works.student',
            'works.clay',
            'works.glazes',
            'batchWorks',
        ]);

        return response()->json($batch);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kiln_id' => 'required|exists:kilns,id',
            'firing_curve_template_id' => 'required|exists:firing_curve_templates,id',
            'scheduled_fire_date' => 'required|date',
            'status' => 'in:draft,scheduled',
            'max_capacity' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        try {
            $batch = $this->schedulingService->createKilnBatch(
                $request->all(),
                $request->user()
            );

            return response()->json($batch->load(['kiln', 'firingCurveTemplate']), 201);
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'scheduled_fire_date' => [$e->getMessage()],
            ]);
        }
    }

    public function update(Request $request, KilnBatch $batch)
    {
        $request->validate([
            'scheduled_fire_date' => 'nullable|date',
            'status' => 'in:draft,scheduled,firing,cooling,unloaded,cancelled',
            'notes' => 'nullable|string',
        ]);

        $batch->update($request->only(['scheduled_fire_date', 'status', 'notes']));

        return response()->json($batch->fresh());
    }

    public function addWork(Request $request, KilnBatch $batch)
    {
        $request->validate([
            'work_id' => 'required|exists:works,id',
            'position_shelf' => 'nullable|integer',
            'position_zone' => 'nullable|integer',
            'position_x' => 'nullable|numeric',
            'position_y' => 'nullable|numeric',
        ]);

        $work = Work::findOrFail($request->work_id);
        $result = $this->schedulingService->addWorkToBatch(
            $batch,
            $work,
            $request->only(['position_shelf', 'position_zone', 'position_x', 'position_y'])
        );

        if (!$result['success']) {
            return response()->json($result, 422);
        }

        return response()->json($result);
    }

    public function removeWork(KilnBatch $batch, Work $work)
    {
        $result = $this->schedulingService->removeWorkFromBatch($batch, $work);

        if (!$result['success']) {
            return response()->json($result, 422);
        }

        return response()->json($result);
    }

    public function updateCurve(Request $request, KilnBatch $batch)
    {
        $request->validate([
            'firing_curve_template_id' => 'required|exists:firing_curve_templates,id',
        ]);

        $result = $this->schedulingService->updateBatchCurve(
            $batch,
            $request->firing_curve_template_id
        );

        return response()->json($result);
    }

    public function unload(Request $request, KilnBatch $batch)
    {
        $request->validate([
            'works' => 'required|array',
            'works.*.work_id' => 'required|exists:works,id',
            'works.*.post_firing_status' => 'required|in:success,broken,partial_damage',
            'works.*.post_firing_notes' => 'nullable|string',
            'works.*.breakage_reason' => 'nullable|string',
            'works.*.compensation_status' => 'in:none,pending,approved,paid,rejected',
            'works.*.for_exhibition' => 'boolean',
        ]);

        $result = $this->schedulingService->batchUnload($batch, $request->works);

        if (!$result['success']) {
            return response()->json($result, 422);
        }

        return response()->json($result);
    }

    public function cancel(KilnBatch $batch)
    {
        $result = $this->schedulingService->cancelKilnBatch($batch);

        if (!$result['success']) {
            return response()->json($result, 422);
        }

        return response()->json($result);
    }

    public function checkConflict(Request $request, KilnBatch $batch)
    {
        $request->validate([
            'work_id' => 'required|exists:works,id',
            'target_zone' => 'nullable|integer',
        ]);

        $work = Work::findOrFail($request->work_id);
        $result = $this->conflictCheckService->checkAllConflicts(
            $batch,
            $work,
            $request->target_zone
        );

        return response()->json($result);
    }

    public function recommendZone(KilnBatch $batch, Work $work)
    {
        $zone = $this->schedulingService->recommendOptimalZone($batch, $work);

        return response()->json([
            'recommended_zone' => $zone,
            'required_temperature' => $work->getSuitableTemperature(),
        ]);
    }
}
