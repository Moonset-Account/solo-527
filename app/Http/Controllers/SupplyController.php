<?php

namespace App\Http\Controllers;

use App\Enums\ConfigKey;
use App\Http\Requests\Supply\StoreSupplyRequest;
use App\Http\Requests\Supply\UpdateSupplyRequest;
use App\Models\PriceHistory;
use App\Models\Supply;
use App\Models\SupplyCategory;
use App\Models\SupplyMonthlyUsage;
use App\Models\SupplySpecAttachment;
use App\Services\ConfigService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SupplyController extends Controller
{
    public function __construct(protected ConfigService $configService) {}

    public function index(Request $request)
    {
        $supplies = Supply::with(['category', 'monthlyUsages'])
            ->when($request->category_id, fn ($q) => $q->where('category_id', $request->category_id))
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->paginate(15);

        $categories = SupplyCategory::whereNull('parent_id')->with('children')->get();

        return Inertia::render('Supplies/Index', [
            'supplies' => $supplies,
            'categories' => $categories,
            'filters' => $request->only(['category_id', 'search']),
        ]);
    }

    public function create()
    {
        $categories = SupplyCategory::whereNull('parent_id')->with('children')->get();
        $specAttachmentRequired = $this->configService->getBoolean(ConfigKey::SPEC_ATTACHMENT_REQUIRED->value, false);

        return Inertia::render('Supplies/Create', [
            'categories' => $categories,
            'spec_attachment_required' => $specAttachmentRequired,
        ]);
    }

    public function store(StoreSupplyRequest $request)
    {
        $supply = Supply::create($request->validated());

        if ($this->configService->getBoolean(ConfigKey::PRICE_HISTORY_TRACK_ENABLED->value, true)) {
            PriceHistory::create([
                'supply_id' => $supply->id,
                'price' => $supply->reference_price,
                'effective_date' => now(),
                'recorded_by' => auth()->id(),
                'source' => 'initial',
            ]);
        }

        activity()
            ->performedOn($supply)
            ->causedBy(auth()->user())
            ->log('created');

        return redirect()->route('supplies.show', $supply)->with('success', '耗材创建成功');
    }

    public function show(Supply $supply)
    {
        $supply->load(['category', 'specAttachments', 'monthlyUsages' => function ($q) {
            $q->orderBy('year', 'desc')->orderBy('month', 'desc')->limit(12);
        }]);

        return Inertia::render('Supplies/Show', [
            'supply' => $supply,
        ]);
    }

    public function edit(Supply $supply)
    {
        $categories = SupplyCategory::whereNull('parent_id')->with('children')->get();

        return Inertia::render('Supplies/Edit', [
            'supply' => $supply,
            'categories' => $categories,
        ]);
    }

    public function update(UpdateSupplyRequest $request, Supply $supply)
    {
        $oldPrice = $supply->reference_price;
        $supply->update($request->validated());

        if ($this->configService->getBoolean(ConfigKey::PRICE_HISTORY_TRACK_ENABLED->value, true)
            && $oldPrice != $request->reference_price) {
            PriceHistory::create([
                'supply_id' => $supply->id,
                'price' => $request->reference_price,
                'old_price' => $oldPrice,
                'effective_date' => now(),
                'recorded_by' => auth()->id(),
                'source' => 'update',
            ]);
        }

        activity()
            ->performedOn($supply)
            ->causedBy(auth()->user())
            ->withProperties(['changes' => $supply->getChanges()])
            ->log('updated');

        return redirect()->route('supplies.show', $supply)->with('success', '耗材更新成功');
    }

    public function destroy(Supply $supply)
    {
        $supply->delete();

        activity()
            ->performedOn($supply)
            ->causedBy(auth()->user())
            ->log('deleted');

        return redirect()->route('supplies.index')->with('success', '耗材已删除');
    }

    public function storeMonthlyUsage(Request $request, Supply $supply)
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'quantity' => ['required', 'numeric', 'min:0'],
            'department' => ['nullable', 'string', 'max:100'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $usage = SupplyMonthlyUsage::updateOrCreate(
            [
                'supply_id' => $supply->id,
                'year' => $validated['year'],
                'month' => $validated['month'],
            ],
            [
                'quantity' => $validated['quantity'],
                'department' => $validated['department'] ?? null,
                'note' => $validated['note'] ?? null,
                'recorded_by' => auth()->id(),
            ]
        );

        return back()->with('success', '月度用量已保存');
    }

    public function storeSpecAttachment(Request $request, Supply $supply)
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png', 'max:10240'],
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $file = $request->file('file');
        $path = $file->store('supply-specs', 'public');

        $attachment = SupplySpecAttachment::create([
            'supply_id' => $supply->id,
            'file_name' => $validated['name'] ?? $file->getClientOriginalName(),
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'description' => $validated['description'] ?? null,
            'uploaded_by' => auth()->id(),
        ]);

        activity()
            ->performedOn($supply)
            ->causedBy(auth()->user())
            ->withProperties(['attachment' => $attachment->file_name])
            ->log('added spec attachment');

        return back()->with('success', '规格附件已上传');
    }

    public function destroySpecAttachment(SupplySpecAttachment $attachment)
    {
        if (Storage::disk('public')->exists($attachment->file_path)) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        $attachment->delete();

        return back()->with('success', '附件已删除');
    }

    public function priceHistory(Supply $supply)
    {
        $history = PriceHistory::where('supply_id', $supply->id)
            ->with('recorder')
            ->orderBy('effective_date', 'desc')
            ->paginate(20);

        return Inertia::render('Supplies/PriceHistory', [
            'supply' => $supply,
            'history' => $history,
        ]);
    }
}
