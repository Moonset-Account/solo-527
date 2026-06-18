<?php

namespace App\Services;

use App\Models\DeliveryDiscrepancy;
use App\Models\FinancialReview;

class FinancialReviewService
{
    public function __construct(protected NotificationService $notificationService) {}

    public function getFinancialReviewStats(): array
    {
        return [
            'total' => FinancialReview::count(),
            'pending' => FinancialReview::where('status', 'pending')->count(),
            'approved' => FinancialReview::where('status', 'approved')->count(),
            'rejected' => FinancialReview::where('status', 'rejected')->count(),
            'needs_revision' => FinancialReview::where('status', 'needs_revision')->count(),
            'total_reviewed_amount' => FinancialReview::whereIn('status', ['approved', 'rejected'])->sum('reviewed_amount'),
            'pending_amount' => FinancialReview::where('status', 'pending')->sum('reviewed_amount'),
        ];
    }

    public function syncDiscrepanciesToDashboard(): int
    {
        $count = 0;

        FinancialReview::where('synced_to_dashboard', false)
            ->orWhereNull('synced_to_dashboard')
            ->chunk(50, function ($reviews) use (&$count) {
                foreach ($reviews as $review) {
                    $quotation = $review->quotation;
                    $expected = $quotation?->total_amount ?? 0;
                    $actual = $review->reviewed_amount ?? $expected;

                    DeliveryDiscrepancy::updateOrCreate(
                        ['financial_review_id' => $review->id],
                        [
                            'quotation_id' => $review->quotation_id,
                            'reviewer_id' => $review->reviewer_id,
                            'discrepancy_type' => $review->discrepancy_type ?? 'price',
                            'expected_amount' => $expected,
                            'actual_amount' => $actual,
                            'difference' => $actual - $expected,
                            'description' => $review->comments ?? '',
                            'status' => $review->status === 'approved' ? 'resolved' : 'pending',
                            'synced_at' => now(),
                        ]
                    );

                    $review->update(['synced_to_dashboard' => true]);
                    $count++;
                }
            });

        return $count;
    }
}
