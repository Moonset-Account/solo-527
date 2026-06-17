<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGridEventRequest;
use App\Http\Requests\UpdateGridEventRequest;
use App\Models\GridEvent;
use App\Models\User;
use Inertia\Inertia;

class GridEventController extends Controller
{
    public function index()
    {
        $filters = request()->only(['start_date', 'end_date', 'status', 'handler_id']);

        $events = GridEvent::with(['reporter', 'handler', 'department'])
            ->when($filters['start_date'] ?? null, fn($q, $date) => $q->whereDate('event_time', '>=', $date))
            ->when($filters['end_date'] ?? null, fn($q, $date) => $q->whereDate('event_time', '<=', $date))
            ->when($filters['status'] ?? null, fn($q, $status) => $q->where('status', $status))
            ->when($filters['handler_id'] ?? null, fn($q, $id) => $q->where('handler_id', $id))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('GridEvent/Index', [
            'events' => $events,
            'filters' => $filters,
            'handlers' => User::where('role', 'department')->get(['id', 'name']),
        ]);
    }

    public function create()
    {
        return Inertia::render('GridEvent/Create');
    }

    public function store(StoreGridEventRequest $request)
    {
        GridEvent::create([
            ...$request->validated(),
            'reporter_id' => auth()->id(),
        ]);

        return redirect()->route('grid-events.index')->with('success', '网格事件创建成功');
    }

    public function show(GridEvent $gridEvent)
    {
        $gridEvent->load(['reporter', 'handler', 'department']);

        return Inertia::render('GridEvent/Show', [
            'gridEvent' => $gridEvent,
        ]);
    }

    public function edit(GridEvent $gridEvent)
    {
        return Inertia::render('GridEvent/Edit', [
            'gridEvent' => $gridEvent,
        ]);
    }

    public function update(UpdateGridEventRequest $request, GridEvent $gridEvent)
    {
        $gridEvent->update($request->validated());

        return redirect()->route('grid-events.index')->with('success', '网格事件更新成功');
    }
}
