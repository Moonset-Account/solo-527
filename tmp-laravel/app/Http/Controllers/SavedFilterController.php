<?php

namespace App\Http\Controllers;

use App\Models\SavedFilter;
use Illuminate\Http\Request;

class SavedFilterController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'page' => 'required|string',
        ]);

        $filters = SavedFilter::forPage($request->input('page'))
            ->accessibleBy(auth()->user())
            ->ordered()
            ->get();

        return response()->json($filters);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'page' => 'required|string',
            'filters' => 'required|array',
            'is_public' => 'boolean',
        ]);

        $filter = SavedFilter::create([
            ...$validated,
            'user_id' => auth()->id(),
            'is_public' => $validated['is_public'] ?? false,
        ]);

        return response()->json([
            'success' => true,
            'filter' => $filter,
            'message' => '筛选条件已保存',
        ]);
    }

    public function update(Request $request, SavedFilter $savedFilter)
    {
        if ($savedFilter->user_id !== auth()->id() && !auth()->user()->isAdmin()) {
            abort(403, '无权修改此筛选条件');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'filters' => 'array',
            'is_public' => 'boolean',
        ]);

        $savedFilter->update($validated);

        return response()->json([
            'success' => true,
            'filter' => $savedFilter,
            'message' => '筛选条件已更新',
        ]);
    }

    public function rename(Request $request, SavedFilter $savedFilter)
    {
        if ($savedFilter->user_id !== auth()->id() && !auth()->user()->isAdmin()) {
            abort(403, '无权重命名此筛选条件');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $savedFilter->update(['name' => $validated['name']]);

        return response()->json([
            'success' => true,
            'filter' => $savedFilter,
            'message' => '筛选条件已重命名',
        ]);
    }

    public function destroy(SavedFilter $savedFilter)
    {
        if ($savedFilter->user_id !== auth()->id() && !auth()->user()->isAdmin()) {
            abort(403, '无权删除此筛选条件');
        }

        $savedFilter->delete();

        return response()->json([
            'success' => true,
            'message' => '筛选条件已删除',
        ]);
    }
}
