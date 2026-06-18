<?php

namespace App\Jobs;

use App\Models\DeliveryDiscrepancy;
use App\Models\FinancialReview;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncDeliveryDiscrepancyJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;

    public function __construct(
        protected FinancialReview $review,
    ) {}

    public function handle(): void
    {
        try {
            $quotation = \App\Models\Quotation::find($this->review->entity_id);
            if (!$quotation) {
                Log::warning("Quotation not found for financial review", [
                    'review_id' => $this->review->id,
                    'entity_id' => $this->review->entity_id,
                ]);
                return;
            }

            $firstItem = $quotation->items()->first();
            $difference = $this->review->total_amount - $quotation->total_amount;
            $severity = $this->calculateSeverity($difference, $quotation->total_amount);
            $status = $this->review->status === 'approved' ? 'resolved' : 'reported';

            $description = trim(($this->review->review_comments ?? '') . "\n" . ($this->review->reject_reason ?? ''));

            $discrepancy = DeliveryDiscrepancy::updateOrCreate(
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
                    'description' => $description,
                    'severity' => $severity,
                    'status' => $status,
                    'handling_measures' => $this->review->review_comments,
                    'resolved_at' => $this->review->status === 'approved' ? $this->review->reviewed_at : null,
                    'handled_by' => $this->review->reviewer_id,
                ]
            );

            Log::info("Delivery discrepancy synced", [
                'review_id' => $this->review->id,
                'discrepancy_id' => $discrepancy->id,
            ]);
        } catch (\Exception $e) {
            Log::error("SyncDeliveryDiscrepancyJob failed: {$e->getMessage()}", [
                'review_id' => $this->review->id,
                'exception' => $e,
            ]);
            throw $e;
        }
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
