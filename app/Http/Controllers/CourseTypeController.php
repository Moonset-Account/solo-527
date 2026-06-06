<?php

namespace App\Http\Controllers;

use App\Models\CourseType;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CourseTypeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CourseType::query();

        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        $courseTypes = $query->orderBy('name')->get();

        return response()->json($courseTypes);
    }

    public function show($id): JsonResponse
    {
        $courseType = CourseType::with('coaches.user')->findOrFail($id);
        return response()->json($courseType);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'duration_minutes' => 'required|integer|min:15|max:240',
            'price' => 'required|numeric|min:0',
            'coach_commission' => 'required|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'color' => 'nullable|string',
            'cover_image' => 'nullable|string',
        ]);

        $courseType = CourseType::create($validated);

        return response()->json($courseType, 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $courseType = CourseType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'duration_minutes' => 'sometimes|integer|min:15|max:240',
            'price' => 'sometimes|numeric|min:0',
            'coach_commission' => 'sometimes|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'color' => 'nullable|string',
            'cover_image' => 'nullable|string',
        ]);

        $courseType->update($validated);

        return response()->json($courseType);
    }

    public function destroy($id): JsonResponse
    {
        $courseType = CourseType::findOrFail($id);
        $courseType->delete();

        return response()->json(['message' => '课程类型已删除']);
    }
}
