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
            'total_reviewed_amount' => FinancialReview::whereIn('status', ['approved', 'rejected'])->sum('total_amount'),
            'pending_amount' => FinancialReview::where('status', 'pending')->sum('total_amount'),
        ];
    }

    public function syncDiscrepanciesToDashboard(): int
    {
        $count = 0;

        FinancialReview::where('entity_type', 'quotation')
            ->chunk(50, function ($reviews) use (&$count) {
                foreach ($reviews as $review) {
                    $quotation = \App\Models\Quotation::find($review->entity_id);
                    if (!$quotation) {
                        continue;
                    }

                    $firstItem = $quotation->items()->first();
                    $difference = $review->total_amount - $quotation->total_amount;
                    $severity = $this->calculateSeverity($difference, $quotation->total_amount);
                    $status = $review->status === 'approved' ? 'resolved' : 'reported';

                    DeliveryDiscrepancy::updateOrCreate(
                        [
                            'supply_id' => $firstItem?->supply_id,
                            'discrepancy_type' => 'price',
                        ],
                        [
                            'delivery_id' => null,
                            'supply_id' => $firstItem?->supply_id,
                            'supply_name' => $firstItem?->supply_name ?? 'N/A',
                            'specification' => $firstItem?->specification,
                            'unit' => $firstItem?->unit,
                            'discrepancy_type' => 'price',
                            'expected_quantity' => 0,
                            'actual_quantity' => 0,
                            'difference' => $difference,
                            'description' => $review->review_comments,
                            'severity' => $severity,
                            'status' => $status,
                            'handling_measures' => $review->review_comments,
                            'resolved_at' => $review->status === 'approved' ? $review->reviewed_at : null,
                            'handled_by' => $review->reviewer_id,
                        ]
                    );

                    $count++;
                }
            });

        return $count;
    }

    protected function calculateSeverity(float $difference, float $totalAmount): string
    {
        if ($totalAmount == 0) {
            return 'minor';
        }

        $percentage = abs($difference) / $totalAmount * 100;

        if ($percentage >= 20) {
            return 'critical';
        } elseif ($percentage >= 10) {
            return 'major';
        }

        return 'minor';
    }
}
