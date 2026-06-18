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
            ->whereIn('status', ['approved', 'rejected'])
            ->chunk(50, function ($reviews) use (&$count) {
                foreach ($reviews as $review) {
                    $quotation = \App\Models\Quotation::find($review->entity_id);
                    if (!$quotation) {
                        continue;
                    }

                    $purchaseRequest = $quotation->purchaseRequest;
                    if (!$purchaseRequest) {
                        continue;
                    }

                    $difference = $review->total_amount - $quotation->total_amount;
                    if (abs($difference) < 0.01) {
                        continue;
                    }

                    $deliveryConfirmation = \App\Models\DeliveryConfirmation::where('quotation_id', $quotation->id)->first();
                    if (!$deliveryConfirmation) {
                        continue;
                    }

                    $firstItem = $quotation->items()->first();
                    $severity = $this->calculateSeverity($difference, (float)$quotation->total_amount);
                    $status = $review->status === 'approved' ? 'resolved' : 'reported';

                    \App\Models\DeliveryDiscrepancy::updateOrCreate(
                        [
                            'delivery_id' => $deliveryConfirmation->id,
                            'supply_id' => $firstItem?->supply_id,
                            'discrepancy_type' => 'price',
                        ],
                        [
                            'delivery_id' => $deliveryConfirmation->id,
                            'supply_id' => $firstItem?->supply_id,
                            'supply_name' => $firstItem?->supply_name ?? 'N/A',
                            'specification' => $firstItem?->specification,
                            'unit' => $firstItem?->unit,
                            'discrepancy_type' => 'price',
                            'expected_quantity' => 0,
                            'actual_quantity' => 0,
                            'difference' => $difference,
                            'description' => '财务复核差异: ' . ($review->review_comments ?? ''),
                            'severity' => $severity,
                            'status' => $status,
                            'handling_measures' => $review->reject_reason ?? $review->review_comments,
                            'resolved_at' => $review->status === 'approved' ? $review->reviewed_at : null,
                            'handled_by' => $review->reviewer_id,
                            'created_by' => $review->created_by,
                            'updated_by' => $review->reviewer_id,
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
