<?php

namespace App\Http\Controllers;

use App\Models\MemberCoursePackage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CoursePackageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MemberCoursePackage::with(['member.user', 'courseType']);

        if ($request->has('member_id')) {
            $query->where('member_id', $request->member_id);
        }

        if ($request->has('course_type_id')) {
            $query->where('course_type_id', $request->course_type_id);
        }

        $packages = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($packages);
    }

    public function show($id): JsonResponse
    {
        $package = MemberCoursePackage::with(['member.user', 'courseType', 'bookings'])->findOrFail($id);
        return response()->json($package);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'member_id' => 'required|exists:members,id',
            'course_type_id' => 'required|exists:course_types,id',
            'package_name' => 'required|string|max:255',
            'total_lessons' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'purchase_date' => 'required|date',
            'expire_date' => 'required|date|after:purchase_date',
            'notes' => 'nullable|string',
        ]);

        $validated['remaining_lessons'] = $validated['total_lessons'];
        $validated['used_lessons'] = 0;
        $validated['created_by'] = $request->user()?->id;

        $package = MemberCoursePackage::create($validated);

        $member = $package->member;
        $member->total_lessons += $package->total_lessons;
        $member->remaining_lessons += $package->total_lessons;
        $member->save();

        return response()->json($package->load(['member.user', 'courseType']), 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $package = MemberCoursePackage::findOrFail($id);

        $validated = $request->validate([
            'package_name' => 'sometimes|string|max:255',
            'expire_date' => 'sometimes|date',
            'notes' => 'nullable|string',
        ]);

        $package->update($validated);

        return response()->json($package->load(['member.user', 'courseType']));
    }

    public function destroy($id): JsonResponse
    {
        $package = MemberCoursePackage::findOrFail($id);

        $member = $package->member;
        $member->total_lessons -= $package->remaining_lessons;
        $member->remaining_lessons -= $package->remaining_lessons;
        $member->save();

        $package->delete();

        return response()->json(['message' => '课时包已删除']);
    }
}
