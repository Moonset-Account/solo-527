<?php

namespace App\Http\Controllers;

use App\Models\ComplianceGap;
use App\Models\DownloadLog;
use App\Models\GapEvidence;
use App\Models\GapHandlingLog;
use App\Models\SavedFilter;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ComplianceGapController extends Controller
{
    public function index(Request $request)
    {
        $query = ComplianceGap::with([
            'checklistRecord',
            'responsibleUser',
            'createdBy',
        ])
            ->when($request->input('search'), function ($q, $search) {
                $q->where('gap_no', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->when($request->input('status'), function ($q, $status) {
                if (is_array($status)) {
                    $q->whereIn('status', $status);
                } else {
                    $q->where('status', $status);
                }
            })
            ->when($request->input('severity'), function ($q, $severity) {
                if (is_array($severity)) {
                    $q->whereIn('severity', $severity);
                } else {
                    $q->where('severity', $severity);
                }
            })
            ->when($request->input('category'), function ($q, $category) {
                $q->where('category', $category);
            })
            ->when($request->input('responsible_user_id'), function ($q, $userId) {
                $q->where('responsible_user_id', $userId);
            })
            ->when($request->input('created_by'), function ($q, $userId) {
                $q->where('created_by', $userId);
            })
            ->when($request->input('discovered_from'), function ($q, $date) {
                $q->whereDate('discovered_date', '>=', $date);
            })
            ->when($request->input('discovered_to'), function ($q, $date) {
                $q->whereDate('discovered_date', '<=', $date);
            })
            ->when($request->input('due_from'), function ($q, $date) {
                $q->whereDate('due_date', '>=', $date);
            })
            ->when($request->input('due_to'), function ($q, $date) {
                $q->whereDate('due_date', '<=', $date);
            })
            ->when($request->input('is_overdue') === 'true', function ($q) {
                $q->where('due_date', '<', now())
                    ->whereIn('status', ['open', 'in_progress', 'pending_review']);
            })
            ->when($request->input('sort_by'), function ($q, $sortBy) use ($request) {
                $direction = $request->input('sort_dir', 'desc');
                $q->orderBy($sortBy, $direction);
            }, function ($q) {
                $q->orderBy('created_at', 'desc');
            });

        $gaps = $query->paginate(20)->withQueryString();

        $statistics = $this->getGapStatistics($request);

        $users = User::orderBy('name')->get(['id', 'name', 'role', 'department']);
        $categories = ComplianceGap::distinct()->pluck('category')->filter()->values();

        $savedFilters = SavedFilter::forPage('gaps')
            ->accessibleBy(auth()->user())
            ->ordered()
            ->get();

        return Inertia::render('ComplianceGaps/Index', [
            'gaps' => $gaps,
            'statistics' => $statistics,
            'users' => $users,
            'categories' => $categories,
            'savedFilters' => $savedFilters,
            'filters' => $request->all(),
            'statuses' => [
                'open' => '待处理',
                'in_progress' => '处理中',
                'pending_review' => '待审核',
                'resolved' => '已解决',
                'closed' => '已关闭',
            ],
            'severities' => [
                'low' => '低',
                'medium' => '中',
                'high' => '高',
                'critical' => '严重',
            ],
        ]);
    }

    protected function getGapStatistics(Request $request): array
    {
        $baseQuery = ComplianceGap::query();

        if ($request->input('date_from')) {
            $baseQuery->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->input('date_to')) {
            $baseQuery->whereDate('created_at', '<=', $request->input('date_to'));
        }

        return [
            'total' => (clone $baseQuery)->count(),
            'open' => (clone $baseQuery)->where('status', 'open')->count(),
            'in_progress' => (clone $baseQuery)->where('status', 'in_progress')->count(),
            'pending_review' => (clone $baseQuery)->where('status', 'pending_review')->count(),
            'resolved' => (clone $baseQuery)->whereIn('status', ['resolved', 'closed'])->count(),
            'overdue' => (clone $baseQuery)->where('due_date', '<', now())
                ->whereIn('status', ['open', 'in_progress', 'pending_review'])
                ->count(),
            'critical' => (clone $baseQuery)->where('severity', 'critical')->count(),
            'high' => (clone $baseQuery)->where('severity', 'high')->count(),
        ];
    }

    public function show(ComplianceGap $gap)
    {
        $gap->load([
            'checklistRecord',
            'checklistItem',
            'responsibleUser',
            'createdBy',
            'closedBy',
            'handlingLogs.user',
            'evidences.uploadedBy',
        ]);

        $users = User::orderBy('name')->get(['id', 'name', 'role', 'department']);

        return Inertia::render('ComplianceGaps/Show', [
            'gap' => $gap,
            'users' => $users,
            'statuses' => [
                'open' => '待处理',
                'in_progress' => '处理中',
                'pending_review' => '待审核',
                'resolved' => '已解决',
                'closed' => '已关闭',
            ],
            'severities' => [
                'low' => '低',
                'medium' => '中',
                'high' => '高',
                'critical' => '严重',
            ],
        ]);
    }

    public function create()
    {
        $users = User::orderBy('name')->get(['id', 'name', 'role', 'department']);
        $severities = ['low', 'medium', 'high', 'critical'];
        $categories = ['数据安全', '隐私保护', '合规审计', '访问控制', '数据质量'];

        return Inertia::render('ComplianceGaps/Create', [
            'users' => $users,
            'severities' => $severities,
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'severity' => 'required|in:low,medium,high,critical',
            'category' => 'nullable|string',
            'responsible_user_id' => 'nullable|exists:users,id',
            'discovered_date' => 'required|date',
            'due_date' => 'nullable|date',
            'root_cause' => 'nullable|string',
            'corrective_action' => 'nullable|string',
        ]);

        $gap = DB::transaction(function () use ($validated) {
            $gap = ComplianceGap::create([
                ...$validated,
                'status' => 'open',
                'created_by' => auth()->id(),
            ]);

            $gap->addHandlingLog('created', [
                'comment' => '创建合规缺口',
            ]);

            return $gap;
        });

        return redirect()->route('compliance-gaps.show', $gap)
            ->with('success', '合规缺口创建成功');
    }

    public function update(Request $request, ComplianceGap $gap)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'severity' => 'required|in:low,medium,high,critical',
            'category' => 'nullable|string',
            'responsible_user_id' => 'nullable|exists:users,id',
            'discovered_date' => 'required|date',
            'due_date' => 'nullable|date',
            'root_cause' => 'nullable|string',
            'corrective_action' => 'nullable|string',
            'preventive_action' => 'nullable|string',
            'resolution_summary' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $gap) {
            $oldSeverity = $gap->severity;
            $oldResponsible = $gap->responsible_user_id;
            $oldDueDate = $gap->due_date;

            $gap->update($validated);

            if ($oldSeverity !== $validated['severity']) {
                $gap->addHandlingLog('severity_changed', [
                    'old_value' => $oldSeverity,
                    'new_value' => $validated['severity'],
                ]);
            }

            if ($oldResponsible != $validated['responsible_user_id']) {
                $gap->addHandlingLog('assignee_changed', [
                    'old_value' => $oldResponsible,
                    'new_value' => $validated['responsible_user_id'],
                ]);
            }

            if ($oldDueDate != $validated['due_date']) {
                $gap->addHandlingLog('due_date_changed', [
                    'old_value' => $oldDueDate,
                    'new_value' => $validated['due_date'],
                ]);
            }
        });

        return back()->with('success', '更新成功');
    }

    public function updateStatus(Request $request, ComplianceGap $gap)
    {
        $validated = $request->validate([
            'status' => 'required|in:open,in_progress,pending_review,resolved,closed',
            'comment' => 'nullable|string',
        ]);

        $gap->updateStatus($validated['status'], $validated['comment'] ?? null);

        return back()->with('success', '状态已更新');
    }

    public function addComment(Request $request, ComplianceGap $gap)
    {
        $validated = $request->validate([
            'comment' => 'required|string',
        ]);

        $gap->addHandlingLog('comment', [
            'comment' => $validated['comment'],
        ]);

        return back()->with('success', '评论已添加');
    }

    public function uploadEvidence(Request $request, ComplianceGap $gap)
    {
        $validated = $request->validate([
            'file' => 'required|file|max:20480',
            'description' => 'nullable|string',
            'evidence_type' => 'nullable|string',
        ]);

        $file = $request->file('file');
        $path = $file->store('gap-evidences/' . $gap->id, 'public');

        $evidence = $gap->evidences()->create([
            'uploaded_by' => auth()->id(),
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'file_type' => $file->getMimeType(),
            'description' => $validated['description'] ?? null,
            'evidence_type' => $validated['evidence_type'] ?? null,
        ]);

        $gap->addHandlingLog('evidence_added', [
            'new_value' => $evidence->file_name,
            'comment' => '上传证据材料',
        ]);

        return back()->with('success', '证据材料上传成功');
    }

    public function downloadEvidence(GapEvidence $evidence)
    {
        return Storage::disk('public')->download($evidence->file_path, $evidence->file_name);
    }

    public function deleteEvidence(GapEvidence $evidence)
    {
        $evidence->delete();

        return back()->with('success', '证据已删除');
    }

    public function destroy(ComplianceGap $gap)
    {
        $gap->delete();

        return redirect()->route('compliance-gaps.index')
            ->with('success', '合规缺口已删除');
    }

    public function export(Request $request)
    {
        $query = ComplianceGap::with([
            'checklistRecord',
            'responsibleUser',
            'createdBy',
        ]);

        if ($request->input('status')) {
            $query->whereIn('status', (array) $request->input('status'));
        }
        if ($request->input('severity')) {
            $query->whereIn('severity', (array) $request->input('severity'));
        }
        if ($request->input('responsible_user_id')) {
            $query->where('responsible_user_id', $request->input('responsible_user_id'));
        }
        if ($request->input('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->input('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $gaps = $query->orderBy('created_at', 'desc')->get();

        $filename = '合规缺口报告_' . now()->format('YmdHis') . '.csv';

        $callback = function () use ($gaps) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                '缺口编号',
                '标题',
                '状态',
                '严重程度',
                '分类',
                '责任人',
                '发现日期',
                '整改期限',
                '创建人',
                '创建时间',
            ]);

            foreach ($gaps as $gap) {
                fputcsv($handle, [
                    $gap->gap_no,
                    $gap->title,
                    $gap->status,
                    $gap->severity,
                    $gap->category,
                    $gap->responsibleUser?->name ?? '-',
                    $gap->discovered_date,
                    $gap->due_date,
                    $gap->createdBy?->name ?? '-',
                    $gap->created_at,
                ]);
            }

            fclose($handle);
        };

        $this->recordDownload('gap_report', null, $filename, 'csv', 0, $request->all());

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    protected function recordDownload(string $type, $downloadable, string $fileName, string $format, int $size, array $filters = [])
    {
        DownloadLog::create([
            'user_id' => auth()->id(),
            'download_type' => $type,
            'downloadable_id' => $downloadable?->id,
            'downloadable_type' => $downloadable ? get_class($downloadable) : null,
            'file_name' => $fileName,
            'file_format' => $format,
            'file_size' => $size,
            'filter_criteria' => $filters,
            'ip_address' => request()->ip(),
        ]);
    }
}
