<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\Consultation;
use App\Models\ResponseNode;
use App\Models\User;
use App\Models\QuoteVersion;
use App\Models\ChurnReason;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class LeadController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'status' => 'nullable|array',
            'status.*' => 'string',
            'quality' => 'nullable|string|in:A,B,C,D',
            'source' => 'nullable|array',
            'source.*' => 'string',
            'assignee_id' => 'nullable|integer|exists:users,id',
            'owner_id' => 'nullable|integer|exists:users,id',
            'search' => 'nullable|string|max:100',
            'is_in_ocean' => 'nullable|boolean',
            'per_page' => 'nullable|integer|min:10|max:200',
            'sort_by' => 'nullable|string|in:created_at,updated_at,next_follow_at,quality',
            'sort_order' => 'nullable|string|in:asc,desc',
        ]);

        $query = Lead::query()
            ->with(['owner:id,name', 'assignee:id,name', 'quoteVersion:id,version,name'])
            ->filterByPeriod($validated['start_date'] ?? null, $validated['end_date'] ?? null)
            ->byStatus($validated['status'] ?? null)
            ->byQuality($validated['quality'] ?? null)
            ->bySource($validated['source'] ?? null)
            ->byAssignee($validated['assignee_id'] ?? null);

        if (isset($validated['owner_id'])) {
            $query->where('owner_id', $validated['owner_id']);
        }

        if (isset($validated['is_in_ocean'])) {
            $query->where('is_in_ocean', (bool) $validated['is_in_ocean']);
        }

        if (!empty($validated['search'])) {
            $search = "%{$validated['search']}%";
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                    ->orWhere('phone', 'like', $search)
                    ->orWhere('intention', 'like', $search);
            });
        }

        $sortBy = $validated['sort_by'] ?? 'created_at';
        $sortOrder = $validated['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $validated['per_page'] ?? 25;
        $leads = $query->paginate($perPage)->withQueryString();

        $operators = User::whereIn('role', ['admin', 'operator'])
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->toArray();

        return Inertia::render('Leads/Index', [
            'filters' => [
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
                'status' => $validated['status'] ?? [],
                'quality' => $validated['quality'] ?? null,
                'source' => $validated['source'] ?? [],
                'assignee_id' => isset($validated['assignee_id']) ? (int) $validated['assignee_id'] : null,
                'owner_id' => isset($validated['owner_id']) ? (int) $validated['owner_id'] : null,
                'search' => $validated['search'] ?? null,
                'is_in_ocean' => isset($validated['is_in_ocean']) ? (bool) $validated['is_in_ocean'] : null,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
                'per_page' => $perPage,
            ],
            'operators' => $operators,
            'leads' => [
                'data' => $leads->getCollection()->map(function ($lead) {
                    return [
                        'id' => $lead->id,
                        'name' => $lead->name,
                        'phone' => $lead->phone,
                        'gender' => $lead->gender,
                        'gender_label' => $lead->gender_label,
                        'age' => $lead->age,
                        'source' => $lead->source,
                        'source_label' => $lead->source_label,
                        'status' => $lead->status,
                        'status_label' => $lead->status_label,
                        'quality' => $lead->quality,
                        'quality_label' => $lead->quality_label,
                        'assignee_name' => $lead->assignee?->name,
                        'owner_name' => $lead->owner?->name,
                        'quote_version' => $lead->quoteVersion ? "{$lead->quoteVersion->version} {$lead->quoteVersion->name}" : null,
                        'contract_amount' => $lead->contract_amount ? round((float) $lead->contract_amount, 2) : null,
                        'is_in_ocean' => (bool) $lead->is_in_ocean,
                        'next_follow_at' => $lead->next_follow_at?->toDateTimeString(),
                        'created_at' => $lead->created_at?->toDateTimeString(),
                        'updated_at' => $lead->updated_at?->toDateTimeString(),
                    ];
                })->toArray(),
                'current_page' => $leads->currentPage(),
                'last_page' => $leads->lastPage(),
                'per_page' => $leads->perPage(),
                'total' => $leads->total(),
                'from' => $leads->firstItem(),
                'to' => $leads->lastItem(),
            ],
        ]);
    }

    public function create(): Response
    {
        $operators = User::whereIn('role', ['admin', 'operator'])
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->toArray();

        $quoteVersions = QuoteVersion::where('is_active', true)
            ->select('id', 'version', 'name')
            ->orderBy('effective_date', 'desc')
            ->get()
            ->toArray();

        $churnReasons = ChurnReason::where('is_active', true)
            ->select('id', 'name', 'category')
            ->orderBy('sort_order')
            ->get()
            ->toArray();

        return Inertia::render('Leads/Create', [
            'operators' => $operators,
            'quoteVersions' => $quoteVersions,
            'churnReasons' => $churnReasons,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'required|string|max:20|unique:leads,phone',
            'gender' => ['nullable', Rule::in(['male', 'female', 'unknown'])],
            'age' => 'nullable|integer|min:0|max:150',
            'source' => 'required|string|max:50',
            'status' => 'required|string|max:30',
            'quality' => ['nullable', Rule::in(['A', 'B', 'C', 'D'])],
            'intention' => 'nullable|string|max:2000',
            'budget_min' => 'nullable|numeric|min:0',
            'budget_max' => 'nullable|numeric|min:0|gte:budget_min',
            'quote_version_id' => 'nullable|integer|exists:quote_versions,id',
            'assignee_id' => 'nullable|integer|exists:users,id',
            'owner_id' => 'nullable|integer|exists:users,id',
            'next_follow_at' => 'nullable|date',
            'consultation_content' => 'nullable|string|max:5000',
            'consultation_quality' => ['nullable', Rule::in(['A', 'B', 'C', 'D'])],
        ]);

        DB::beginTransaction();
        try {
            $validated['owner_id'] = $validated['owner_id'] ?? auth()->id();
            $validated['assignee_id'] = $validated['assignee_id'] ?? auth()->id();

            $lead = Lead::create($validated);

            if (!empty($validated['consultation_content'])) {
                Consultation::create([
                    'lead_id' => $lead->id,
                    'content' => $validated['consultation_content'],
                    'intention' => $validated['intention'] ?? null,
                    'quality' => $validated['consultation_quality'] ?? $validated['quality'] ?? null,
                    'next_follow_at' => $validated['next_follow_at'] ?? null,
                    'operator_id' => auth()->id(),
                ]);

                ResponseNode::create([
                    'lead_id' => $lead->id,
                    'node_type' => 'first_contact',
                    'content' => '建立档案并首次记录咨询：' . mb_substr($validated['consultation_content'], 0, 200),
                    'operator_id' => auth()->id(),
                ]);
            } else {
                ResponseNode::create([
                    'lead_id' => $lead->id,
                    'node_type' => 'first_contact',
                    'content' => '录入新线索，等待首次联系',
                    'operator_id' => auth()->id(),
                ]);
            }

            DB::commit();
            return redirect()->route('leads.show', $lead)->with('success', '线索创建成功');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => '创建失败：' . $e->getMessage()])->withInput();
        }
    }

    public function show(Request $request, Lead $lead): Response
    {
        $lead->load([
            'owner:id,name',
            'assignee:id,name',
            'quoteVersion.items',
            'churnReason',
            'consultations.operator:id,name',
            'responseNodes.operator:id,name',
        ]);

        $operators = User::whereIn('role', ['admin', 'operator'])
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->toArray();

        $quoteVersions = QuoteVersion::select('id', 'version', 'name')
            ->orderBy('effective_date', 'desc')
            ->get()
            ->toArray();

        $churnReasons = ChurnReason::where('is_active', true)
            ->select('id', 'name', 'category')
            ->orderBy('sort_order')
            ->get()
            ->toArray();

        return Inertia::render('Leads/Show', [
            'lead' => [
                'id' => $lead->id,
                'name' => $lead->name,
                'phone' => $lead->phone,
                'gender' => $lead->gender,
                'gender_label' => $lead->gender_label,
                'age' => $lead->age,
                'source' => $lead->source,
                'source_label' => $lead->source_label,
                'status' => $lead->status,
                'status_label' => $lead->status_label,
                'quality' => $lead->quality,
                'quality_label' => $lead->quality_label,
                'intention' => $lead->intention,
                'budget_min' => $lead->budget_min ? round((float) $lead->budget_min, 2) : null,
                'budget_max' => $lead->budget_max ? round((float) $lead->budget_max, 2) : null,
                'contract_pending_explanation' => $lead->contract_pending_explanation,
                'contract_amount' => $lead->contract_amount ? round((float) $lead->contract_amount, 2) : null,
                'signed_at' => $lead->signed_at?->toDateTimeString(),
                'next_follow_at' => $lead->next_follow_at?->toDateTimeString(),
                'last_follow_at' => $lead->last_follow_at?->toDateTimeString(),
                'is_in_ocean' => (bool) $lead->is_in_ocean,
                'entered_ocean_at' => $lead->entered_ocean_at?->toDateTimeString(),
                'owner' => $lead->owner ? ['id' => $lead->owner->id, 'name' => $lead->owner->name] : null,
                'assignee' => $lead->assignee ? ['id' => $lead->assignee->id, 'name' => $lead->assignee->name] : null,
                'quote_version' => $lead->quoteVersion ? [
                    'id' => $lead->quoteVersion->id,
                    'version' => $lead->quoteVersion->version,
                    'name' => $lead->quoteVersion->name,
                    'description' => $lead->quoteVersion->description,
                    'items' => $lead->quoteVersion->items->map(function ($item) {
                        return [
                            'category' => $item->category,
                            'name' => $item->name,
                            'price' => round((float) $item->price, 2),
                            'unit' => $item->unit,
                        ];
                    })->toArray(),
                ] : null,
                'churn_reason' => $lead->churnReason ? [
                    'id' => $lead->churnReason->id,
                    'name' => $lead->churnReason->name,
                    'category' => $lead->churnReason->category,
                ] : null,
                'consultations' => $lead->consultations->map(function ($c) {
                    return [
                        'id' => $c->id,
                        'content' => $c->content,
                        'intention' => $c->intention,
                        'quality' => $c->quality,
                        'quality_label' => $c->quality_label,
                        'next_follow_at' => $c->next_follow_at?->toDateTimeString(),
                        'operator_name' => $c->operator?->name,
                        'created_at' => $c->created_at?->toDateTimeString(),
                    ];
                })->toArray(),
                'response_nodes' => $lead->responseNodes->map(function ($node) {
                    return [
                        'id' => $node->id,
                        'node_type' => $node->node_type,
                        'node_type_label' => $node->node_type_label,
                        'content' => $node->content,
                        'operator_name' => $node->operator?->name,
                        'operator_id' => $node->operator_id,
                        'created_at' => $node->created_at?->toDateTimeString(),
                    ];
                })->toArray(),
                'created_at' => $lead->created_at?->toDateTimeString(),
                'updated_at' => $lead->updated_at?->toDateTimeString(),
            ],
            'operators' => $operators,
            'quoteVersions' => $quoteVersions,
            'churnReasons' => $churnReasons,
        ]);
    }

    public function edit(Lead $lead): Response
    {
        return $this->show(request(), $lead);
    }

    public function update(Request $request, Lead $lead): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'required|string|max:20|unique:leads,phone,' . $lead->id,
            'gender' => ['nullable', Rule::in(['male', 'female', 'unknown'])],
            'age' => 'nullable|integer|min:0|max:150',
            'source' => 'required|string|max:50',
            'status' => 'required|string|max:30',
            'quality' => ['nullable', Rule::in(['A', 'B', 'C', 'D'])],
            'intention' => 'nullable|string|max:2000',
            'budget_min' => 'nullable|numeric|min:0',
            'budget_max' => 'nullable|numeric|min:0',
            'quote_version_id' => 'nullable|integer|exists:quote_versions,id',
            'churn_reason_id' => 'nullable|integer|exists:churn_reasons,id',
            'owner_id' => 'nullable|integer|exists:users,id',
            'assignee_id' => 'nullable|integer|exists:users,id',
            'contract_pending_explanation' => 'nullable|string|max:1000',
            'contract_amount' => 'nullable|numeric|min:0',
            'signed_at' => 'nullable|date',
            'next_follow_at' => 'nullable|date',
            'is_in_ocean' => 'nullable|boolean',
        ]);

        $oldStatus = $lead->status;
        $oldAssignee = $lead->assignee_id;

        DB::beginTransaction();
        try {
            $lead->update($validated);

            $nodeType = null;
            $content = null;

            if ($oldStatus !== $validated['status']) {
                $statusMap = [
                    'contacted' => ['first_contact', '首次联系成功'],
                    'consulting' => ['consultation', '进入深度咨询阶段'],
                    'quoted' => ['quote_sent', '完成报价'],
                    'contract_pending' => ['contract_sent', '进入合同待确认阶段'],
                    'signed' => ['contract_signed', '合同已签署'],
                    'treatment' => ['treatment_arranged', '已安排治疗'],
                    'lost' => ['lost', '客户已流失'],
                ];
                if (isset($statusMap[$validated['status']])) {
                    [$nodeType, $base] = $statusMap[$validated['status']];
                    $content = $base;
                    if ($validated['status'] === 'contract_pending' && !empty($validated['contract_pending_explanation'])) {
                        $content .= "：原因 - {$validated['contract_pending_explanation']}";
                    }
                    if ($validated['status'] === 'signed' && !empty($validated['contract_amount'])) {
                        $content .= "，合同金额：{$validated['contract_amount']}元";
                    }
                }
            }

            if ($oldAssignee != ($validated['assignee_id'] ?? null)) {
                $newOwner = User::find($validated['assignee_id']);
                $nodeType = $nodeType ?? 'follow_up';
                $content = ($content ? $content . '；' : '') . '责任人变更为：' . ($newOwner->name ?? '未分配');
            }

            if ($nodeType && $content) {
                ResponseNode::create([
                    'lead_id' => $lead->id,
                    'node_type' => $nodeType,
                    'content' => $content,
                    'operator_id' => auth()->id(),
                ]);
            }

            DB::commit();
            return redirect()->route('leads.show', $lead)->with('success', '线索更新成功');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => '更新失败：' . $e->getMessage()])->withInput();
        }
    }

    public function storeConsultation(Request $request, Lead $lead): RedirectResponse
    {
        $validated = $request->validate([
            'content' => 'required|string|max:5000',
            'intention' => 'nullable|string|max:2000',
            'quality' => ['nullable', Rule::in(['A', 'B', 'C', 'D'])],
            'next_follow_at' => 'nullable|date',
        ]);

        DB::beginTransaction();
        try {
            $consultation = Consultation::create([
                'lead_id' => $lead->id,
                'content' => $validated['content'],
                'intention' => $validated['intention'] ?? null,
                'quality' => $validated['quality'] ?? null,
                'next_follow_at' => $validated['next_follow_at'] ?? null,
                'operator_id' => auth()->id(),
            ]);

            $update = [
                'last_follow_at' => now(),
            ];
            if (!empty($validated['quality'])) {
                $update['quality'] = $validated['quality'];
            }
            if (!empty($validated['intention'])) {
                $update['intention'] = $validated['intention'];
            }
            if (!empty($validated['next_follow_at'])) {
                $update['next_follow_at'] = $validated['next_follow_at'];
            }
            $lead->update($update);

            ResponseNode::create([
                'lead_id' => $lead->id,
                'node_type' => 'consultation',
                'content' => '新增咨询记录：' . mb_substr($validated['content'], 0, 200),
                'operator_id' => auth()->id(),
            ]);

            DB::commit();
            return back()->with('success', '咨询记录保存成功');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => '保存失败：' . $e->getMessage()])->withInput();
        }
    }

    public function storeResponseNode(Request $request, Lead $lead): RedirectResponse
    {
        $validated = $request->validate([
            'node_type' => 'required|string|max:50',
            'content' => 'required|string|max:5000',
        ]);

        try {
            ResponseNode::create([
                'lead_id' => $lead->id,
                'node_type' => $validated['node_type'],
                'content' => $validated['content'],
                'operator_id' => auth()->id(),
            ]);
            return back()->with('success', '响应节点已记录');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => '记录失败：' . $e->getMessage()])->withInput();
        }
    }
}
