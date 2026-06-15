<?php

namespace App\Http\Controllers;

use App\Models\Checklist;
use App\Models\ChecklistRecord;
use App\Models\ChecklistRecordItem;
use App\Models\ComplianceGap;
use App\Models\SavedFilter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ChecklistRecordController extends Controller
{
    public function index(Request $request)
    {
        $query = ChecklistRecord::with(['checklist', 'submittedBy', 'responsibleUser'])
            ->when($request->input('search'), function ($q, $search) {
                $q->where('title', 'like', "%{$search}%");
            })
            ->when($request->input('status'), function ($q, $status) {
                $q->where('status', $status);
            })
            ->when($request->input('checklist_id'), function ($q, $checklistId) {
                $q->where('checklist_id', $checklistId);
            })
            ->when($request->input('responsible_user_id'), function ($q, $userId) {
                $q->where('responsible_user_id', $userId);
            })
            ->when($request->input('department'), function ($q, $department) {
                $q->where('department', $department);
            })
            ->when($request->input('date_from'), function ($q, $date) {
                $q->whereDate('check_date', '>=', $date);
            })
            ->when($request->input('date_to'), function ($q, $date) {
                $q->whereDate('check_date', '<=', $date);
            })
            ->when($request->input('due_date_from'), function ($q, $date) {
                $q->whereDate('due_date', '>=', $date);
            })
            ->when($request->input('due_date_to'), function ($q, $date) {
                $q->whereDate('due_date', '<=', $date);
            })
            ->when($request->input('is_overdue') === 'true', function ($q) {
                $q->where('due_date', '<', now())
                    ->whereIn('status', ['draft', 'submitted']);
            })
            ->orderBy('created_at', 'desc');

        $records = $query->paginate(15)->withQueryString();

        $checklists = Checklist::active()->get(['id', 'title']);
        $departments = ChecklistRecord::distinct()->pluck('department')->filter()->values();

        $savedFilters = SavedFilter::forPage('checklist_records')
            ->accessibleBy(auth()->user())
            ->ordered()
            ->get();

        return Inertia::render('ChecklistRecords/Index', [
            'records' => $records,
            'checklists' => $checklists,
            'departments' => $departments,
            'savedFilters' => $savedFilters,
            'filters' => $request->all(),
        ]);
    }

    public function create(Checklist $checklist)
    {
        $checklist->load('items');

        return Inertia::render('ChecklistRecords/Create', [
            'checklist' => $checklist,
        ]);
    }

    public function store(Request $request, Checklist $checklist)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'department' => 'nullable|string|max:100',
            'check_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'responsible_user_id' => 'nullable|exists:users,id',
            'items' => 'required|array',
            'items.*.checklist_item_id' => 'required|exists:checklist_items,id',
            'items.*.result' => 'required|in:pass,fail,partial,pending,na',
            'items.*.evidence' => 'nullable|string',
            'items.*.remark' => 'nullable|string',
            'items.*.has_gap' => 'boolean',
            'submit' => 'boolean',
        ]);

        $record = DB::transaction(function () use ($validated, $checklist, $request) {
            $record = ChecklistRecord::create([
                'checklist_id' => $checklist->id,
                'title' => $validated['title'],
                'description' => $validated['description'],
                'department' => $validated['department'],
                'check_date' => $validated['check_date'] ?? now(),
                'due_date' => $validated['due_date'] ?? null,
                'responsible_user_id' => $validated['responsible_user_id'] ?? null,
                'status' => $validated['submit'] ?? false ? 'submitted' : 'draft',
                'submitted_by' => auth()->id(),
                'submitted_at' => $validated['submit'] ?? false ? now() : null,
            ]);

            foreach ($validated['items'] as $item) {
                $recordItem = $record->items()->create([
                    'checklist_item_id' => $item['checklist_item_id'],
                    'result' => $item['result'],
                    'evidence' => $item['evidence'] ?? null,
                    'remark' => $item['remark'] ?? null,
                    'has_gap' => $item['has_gap'] ?? ($item['result'] === 'fail' || $item['result'] === 'partial'),
                ]);

                if ($recordItem->has_gap) {
                    $checklistItem = $checklist->items()
                        ->where('id', $item['checklist_item_id'])
                        ->first();

                    ComplianceGap::create([
                        'checklist_record_id' => $record->id,
                        'checklist_item_id' => $item['checklist_item_id'],
                        'title' => $checklistItem ? $checklistItem->title : '合规缺口',
                        'description' => $item['remark'] ?? null,
                        'severity' => $checklistItem->risk_level ?? 'medium',
                        'status' => 'open',
                        'responsible_user_id' => $validated['responsible_user_id'] ?? null,
                        'created_by' => auth()->id(),
                        'discovered_date' => $validated['check_date'] ?? now(),
                        'due_date' => $validated['due_date'] ?? null,
                    ]);
                }
            }

            if ($record->status === 'submitted') {
                $record->addHandlingLog('submitted', [
                    'comment' => '检查清单已提交',
                ]);
            }

            return $record;
        });

        $message = ($validated['submit'] ?? false) ? '检查清单已提交' : '草稿已保存';

        return redirect()->route('checklist-records.show', $record)
            ->with('success', $message);
    }

    public function show(ChecklistRecord $record)
    {
        $record->load([
            'checklist.items',
            'items.checklistItem',
            'submittedBy',
            'reviewedBy',
            'responsibleUser',
            'gaps' => function ($q) {
                $q->orderBy('created_at', 'desc');
            },
        ]);

        return Inertia::render('ChecklistRecords/Show', [
            'record' => $record,
        ]);
    }

    public function edit(ChecklistRecord $record)
    {
        if (!in_array($record->status, ['draft', 'submitted'])) {
            abort(403, '此状态下的记录不可编辑');
        }

        $record->load(['checklist.items', 'items.checklistItem']);

        return Inertia::render('ChecklistRecords/Edit', [
            'record' => $record,
        ]);
    }

    public function update(Request $request, ChecklistRecord $record)
    {
        if (!in_array($record->status, ['draft', 'submitted'])) {
            abort(403, '此状态下的记录不可编辑');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'department' => 'nullable|string|max:100',
            'check_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'responsible_user_id' => 'nullable|exists:users,id',
            'items' => 'required|array',
            'items.*.id' => 'nullable|exists:checklist_record_items,id',
            'items.*.checklist_item_id' => 'required|exists:checklist_items,id',
            'items.*.result' => 'required|in:pass,fail,partial,pending,na',
            'items.*.evidence' => 'nullable|string',
            'items.*.remark' => 'nullable|string',
            'items.*.has_gap' => 'boolean',
            'submit' => 'boolean',
        ]);

        DB::transaction(function () use ($validated, $record) {
            $oldStatus = $record->status;
            $newStatus = $validated['submit'] ?? false ? 'submitted' : 'draft';

            $record->update([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'department' => $validated['department'],
                'check_date' => $validated['check_date'],
                'due_date' => $validated['due_date'],
                'responsible_user_id' => $validated['responsible_user_id'],
                'status' => $newStatus,
                'submitted_at' => $newStatus === 'submitted' && $oldStatus !== 'submitted' ? now() : $record->submitted_at,
            ]);

            foreach ($validated['items'] as $item) {
                if (isset($item['id'])) {
                    $recordItem = ChecklistRecordItem::find($item['id']);
                    $oldHasGap = $recordItem->has_gap;
                    $recordItem->update([
                        'result' => $item['result'],
                        'evidence' => $item['evidence'] ?? null,
                        'remark' => $item['remark'] ?? null,
                        'has_gap' => $item['has_gap'] ?? ($item['result'] === 'fail' || $item['result'] === 'partial'),
                    ]);

                    if (!$oldHasGap && $recordItem->has_gap) {
                        $checklistItem = $record->checklist->items()
                            ->where('id', $item['checklist_item_id'])
                            ->first();

                        ComplianceGap::create([
                            'checklist_record_id' => $record->id,
                            'checklist_item_id' => $item['checklist_item_id'],
                            'title' => $checklistItem ? $checklistItem->title : '合规缺口',
                            'description' => $item['remark'] ?? null,
                            'severity' => $checklistItem->risk_level ?? 'medium',
                            'status' => 'open',
                            'responsible_user_id' => $validated['responsible_user_id'] ?? null,
                            'created_by' => auth()->id(),
                            'discovered_date' => $validated['check_date'] ?? now(),
                            'due_date' => $validated['due_date'] ?? null,
                        ]);
                    }
                }
            }

            if ($oldStatus !== 'submitted' && $newStatus === 'submitted') {
                $record->addHandlingLog('submitted', [
                    'comment' => '检查清单已提交',
                ]);
            }
        });

        $message = ($validated['submit'] ?? false) ? '检查清单已提交' : '草稿已保存';

        return redirect()->route('checklist-records.show', $record)
            ->with('success', $message);
    }

    public function submit(ChecklistRecord $record)
    {
        if ($record->status !== 'draft') {
            abort(403, '只有草稿状态可以提交');
        }

        $record->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $record->addHandlingLog('submitted', [
            'comment' => '检查清单已提交审核',
        ]);

        return back()->with('success', '已提交审核');
    }

    public function review(Request $request, ChecklistRecord $record)
    {
        if ($record->status !== 'submitted') {
            abort(403, '只有已提交状态可以审核');
        }

        $validated = $request->validate([
            'status' => 'required|in:reviewed,returned',
            'comment' => 'nullable|string',
        ]);

        $newStatus = $validated['status'] === 'reviewed' ? 'reviewed' : 'draft';

        $record->update([
            'status' => $newStatus,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        $record->addHandlingLog('reviewed', [
            'old_value' => 'submitted',
            'new_value' => $newStatus,
            'comment' => $validated['comment'],
        ]);

        $message = $validated['status'] === 'reviewed' ? '审核通过' : '已退回修改';

        return back()->with('success', $message);
    }

    public function destroy(ChecklistRecord $record)
    {
        $record->delete();

        return redirect()->route('checklist-records.index')
            ->with('success', '记录已删除');
    }
}
