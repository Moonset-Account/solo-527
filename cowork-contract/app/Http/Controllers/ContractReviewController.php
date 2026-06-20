<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReviewContractRequest;
use App\Models\Contract;
use App\Services\OperationLogService;
use Inertia\Inertia;
use Inertia\Response;

class ContractReviewController extends Controller
{
    public function __construct(private OperationLogService $logService) {}

    public function pending(): Response
    {
        $contracts = Contract::with(['property', 'tenant', 'consultant'])
            ->where('status', 'pending_approval')
            ->orderByDesc('id')
            ->paginate(15);

        return Inertia::render('Reviews/Pending', [
            'contracts' => $contracts,
        ]);
    }

    public function review(ReviewContractRequest $request, Contract $contract)
    {
        if (!$request->user()->isAdmin()) {
            abort(403, '仅管理员可审核合同');
        }

        $data = $request->validated();
        $data['approved_by'] = $request->user()->id;
        $data['approved_at'] = now();

        if ($data['status'] === 'approved') {
            $data['reject_reason'] = null;
        }

        $contract->update($data);

        $this->logService->log(
            $request->user(),
            'review_contract',
            Contract::class,
            $contract->id,
            $data
        );

        return redirect()->route('reviews.pending')
            ->with('success', $data['status'] === 'approved' ? '合同已批准' : '合同已驳回');
    }
}
