<?php

namespace App\Http\Controllers;

use App\Enums\PurchaseRequestStatus;
use App\Http\Requests\PurchaseRequest\StorePurchaseRequestRequest;
use App\Models\ApprovalFlow;
use App\Models\PurchaseRequest;
use App\Models\Supply;
use App\Services\ApprovalService;
use App\Services\ConfigService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PurchaseRequestController extends Controller
{
    public function __construct(
        protected ApprovalService $approvalService,
        protected ConfigService $configService,
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();

        $prs = PurchaseRequest::with(['requester', 'items.supply', 'currentStep', 'approvalRecords.approver'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when(!$user->isAdmin() && !$user->isProcurementStaff(), function ($q) use ($user) {
                $q->where('requester_id', $user->id);
            })
            ->latest()
            ->paginate(15);

        $statuses = array_map(fn ($s) => [
            'value' => $s->value,
            'label' => $s->label(),
        ], PurchaseRequestStatus::cases());

        return Inertia::render('PurchaseRequests/Index', [
            'purchase_requests' => $prs,
            'statuses' => $statuses,
            'filters' => $request->only(['status']),
        ]);
    }

    public function create()
    {
        $supplies = Supply::where('is_active', true)->with('category')->get();
        $approvalFlows = ApprovalFlow::active()->forEntity('purchase_request')->get();

        return Inertia::render('PurchaseRequests/Create', [
            'supplies' => $supplies,
            'approval_flows' => $approvalFlows,
        ]);
    }

    public function store(StorePurchaseRequestRequest $request)
    {
        $pr = PurchaseRequest::create(array_merge(
            $request->safe()->except('items'),
            [
                'requester_id' => auth()->id(),
                'status' => PurchaseRequestStatus::DRAFT,
            ]
        ));

        foreach ($request->items as $item) {
            $pr->items()->create([
                'supply_id' => $item['supply_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'] ?? null,
                'note' => $item['note'] ?? null,
            ]);
        }

        $pr->update(['total_amount' => $pr->items->sum(fn ($i) => $i->quantity * ($i->unit_price ?? 0))]);

        return redirect()->route('purchase-requests.show', $pr)->with('success', '采购申请已创建');
    }

    public function show(PurchaseRequest $purchaseRequest)
    {
        $purchaseRequest->load([
            'requester',
            'items.supply.specAttachments',
            'approvalFlow.steps.approvers',
            'currentStep',
            'approvalRecords.approver',
        ]);

        $canApprove = $this->approvalService->canUserApprove(auth()->user(), $purchaseRequest);
        $approvalHistory = $this->approvalService->getApprovalHistory($purchaseRequest);

        return Inertia::render('PurchaseRequests/Show', [
            'purchase_request' => $purchaseRequest,
            'can_approve' => $canApprove,
            'approval_history' => $approvalHistory,
        ]);
    }

    public function submit(Request $request, PurchaseRequest $purchaseRequest)
    {
        if ($purchaseRequest->requester_id !== auth()->id() && !auth()->user()->isAdmin()) {
            abort(403);
        }

        if ($purchaseRequest->status !== PurchaseRequestStatus::DRAFT) {
            return back()->with('error', '只有草稿状态可以提交');
        }

        if ($this->configService->getBoolean('approval_enabled', true)) {
            $this->approvalService->startApproval($purchaseRequest, auth()->user());
        } else {
            $purchaseRequest->update(['status' => PurchaseRequestStatus::APPROVED, 'approved_at' => now()]);
        }

        return back()->with('success', '采购申请已提交审批');
    }

    public function approve(Request $request, PurchaseRequest $purchaseRequest)
    {
        $validated = $request->validate([
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->approvalService->approvePurchaseRequest(
            $purchaseRequest,
            auth()->user(),
            $validated['comment'] ?? ''
        );

        return back()->with('success', '审批已通过');
    }

    public function reject(Request $request, PurchaseRequest $purchaseRequest)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $this->approvalService->rejectPurchaseRequest(
            $purchaseRequest,
            auth()->user(),
            $validated['reason']
        );

        return back()->with('success', '采购申请已拒绝');
    }
}
