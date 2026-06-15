<?php

namespace App\Http\Controllers;

use App\Models\Checklist;
use App\Models\ChecklistItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ChecklistController extends Controller
{
    public function index(Request $request)
    {
        $query = Checklist::with('createdBy')
            ->when($request->input('search'), function ($q, $search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->when($request->input('category'), function ($q, $category) {
                $q->where('category', $category);
            })
            ->when($request->input('is_active'), function ($q, $isActive) {
                $q->where('is_active', $isActive === 'true');
            })
            ->orderBy('created_at', 'desc');

        $checklists = $query->paginate(15)->withQueryString();

        $categories = Checklist::distinct()->pluck('category')->filter()->values();

        return Inertia::render('Checklists/Index', [
            'checklists' => $checklists,
            'categories' => $categories,
            'filters' => $request->all(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Checklists/Create', [
            'riskLevels' => ['low', 'medium', 'high'],
            'categories' => ['数据安全', '隐私保护', '合规审计', '访问控制', '数据质量'],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'version' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'items' => 'required|array|min:1',
            'items.*.title' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.criteria' => 'nullable|string',
            'items.*.risk_level' => 'required|in:low,medium,high',
            'items.*.category' => 'nullable|string',
            'items.*.is_required' => 'boolean',
            'items.*.sort_order' => 'integer',
        ]);

        $checklist = DB::transaction(function () use ($validated, $request) {
            $checklist = Checklist::create([
                ...$validated,
                'created_by' => auth()->id(),
                'is_active' => $validated['is_active'] ?? true,
            ]);

            foreach ($validated['items'] as $index => $item) {
                $checklist->items()->create([
                    ...$item,
                    'sort_order' => $item['sort_order'] ?? $index,
                    'is_required' => $item['is_required'] ?? true,
                ]);
            }

            return $checklist;
        });

        return redirect()->route('checklists.show', $checklist)
            ->with('success', '检查清单创建成功');
    }

    public function show(Checklist $checklist)
    {
        $checklist->load(['items' => function ($q) {
            $q->orderBy('sort_order');
        }, 'createdBy']);

        return Inertia::render('Checklists/Show', [
            'checklist' => $checklist,
        ]);
    }

    public function edit(Checklist $checklist)
    {
        $checklist->load('items');

        return Inertia::render('Checklists/Edit', [
            'checklist' => $checklist,
            'riskLevels' => ['low', 'medium', 'high'],
            'categories' => ['数据安全', '隐私保护', '合规审计', '访问控制', '数据质量'],
        ]);
    }

    public function update(Request $request, Checklist $checklist)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'version' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:checklist_items,id',
            'items.*.title' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.criteria' => 'nullable|string',
            'items.*.risk_level' => 'required|in:low,medium,high',
            'items.*.category' => 'nullable|string',
            'items.*.is_required' => 'boolean',
            'items.*.sort_order' => 'integer',
        ]);

        DB::transaction(function () use ($validated, $checklist) {
            $checklist->update([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'category' => $validated['category'],
                'version' => $validated['version'],
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $existingItemIds = $checklist->items()->pluck('id')->toArray();
            $submittedItemIds = collect($validated['items'])
                ->whereNotNull('id')
                ->pluck('id')
                ->toArray();

            $itemsToDelete = array_diff($existingItemIds, $submittedItemIds);
            ChecklistItem::whereIn('id', $itemsToDelete)->delete();

            foreach ($validated['items'] as $index => $item) {
                if (isset($item['id'])) {
                    $checklist->items()
                        ->where('id', $item['id'])
                        ->update([
                            'title' => $item['title'],
                            'description' => $item['description'] ?? null,
                            'criteria' => $item['criteria'] ?? null,
                            'risk_level' => $item['risk_level'],
                            'category' => $item['category'] ?? null,
                            'is_required' => $item['is_required'] ?? true,
                            'sort_order' => $item['sort_order'] ?? $index,
                        ]);
                } else {
                    $checklist->items()->create([
                        ...$item,
                        'sort_order' => $item['sort_order'] ?? $index,
                        'is_required' => $item['is_required'] ?? true,
                    ]);
                }
            }
        });

        return redirect()->route('checklists.show', $checklist)
            ->with('success', '检查清单更新成功');
    }

    public function destroy(Checklist $checklist)
    {
        $checklist->delete();

        return redirect()->route('checklists.index')
            ->with('success', '检查清单已删除');
    }

    public function toggleActive(Checklist $checklist)
    {
        $checklist->update(['is_active' => !$checklist->is_active]);

        return back()->with('success', '状态已更新');
    }
}
