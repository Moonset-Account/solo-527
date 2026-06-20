<?php

namespace App\Http\Controllers;

use App\Models\SavedFilter;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SavedFilterController extends Controller
{
    public function index(Request $request)
    {
        $module = $request->input('module');

        $filters = SavedFilter::where('user_id', $request->user()->id)
            ->when($module, fn($q, $v) => $q->where('module', $v))
            ->orderByDesc('is_default')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($filters);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'module' => 'required|string|max:100',
            'filters' => 'required|array',
            'is_default' => 'nullable|boolean',
        ]);

        if (!empty($validated['is_default'])) {
            SavedFilter::where('user_id', $request->user()->id)
                ->where('module', $validated['module'])
                ->update(['is_default' => false]);
        }

        $validated['user_id'] = $request->user()->id;

        SavedFilter::create($validated);

        return redirect()->back()->with('success', '筛选条件保存成功');
    }

    public function update(Request $request, $id)
    {
        $filter = SavedFilter::findOrFail($id);

        if ($filter->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'module' => 'required|string|max:100',
            'filters' => 'required|array',
            'is_default' => 'nullable|boolean',
        ]);

        if (!empty($validated['is_default'])) {
            SavedFilter::where('user_id', $request->user()->id)
                ->where('module', $validated['module'])
                ->update(['is_default' => false]);
        }

        $filter->update($validated);

        return redirect()->back()->with('success', '筛选条件更新成功');
    }

    public function destroy(Request $request, $id)
    {
        $filter = SavedFilter::findOrFail($id);

        if ($filter->user_id !== $request->user()->id) {
            abort(403);
        }

        $filter->delete();

        return redirect()->back()->with('success', '筛选条件删除成功');
    }

    public function apply(Request $request, $id)
    {
        $filter = SavedFilter::findOrFail($id);

        if ($filter->user_id !== $request->user()->id) {
            abort(403);
        }

        return response()->json([
            'filters' => $filter->filters,
        ]);
    }
}
