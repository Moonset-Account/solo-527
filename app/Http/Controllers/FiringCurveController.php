<?php

namespace App\Http\Controllers;

use App\Models\FiringCurveTemplate;
use App\Models\FiringCurvePoint;
use Illuminate\Http\Request;

class FiringCurveController extends Controller
{
    public function index(Request $request)
    {
        $query = FiringCurveTemplate::with('createdBy');

        if ($request->has('atmosphere')) {
            $query->where('atmosphere', $request->atmosphere);
        }

        if ($request->has('max_temp_min')) {
            $query->where('max_temperature', '>=', $request->max_temp_min);
        }

        if ($request->has('is_public')) {
            $query->where('is_public', $request->is_public);
        }

        $templates = $query->where('is_active', true)->latest()->get();

        return response()->json($templates);
    }

    public function show(FiringCurveTemplate $template)
    {
        $template->load(['points', 'createdBy']);

        return response()->json($template);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'max_temperature' => 'required|integer|min:0',
            'atmosphere' => 'required|in:oxidation,reduction,neutral',
            'total_duration_minutes' => 'required|integer|min:0',
            'is_public' => 'boolean',
            'points' => 'required|array',
            'points.*.time_minutes' => 'required|integer|min:0',
            'points.*.temperature' => 'required|integer|min:0',
            'points.*.segment_type' => 'string',
            'points.*.notes' => 'nullable|string',
        ]);

        $template = FiringCurveTemplate::create([
            'name' => $request->name,
            'description' => $request->description,
            'max_temperature' => $request->max_temperature,
            'atmosphere' => $request->atmosphere,
            'total_duration_minutes' => $request->total_duration_minutes,
            'created_by' => $request->user()->id,
            'is_public' => $request->is_public ?? true,
        ]);

        foreach ($request->points as $index => $point) {
            $template->points()->create([
                'time_minutes' => $point['time_minutes'],
                'temperature' => $point['temperature'],
                'segment_type' => $point['segment_type'] ?? 'ramp',
                'notes' => $point['notes'] ?? null,
                'sort_order' => $index,
            ]);
        }

        return response()->json($template->load('points'), 201);
    }

    public function update(Request $request, FiringCurveTemplate $template)
    {
        $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'max_temperature' => 'integer|min:0',
            'atmosphere' => 'in:oxidation,reduction,neutral',
            'total_duration_minutes' => 'integer|min:0',
            'is_public' => 'boolean',
            'is_active' => 'boolean',
            'points' => 'array',
            'points.*.id' => 'exists:firing_curve_points,id',
            'points.*.time_minutes' => 'integer|min:0',
            'points.*.temperature' => 'integer|min:0',
            'points.*.segment_type' => 'string',
            'points.*.notes' => 'nullable|string',
        ]);

        $template->update($request->except(['points']));

        if ($request->has('points')) {
            $template->points()->delete();

            foreach ($request->points as $index => $point) {
                $template->points()->create([
                    'time_minutes' => $point['time_minutes'],
                    'temperature' => $point['temperature'],
                    'segment_type' => $point['segment_type'] ?? 'ramp',
                    'notes' => $point['notes'] ?? null,
                    'sort_order' => $index,
                ]);
            }
        }

        return response()->json($template->fresh()->load('points'));
    }

    public function destroy(FiringCurveTemplate $template)
    {
        $hasBatches = $template->kilnBatches()
            ->whereNotIn('status', ['cancelled', 'unloaded'])
            ->exists();

        if ($hasBatches) {
            return response()->json([
                'message' => '该曲线模板正在被使用，无法删除',
            ], 422);
        }

        $template->update(['is_active' => false]);

        return response()->json(['message' => '曲线模板已停用']);
    }
}
