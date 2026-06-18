<?php

namespace App\Http\Controllers;

use App\Models\SavedQuery;
use Illuminate\Http\Request;

class SavedQueryController extends Controller
{
    public function index(Request $request)
    {
        $modelType = $request->input('model_type');

        $queries = SavedQuery::accessible($request->user())
            ->when($modelType, function ($query) use ($modelType) {
                $query->byModel($modelType);
            })
            ->with('user')
            ->ordered()
            ->get();

        return response()->json($queries);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'model_type' => 'required|string',
            'query_params' => 'required|array',
            'description' => 'nullable|string',
            'is_public' => 'boolean',
        ]);

        $validated['user_id'] = auth()->id();
        $validated['sort_order'] = SavedQuery::where('user_id', auth()->id())->max('sort_order') + 1;

        $query = SavedQuery::create($validated);

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'saved_query_created',
            'model_type' => SavedQuery::class,
            'model_id' => $query->id,
            'description' => "保存了查询: {$query->name}",
            'new_values' => $validated,
        ]);

        return back()->with('success', '查询已保存');
    }

    public function update(Request $request, SavedQuery $query)
    {
        $this->authorize('update', $query);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'query_params' => 'required|array',
            'description' => 'nullable|string',
            'is_public' => 'boolean',
        ]);

        $oldValues = $query->toArray();
        $query->update($validated);

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'saved_query_updated',
            'model_type' => SavedQuery::class,
            'model_id' => $query->id,
            'description' => "更新了保存查询: {$query->name}",
            'old_values' => $oldValues,
            'new_values' => $validated,
        ]);

        return back()->with('success', '查询已更新');
    }

    public function destroy(SavedQuery $query)
    {
        $this->authorize('delete', $query);

        $queryName = $query->name;
        $query->delete();

        \App\Models\OperationLog::create([
            'user_id' => auth()->id(),
            'action' => 'saved_query_deleted',
            'model_type' => SavedQuery::class,
            'model_id' => $query->id,
            'description' => "删除了保存查询: {$queryName}",
            'old_values' => ['name' => $queryName],
        ]);

        return back()->with('success', '查询已删除');
    }

    public function toggleFavorite(SavedQuery $query)
    {
        $this->authorize('update', $query);

        $query->toggleFavorite();

        return back()->with('success', '收藏状态已更新');
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:saved_queries,id',
        ]);

        foreach ($validated['ids'] as $index => $id) {
            SavedQuery::where('id', $id)->update(['sort_order' => $index + 1);
        }

        return back()->with('success', '排序已更新');
    }
}
