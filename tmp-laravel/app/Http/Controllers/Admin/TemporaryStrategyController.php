<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TemporaryStrategy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Inertia\Inertia;

class TemporaryStrategyController extends Controller
{
    public function index(Request $request)
    {
        $strategies = TemporaryStrategy::when($request->search, function ($q, $v) {
            $q->where('name', 'like', "%{$v}%")->orWhere('code', 'like', "%{$v}%");
        })
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/TemporaryStrategies', [
            'strategies' => $strategies,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:100|unique:temporary_strategies,code',
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:100',
            'config' => 'nullable|array',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string',
        ]);

        TemporaryStrategy::create($validated);

        return redirect()->back()->with('success', '临时策略创建成功');
    }

    public function update(Request $request, $id)
    {
        $strategy = TemporaryStrategy::findOrFail($id);

        $validated = $request->validate([
            'code' => 'required|string|max:100|unique:temporary_strategies,code,' . $id,
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:100',
            'config' => 'nullable|array',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string',
        ]);

        $strategy->update($validated);

        return redirect()->back()->with('success', '临时策略更新成功');
    }

    public function toggle($id)
    {
        $strategy = TemporaryStrategy::findOrFail($id);
        $strategy->update(['is_active' => !$strategy->is_active]);

        Redis::del("strategy:{$strategy->code}");

        return redirect()->back()->with('success', '策略状态已切换');
    }

    public function destroy($id)
    {
        TemporaryStrategy::findOrFail($id)->delete();

        return redirect()->back()->with('success', '临时策略删除成功');
    }
}
