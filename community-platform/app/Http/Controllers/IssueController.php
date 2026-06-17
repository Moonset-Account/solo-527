<?php

namespace App\Http\Controllers;

use App\Http\Requests\AssignIssueRequest;
use App\Http\Requests\StoreIssueRequest;
use App\Models\Issue;
use App\Services\ParticipationStatService;
use Inertia\Inertia;

class IssueController extends Controller
{
    public function index()
    {
        $filters = request()->only(['start_date', 'end_date', 'status', 'category']);

        $issues = Issue::with(['reporter', 'department', 'assigner', 'votes'])
            ->withCount('votes')
            ->when($filters['start_date'] ?? null, fn($q, $date) => $q->whereDate('created_at', '>=', $date))
            ->when($filters['end_date'] ?? null, fn($q, $date) => $q->whereDate('created_at', '<=', $date))
            ->when($filters['status'] ?? null, fn($q, $status) => $q->where('status', $status))
            ->when($filters['category'] ?? null, fn($q, $category) => $q->where('category', $category))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Issue/Index', [
            'issues' => $issues,
            'categories' => Issue::distinct()->pluck('category')->filter()->values()->toArray(),
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        return Inertia::render('Issue/Create');
    }

    public function store(StoreIssueRequest $request, ParticipationStatService $statService)
    {
        Issue::create([
            ...$request->validated(),
            'reporter_id' => auth()->id(),
        ]);

        $statService->incrementStat(auth()->user(), 'issue_count');

        return redirect()->route('issues.index')->with('success', '议题创建成功');
    }

    public function show(Issue $issue)
    {
        $issue->load(['reporter', 'department', 'assigner', 'votes.user']);
        $issue->loadCount('votes');

        return Inertia::render('Issue/Show', [
            'issue' => $issue,
            'departments' => \App\Models\Department::all(['id', 'name']),
        ]);
    }

    public function assign(AssignIssueRequest $request, Issue $issue)
    {
        $issue->update([
            'department_id' => $request->validated('department_id'),
            'assigner_id' => auth()->id(),
            'status' => 'assigned',
            'deadline' => $request->validated('deadline'),
        ]);

        return redirect()->route('issues.show', $issue)->with('success', '议题分配成功');
    }
}
