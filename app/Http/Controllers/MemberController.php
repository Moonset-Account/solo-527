<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Services\BookingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MemberController extends Controller
{
    protected $bookingService;

    public function __construct(BookingService $bookingService)
    {
        $this->bookingService = $bookingService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Member::with(['user', 'packages.courseType']);

        if ($request->has('keyword')) {
            $keyword = $request->keyword;
            $query->where(function ($q) use ($keyword) {
                $q->whereHas('user', function ($uq) use ($keyword) {
                    $uq->where('name', 'like', "%{$keyword}%")
                        ->orWhere('phone', 'like', "%{$keyword}%")
                        ->orWhere('email', 'like', "%{$keyword}%");
                })->orWhere('member_no', 'like', "%{$keyword}%");
            });
        }

        $members = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($members);
    }

    public function show($id): JsonResponse
    {
        $member = Member::with(['user', 'packages.courseType', 'bookings.coach.user', 'bookings.courseType'])->findOrFail($id);
        return response()->json($member);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id|unique:members,user_id',
            'member_no' => 'required|unique:members',
            'gender' => 'nullable|in:male,female',
            'birthday' => 'nullable|date',
            'height' => 'nullable|numeric|min:0',
            'weight' => 'nullable|numeric|min:0',
            'fitness_goal' => 'nullable|string',
            'health_condition' => 'nullable|string',
            'notes' => 'nullable|string',
            'join_date' => 'nullable|date',
            'expire_date' => 'nullable|date',
        ]);

        $member = Member::create($validated);

        return response()->json($member->load(['user', 'packages']), 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $member = Member::findOrFail($id);

        $validated = $request->validate([
            'gender' => 'nullable|in:male,female',
            'birthday' => 'nullable|date',
            'height' => 'nullable|numeric|min:0',
            'weight' => 'nullable|numeric|min:0',
            'fitness_goal' => 'nullable|string',
            'health_condition' => 'nullable|string',
            'notes' => 'nullable|string',
            'expire_date' => 'nullable|date',
        ]);

        $member->update($validated);

        return response()->json($member->load(['user', 'packages']));
    }

    public function destroy($id): JsonResponse
    {
        $member = Member::findOrFail($id);
        $member->delete();

        return response()->json(['message' => '会员已删除']);
    }

    public function getBookings($id, Request $request): JsonResponse
    {
        $status = $request->query('status');
        $bookings = $this->bookingService->getMemberBookings($id, $status);

        return response()->json($bookings);
    }

    public function getPackages($id): JsonResponse
    {
        $member = Member::findOrFail($id);
        $packages = $member->packages()->with('courseType')->get();

        return response()->json($packages);
    }

    public function getLessonBalance($id): JsonResponse
    {
        $member = Member::findOrFail($id);
        $packages = $member->packages()->with('courseType')->get();

        $balance = [
            'total_lessons' => $member->total_lessons,
            'used_lessons' => $member->used_lessons,
            'remaining_lessons' => $member->remaining_lessons,
            'packages' => $packages,
        ];

        return response()->json($balance);
    }
}
