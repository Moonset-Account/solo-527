<?php

namespace App\Http\Controllers;

use App\Http\Requests\ApprovalFlow\StoreApprovalFlowRequest;
use App\Models\ApprovalFlow;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ApprovalFlowController extends Controller
{
    public function index(Request $request)
    {
        $flows = ApprovalFlow::with('steps.approvers')
            ->when($request->entity_type, fn ($q) => $q->where('entity_type', $request->entity_type))
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->latest()
            ->paginate(15);

        return Inertia::render('ApprovalFlows/Index', [
            'flows' => $flows,
            'filters' => $request->only(['entity_type', 'search']),
        ]);
    }

    public function create()
    {
        $roles = Role::all();
        $users = User::where('is_active', true)->get();

        return Inertia::render('ApprovalFlows/Create', [
            'roles' => $roles,
            'users' => $users,
        ]);
    }

    public function store(StoreApprovalFlowRequest $request)
    {
        $flow = ApprovalFlow::create($request->safe()->except('steps'));

        if ($request->has('steps')) {
            foreach ($request->steps as $index => $step) {
                $flowStep = $flow->steps()->create([
                    'step_order' => $index + 1,
                    'name' => $step['name'],
                    'description' => $step['description'] ?? null,
                    'role_id' => $step['role_id'] ?? null,
                    'approval_type' => $step['approval_type'] ?? 'any',
                    'min_approvers' => $step['min_approvers'] ?? 1,
                    'can_delegate' => $step['can_delegate'] ?? false,
                    'timeout_hours' => $step['timeout_hours'] ?? 48,
                ]);

                if (isset($step['approver_ids'])) {
                    $flowStep->approvers()->attach($step['approver_ids']);
                }
            }
        }

        activity()
            ->performedOn($flow)
            ->causedBy(auth()->user())
            ->log('created');

        return redirect()->route('approval-flows.show', $flow)->with('success', '审批流已创建');
    }

    public function show(ApprovalFlow $approvalFlow)
    {
        $approvalFlow->load('steps.approvers');

        return Inertia::render('ApprovalFlows/Show', [
            'flow' => $approvalFlow,
        ]);
    }

    public function edit(ApprovalFlow $approvalFlow)
    {
        $approvalFlow->load('steps.approvers');
        $roles = Role::all();
        $users = User::where('is_active', true)->get();

        return Inertia::render('ApprovalFlows/Edit', [
            'flow' => $approvalFlow,
            'roles' => $roles,
            'users' => $users,
        ]);
    }

    public function update(StoreApprovalFlowRequest $request, ApprovalFlow $approvalFlow)
    {
        $approvalFlow->update($request->safe()->except('steps'));

        if ($request->has('steps')) {
            $approvalFlow->steps()->delete();

            foreach ($request->steps as $index => $step) {
                $flowStep = $approvalFlow->steps()->create([
                    'step_order' => $index + 1,
                    'name' => $step['name'],
                    'description' => $step['description'] ?? null,
                    'role_id' => $step['role_id'] ?? null,
                    'approval_type' => $step['approval_type'] ?? 'any',
                    'min_approvers' => $step['min_approvers'] ?? 1,
                    'can_delegate' => $step['can_delegate'] ?? false,
                    'timeout_hours' => $step['timeout_hours'] ?? 48,
                ]);

                if (isset($step['approver_ids'])) {
                    $flowStep->approvers()->attach($step['approver_ids']);
                }
            }
        }

        activity()
            ->performedOn($approvalFlow)
            ->causedBy(auth()->user())
            ->withProperties(['changes' => $approvalFlow->getChanges()])
            ->log('updated');

        return redirect()->route('approval-flows.show', $approvalFlow)->with('success', '审批流已更新');
    }

    public function destroy(ApprovalFlow $approvalFlow)
    {
        $approvalFlow->delete();

        return redirect()->route('approval-flows.index')->with('success', '审批流已删除');
    }
}
