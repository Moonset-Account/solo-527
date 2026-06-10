<?php

namespace App\Http\Controllers;

use App\Models\Indicator;
use App\Services\AuditService;
use Inertia\Inertia;

class IndicatorController extends Controller
{
    public function index()
    {
        if (!request()->user()->hasPermission('indicator.view')) {
            abort(403);
        }

        $query = Indicator::query();

        if ($search = request('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($category = request('category')) {
            $query->where('category', $category);
        }

        if ($status = request('status')) {
            $query->where('status', $status);
        }

        $indicators = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Indicators/Index', [
            'indicators' => $indicators,
            'filters' => request()->only(['search', 'category', 'status']),
        ]);
    }

    public function store()
    {
        if (!request()->user()->hasPermission('indicator.create')) {
            abort(403);
        }

        $validated = request()->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:100', 'unique:indicators,code'],
            'caliber_description' => ['required', 'string'],
            'unit' => ['required', 'string', 'max:50'],
            'category' => ['required', 'string', 'max:100'],
        ]);

        $indicator = Indicator::create($validated);

        app(AuditService::class)->log(
            'create',
            'indicator',
            $indicator->id,
            null,
            $indicator->toArray(),
        );

        return redirect()->back()->with('message', '指标创建成功');
    }

    public function show(Indicator $indicator)
    {
        if (!request()->user()->hasPermission('indicator.view')) {
            abort(403);
        }

        $indicator->load([
            'consistencyChecks' => fn ($q) => $q->latest()->limit(10),
        ]);

        $recentValues = $indicator->indicatorValues()
            ->latest('time_period')
            ->limit(20)
            ->get();

        return Inertia::render('Indicators/Show', [
            'indicator' => $indicator,
            'recentValues' => $recentValues,
            'consistencyChecks' => $indicator->consistencyChecks,
        ]);
    }

    public function update(Indicator $indicator)
    {
        if (!request()->user()->hasPermission('indicator.update')) {
            abort(403);
        }

        $validated = request()->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:100', 'unique:indicators,code,' . $indicator->id],
            'caliber_description' => ['required', 'string'],
            'unit' => ['required', 'string', 'max:50'],
            'category' => ['required', 'string', 'max:100'],
        ]);

        $oldValues = $indicator->toArray();
        $indicator->update($validated);

        app(AuditService::class)->log(
            'update',
            'indicator',
            $indicator->id,
            $oldValues,
            $indicator->fresh()->toArray(),
        );

        return redirect()->back()->with('message', '指标更新成功');
    }
}
