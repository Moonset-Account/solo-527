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

            $difference = $this->review->total_amount - $quotation->total_amount;
            if (abs($difference) < 0.01) {
                return;
            }

            $deliveryConfirmation = \App\Models\DeliveryConfirmation::where('quotation_id', $quotation->id)->first();
            if (!$deliveryConfirmation) {
                Log::info("Delivery confirmation not found yet, skip sync", [
                    'review_id' => $this->review->id,
                    'quotation_id' => $quotation->id,
                ]);
                return;
            }

            $firstItem = $quotation->items()->first();
            $severity = $this->calculateSeverity($difference, (float)$quotation->total_amount);
            $status = $this->review->status === 'approved' ? 'resolved' : 'reported';

            $description = trim(($this->review->review_comments ?? '') . "\n" . ($this->review->reject_reason ?? ''));

            $discrepancy = DeliveryDiscrepancy::updateOrCreate(
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
                    'description' => '财务复核差异: ' . $description,
                    'severity' => $severity,
                    'status' => $status,
                    'handling_measures' => $this->review->reject_reason ?? $this->review->review_comments,
                    'resolved_at' => $this->review->status === 'approved' ? $this->review->reviewed_at : null,
                    'handled_by' => $this->review->reviewer_id,
                    'created_by' => $this->review->created_by,
                    'updated_by' => $this->review->reviewer_id,
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
