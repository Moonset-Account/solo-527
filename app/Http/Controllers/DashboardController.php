<?php

namespace App\Http\Controllers;

use App\Enums\PurchaseRequestStatus;
use App\Enums\QuotationStatus;
use App\Enums\SupplierRiskLevel;
use App\Models\PurchaseRequest;
use App\Models\Quotation;
use App\Models\Supply;
use App\Models\Supplier;
use App\Services\ApprovalService;
use App\Services\FinancialReviewService;
use App\Services\ProcurementService;
use App\Services\QuotationService;
use App\Services\SupplierRiskService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        protected ProcurementService $procurementService,
        protected QuotationService $quotationService,
        protected ApprovalService $approvalService,
        protected SupplierRiskService $supplierRiskService,
        protected FinancialReviewService $financialReviewService,
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();

        $stats = [
            'purchase_requests' => $this->procurementService->getPurchaseRequestStats($user),
            'quotations' => $this->quotationService->getQuotationStats($user),
            'suppliers' => $this->supplierRiskService->getSupplierRiskStats(),
        ];

        if ($user->can('view supplies')) {
            $stats['supplies'] = [
                'total' => Supply::count(),
                'active' => Supply::where('is_active', true)->count(),
                'low_stock' => Supply::whereRaw('stock_quantity <= safety_stock')->count(),
            ];
        }

        if ($user->can('approve purchase requests')) {
            $stats['pending_approvals'] = $this->approvalService
                ->getPendingApprovalsForUser($user)
                ->count();
        }

        if ($user->hasRole(['financial_manager', 'financial_staff'])) {
            $stats['financial_reviews'] = $this->financialReviewService->getFinancialReviewStats();
        }

        $recentPRs = PurchaseRequest::with('requester')
            ->when(!$user->isAdmin() && !$user->isProcurementStaff(), function ($q) use ($user) {
                $q->where('requester_id', $user->id);
            })
            ->latest()
            ->limit(5)
            ->get();

        $pendingApprovals = collect();
        if ($user->can('approve purchase requests')) {
            $pendingApprovals = $this->approvalService
                ->getPendingApprovalsForUser($user)
                ->with(['purchaseRequest.requester', 'step'])
                ->limit(5)
                ->get();
        }

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'recent_purchase_requests' => $recentPRs,
            'pending_approvals' => $pendingApprovals,
        ]);
    }
}
