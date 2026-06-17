<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAssistanceRequest;
use App\Models\AssistanceRequest;
use App\Models\User;
use App\Services\ParticipationStatService;
use Inertia\Inertia;

class AssistanceRequestController extends Controller
{
    public function index()
    {
        $filters = request()->only(['start_date', 'end_date', 'status', 'handler_id']);

        $assistanceRequests = AssistanceRequest::with(['resident', 'department', 'handler'])
            ->when($filters['start_date'] ?? null, fn($q, $date) => $q->whereDate('created_at', '>=', $date))
            ->when($filters['end_date'] ?? null, fn($q, $date) => $q->whereDate('created_at', '<=', $date))
            ->when($filters['status'] ?? null, fn($q, $status) => $q->where('status', $status))
            ->when($filters['handler_id'] ?? null, fn($q, $id) => $q->where('handler_id', $id))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Assistance/Index', [
            'assistanceRequests' => $assistanceRequests,
            'handlers' => User::where('role', 'department')->get(['id', 'name']),
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        return Inertia::render('Assistance/Create');
    }

    public function store(StoreAssistanceRequest $request, ParticipationStatService $statService)
    {
        AssistanceRequest::create([
            ...$request->validated(),
            'resident_id' => auth()->id(),
        ]);

        $statService->incrementStat(auth()->user(), 'assistance_count');

        return redirect()->route('assistance.index')->with('success', '求助请求创建成功');
    }

    public function show(AssistanceRequest $assistanceRequest)
    {
        $assistanceRequest->load(['resident', 'department', 'handler']);

        return Inertia::render('Assistance/Show', [
            'assistance' => $assistanceRequest,
        ]);
    }

    public function update(AssistanceRequest $assistanceRequest)
    {
        $validated = request()->validate([
            'status' => 'sometimes|string',
            'department_id' => 'sometimes|exists:departments,id',
            'handler_id' => 'sometimes|exists:users,id',
        ]);

        $assistanceRequest->update($validated);

        return redirect()->route('assistance.index')->with('success', '求助请求更新成功');
    }
}
