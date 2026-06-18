<?php

namespace App\Http\Controllers;

use App\Models\SavedFilter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class SavedFilterController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $userRoleIds = $user->roles()->pluck('id')->toArray();

        $query = SavedFilter::where(function ($q) use ($user, $userRoleIds) {
            $q->where('user_id', $user->id)
                ->orWhere(function ($subQ) use ($userRoleIds) {
                    $subQ->where('is_public', true)
                        ->whereIn('role_id', $userRoleIds);
                })
                ->orWhere(function ($subQ) {
                    $subQ->where('is_public', true)
                        ->whereNull('role_id');
                });
        });

        if ($module = $request->input('module')) {
            $query->where('module', $module);
        }

        $savedFilters = $query->orderBy('sort_order')->orderBy('name')->get();

        return Inertia::render('SavedFilters/Index', [
            'savedFilters' => $savedFilters,
            'module' => $module,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'module' => 'required|string|max:100',
            'filters' => 'required|array',
            'filter_data' => 'nullable|array',
            'is_public' => 'boolean',
            'role_id' => 'nullable|exists:roles,id',
            'sort_order' => 'nullable|integer',
        ]);

        $validated['user_id'] = Auth::id();
        $validated['is_public'] = $request->boolean('is_public', false);
        $validated['filters'] = $request->input('filter_data') ?? $request->input('filters');

        if ($validated['is_public']) {
            $user = Auth::user();
            $primaryRole = $user->roles()->first();
            $validated['role_id'] = $validated['role_id'] ?? $primaryRole?->id;
        }

        $savedFilter = SavedFilter::create($validated);

        return redirect()->back()->with('success', '筛选条件已保存');
    }

    public function update(Request $request, SavedFilter $savedFilter)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'filters' => 'required|array',
            'is_public' => 'boolean',
            'role_id' => 'nullable|exists:roles,id',
            'sort_order' => 'nullable|integer',
        ]);

        $validated['is_public'] = $request->boolean('is_public', false);

        $savedFilter->update($validated);

        return redirect()->back()->with('success', '筛选条件已更新');
    }

    public function destroy(SavedFilter $savedFilter)
    {
        if ($savedFilter->user_id !== Auth::id()) {
            abort(403, '无权删除此筛选条件');
        }

        $savedFilter->delete();

        return redirect()->back()->with('success', '筛选条件已删除');
    }

    public function apply(SavedFilter $savedFilter)
    {
        return Inertia::location(
            route($savedFilter->module . '.index', $savedFilter->filters)
        );
    }
}
