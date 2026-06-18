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
            'status' => ['required', 'in:approved,rejected,needs_revision'],
            'reviewed_amount' => ['nullable', 'numeric', 'min:0'],
            'comments' => ['nullable', 'string', 'max:2000'],
            'discrepancy_type' => ['nullable', 'in:price,quantity,specification,other'],
            'discrepancy_details' => ['nullable', 'array'],
        ]);

        $review = FinancialReview::updateOrCreate(
            [
                'quotation_id' => $quotation->id,
                'reviewer_id' => auth()->id(),
            ],
            [
                'status' => $validated['status'],
                'reviewed_amount' => $validated['reviewed_amount'] ?? $quotation->total_amount,
                'comments' => $validated['comments'] ?? null,
                'discrepancy_type' => $validated['discrepancy_type'] ?? null,
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
                'reviewed_amount' => $validated['reviewed_amount'] ?? null,
            ])
            ->log('financial reviewed');

        return back()->with('success', '财务复核完成');
    }

    public function deliveryDiscrepancies(Request $request)
    {
        $discrepancies = DeliveryDiscrepancy::with(['quotation', 'reviewer'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->type, fn ($q) => $q->where('discrepancy_type', $request->type))
            ->latest()
            ->paginate(20);

        $stats = [
            'total' => DeliveryDiscrepancy::count(),
            'pending' => DeliveryDiscrepancy::where('status', 'pending')->count(),
            'resolved' => DeliveryDiscrepancy::where('status', 'resolved')->count(),
            'total_amount_diff' => DeliveryDiscrepancy::sum('difference'),
        ];

        return Inertia::render('FinancialReviews/DeliveryDiscrepancies', [
            'discrepancies' => $discrepancies,
            'stats' => $stats,
            'filters' => $request->only(['status', 'type']),
        ]);
    }
}
