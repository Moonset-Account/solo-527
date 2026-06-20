<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dictionary;
use App\Models\DictionaryItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DictionaryController extends Controller
{
    public function index(Request $request)
    {
        $dictionaries = Dictionary::with('items')
            ->when($request->search, fn($q, $v) => $q->where('name', 'like', "%{$v}%")->orWhere('code', 'like', "%{$v}%"))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Dictionaries', [
            'dictionaries' => $dictionaries,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:100|unique:dictionaries,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        Dictionary::create($validated);

        return redirect()->back()->with('success', '字典创建成功');
    }

    public function update(Request $request, $id)
    {
        $dictionary = Dictionary::findOrFail($id);

        $validated = $request->validate([
            'code' => 'required|string|max:100|unique:dictionaries,code,' . $id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $dictionary->update($validated);

        return redirect()->back()->with('success', '字典更新成功');
    }

    public function destroy($id)
    {
        $dictionary = Dictionary::findOrFail($id);

        if ($dictionary->is_system) {
            abort(403, '系统字典不可删除');
        }

        $dictionary->delete();

        return redirect()->back()->with('success', '字典删除成功');
    }

    public function storeItem(Request $request, $id)
    {
        Dictionary::findOrFail($id);

        $validated = $request->validate([
            'value' => 'required|string|max:255',
            'label' => 'required|string|max:255',
            'sort_order' => 'nullable|integer',
        ]);

        $validated['dictionary_id'] = $id;

        DictionaryItem::create($validated);

        return redirect()->back()->with('success', '字典项创建成功');
    }

    public function updateItem(Request $request, $itemId)
    {
        $item = DictionaryItem::findOrFail($itemId);

        $validated = $request->validate([
            'value' => 'required|string|max:255',
            'label' => 'required|string|max:255',
            'sort_order' => 'nullable|integer',
        ]);

        $item->update($validated);

        return redirect()->back()->with('success', '字典项更新成功');
    }

    public function destroyItem($itemId)
    {
        DictionaryItem::findOrFail($itemId)->delete();

        return redirect()->back()->with('success', '字典项删除成功');
    }

    public function toggleItem($itemId)
    {
        $item = DictionaryItem::findOrFail($itemId);
        $item->update(['is_active' => !$item->is_active]);

        return redirect()->back()->with('success', '字典项状态已切换');
    }
}
