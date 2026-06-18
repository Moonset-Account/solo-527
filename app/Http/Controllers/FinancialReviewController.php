<?php

namespace App\Http\Controllers;

use App\Enums\ConfigKey;
use App\Jobs\SyncDeliveryDiscrepancyJob;
use App\Models\DeliveryDiscrepancy;
use App\Models\FinancialReview;
use App\Models\Quotation;
use App\Services\ConfigService;
use App\Services\FinancialReviewService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FinancialReviewController extends Controller
{
    public function __construct(
        protected FinancialReviewService $reviewService,
        protected ConfigService $configService,
    ) {}

    public function index(Request $request)
    {
        $quotations = Quotation::with(['supplier', 'items.supply', 'expiryReminders' => function ($q) {
            $q->latest();
        }])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->expiring, function ($q) {
                $days = $this->configService->get(ConfigKey::QUOTATION_EXPIRY_REMINDER_DAYS->value, 7);
                $q->where('valid_until', '<=', now()->addDays($days))
                    ->where('status', '!=', 'expired');
            })
            ->where('status', '!=', 'draft')
            ->latest()
            ->paginate(15);

        $stats = $this->reviewService->getFinancialReviewStats();

        return Inertia::render('FinancialReviews/Index', [
            'quotations' => $quotations,
            'stats' => $stats,
            'filters' => $request->only(['status', 'expiring']),
        ]);
    }

    public function review(Request $request, Quotation $quotation)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected,need_more_info'],
            'review_comments' => ['nullable', 'string', 'max:2000'],
            'is_within_budget' => ['nullable', 'boolean'],
        ]);

        $review = FinancialReview::updateOrCreate(
            [
                'entity_type' => 'quotation',
                'entity_id' => $quotation->id,
                'reviewer_id' => auth()->id(),
            ],
            [
                'entity_code' => $quotation->code ?? $quotation->id,
                'total_amount' => $quotation->total_amount ?? 0,
                'status' => $validated['status'],
                'review_comments' => $validated['review_comments'] ?? null,
                'is_within_budget' => $validated['is_within_budget'] ?? null,
                'reviewer_name' => auth()->user()->name,
                'reviewed_at' => now(),
            ]
        );

        if ($validated['status'] === 'approved') {
            $quotation->update(['status' => 'reviewed']);
        } elseif ($validated['status'] === 'rejected') {
            $quotation->update(['status' => 'rejected']);
        }

        if ($this->configService->getBoolean(ConfigKey::DELIVERY_DISCREPANCY_SYNC_ENABLED->value, true)) {
            SyncDeliveryDiscrepancyJob::dispatch($review);
        }

        activity()
            ->performedOn($quotation)
            ->causedBy(auth()->user())
            ->withProperties([
                'status' => $validated['status'],
            ])
            ->log('financial reviewed');

        return back()->with('success', '财务复核完成');
    }

    public function deliveryDiscrepancies(Request $request)
    {
        $discrepancies = DeliveryDiscrepancy::with(['deliveryConfirmation', 'supply', 'handler'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->type, fn ($q) => $q->where('discrepancy_type', $request->type))
            ->latest()
            ->paginate(20);

        $stats = [
            'total' => DeliveryDiscrepancy::count(),
            'pending' => DeliveryDiscrepancy::where('status', 'reported')->count(),
            'resolved' => DeliveryDiscrepancy::where('status', 'resolved')->count(),
            'total_amount_diff' => DeliveryDiscrepancy::sum('difference'),
        ];

        return Inertia::render('FinancialReviews/DeliveryDiscrepancies', [
            'discrepancies' => $discrepancies,
            'stats' => $stats,
            'filters' => $request->only(['status', 'type']),
        ]);
    }

    public function approve(Request $request, $quotation)
    {
        $quotation = Quotation::findOrFail($quotation);

        $validated = $request->validate([
            'review_comments' => ['nullable', 'string', 'max:2000'],
            'is_within_budget' => ['nullable', 'boolean'],
        ]);

        $review = FinancialReview::updateOrCreate(
            [
                'entity_type' => 'quotation',
                'entity_id' => $quotation->id,
                'reviewer_id' => auth()->id(),
            ],
            [
                'entity_code' => $quotation->code ?? $quotation->id,
                'total_amount' => $quotation->total_amount ?? 0,
                'status' => 'approved',
                'review_comments' => $validated['review_comments'] ?? null,
                'is_within_budget' => $validated['is_within_budget'] ?? null,
                'reviewer_name' => auth()->user()->name,
                'reviewed_at' => now(),
            ]
        );

        $quotation->update(['status' => 'reviewed']);

        if ($this->configService->getBoolean(ConfigKey::DELIVERY_DISCREPANCY_SYNC_ENABLED->value, true)) {
            SyncDeliveryDiscrepancyJob::dispatch($review);
        }

        activity()
            ->performedOn($quotation)
            ->causedBy(auth()->user())
            ->withProperties(['status' => 'approved'])
            ->log('financial approved');

        return back()->with('success', '财务审批已通过');
    }

    public function reject(Request $request, $quotation)
    {
        $quotation = Quotation::findOrFail($quotation);

        $validated = $request->validate([
            'reject_reason' => ['required', 'string', 'max:2000'],
            'review_comments' => ['nullable', 'string', 'max:2000'],
        ]);

        $review = FinancialReview::updateOrCreate(
            [
                'entity_type' => 'quotation',
                'entity_id' => $quotation->id,
                'reviewer_id' => auth()->id(),
            ],
            [
                'entity_code' => $quotation->code ?? $quotation->id,
                'total_amount' => $quotation->total_amount ?? 0,
                'status' => 'rejected',
                'reject_reason' => $validated['reject_reason'],
                'review_comments' => $validated['review_comments'] ?? null,
                'reviewer_name' => auth()->user()->name,
                'reviewed_at' => now(),
            ]
        );

        $quotation->update(['status' => 'rejected']);

        if ($this->configService->getBoolean(ConfigKey::DELIVERY_DISCREPANCY_SYNC_ENABLED->value, true)) {
            SyncDeliveryDiscrepancyJob::dispatch($review);
        }

        activity()
            ->performedOn($quotation)
            ->causedBy(auth()->user())
            ->withProperties([
                'status' => 'rejected',
                'reject_reason' => $validated['reject_reason'],
            ])
            ->log('financial rejected');

        return back()->with('success', '财务已拒绝');
    }

    public function waiveDiscrepancy(Request $request, $discrepancy)
    {
        $discrepancy = DeliveryDiscrepancy::findOrFail($discrepancy);

        $validated = $request->validate([
            'resolution' => ['required', 'string', 'max:2000'],
        ]);

        $discrepancy->resolve(auth()->user(), $validated['resolution']);

        activity()
            ->performedOn($discrepancy)
            ->causedBy(auth()->user())
            ->withProperties([
                'resolution' => $validated['resolution'],
            ])
            ->log('discrepancy waived');

        return back()->with('success', '交付差异已豁免');
    }
}
