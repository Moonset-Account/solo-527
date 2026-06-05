<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApprovalFlowResource;
use App\Models\ApprovalFlow;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ApprovalController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', ApprovalFlow::class);

        $query = ApprovalFlow::with(['approver']);

        if ($request->filled('approvable_type')) {
            $query->where('approvable_type', $request->approvable_type);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        return ApprovalFlowResource::collection(
            $query->paginate(20)
        );
    }

    public function approve(Request $request, int $id): ApprovalFlowResource
    {
        $approvalFlow = ApprovalFlow::findOrFail($id);

        $this->authorize('approve', $approvalFlow);

        $approvalFlow->update([
            'action' => 'approve',
            'comment' => $request->input('comment'),
        ]);

        return new ApprovalFlowResource($approvalFlow->load(['approver']));
    }

    public function reject(Request $request, int $id): ApprovalFlowResource
    {
        $approvalFlow = ApprovalFlow::findOrFail($id);

        $this->authorize('reject', $approvalFlow);

        $approvalFlow->update([
            'action' => 'reject',
            'comment' => $request->input('comment'),
        ]);

        return new ApprovalFlowResource($approvalFlow->load(['approver']));
    }

    public function withdraw(Request $request, int $id): ApprovalFlowResource
    {
        $approvalFlow = ApprovalFlow::findOrFail($id);

        $this->authorize('withdraw', $approvalFlow);

        $approvalFlow->update([
            'action' => 'withdraw',
            'comment' => $request->input('comment'),
        ]);

        return new ApprovalFlowResource($approvalFlow->load(['approver']));
    }
}
