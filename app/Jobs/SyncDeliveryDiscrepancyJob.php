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
            $discrepancy = DeliveryDiscrepancy::updateOrCreate(
                ['financial_review_id' => $this->review->id],
                [
                    'quotation_id' => $this->review->quotation_id,
                    'reviewer_id' => $this->review->reviewer_id,
                    'discrepancy_type' => $this->review->discrepancy_type ?? 'price',
                    'expected_amount' => $this->review->quotation?->total_amount ?? 0,
                    'actual_amount' => $this->review->reviewed_amount ?? 0,
                    'difference' => ($this->review->reviewed_amount ?? 0) - ($this->review->quotation?->total_amount ?? 0),
                    'description' => $this->review->comments ?? '',
                    'status' => $this->review->status === 'approved' ? 'resolved' : 'pending',
                    'synced_at' => now(),
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
}
