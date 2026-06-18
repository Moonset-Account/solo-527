<?php

namespace App\Jobs;

use App\Enums\BatchStatus;
use App\Models\FailedBatch;
use App\Models\Quotation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProcessPaymentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [300, 600, 1800];

    public function __construct(
        protected Quotation $quotation,
        protected string $gateway = 'mock',
    ) {}

    public function handle(): void
    {
        try {
            $result = $this->processPayment();

            if (!$result['success']) {
                $this->fail(new \RuntimeException($result['message'] ?? 'Payment failed'));
            }

            $this->quotation->update([
                'payment_status' => 'paid',
                'paid_at' => now(),
                'payment_transaction_id' => $result['transaction_id'] ?? null,
            ]);

            Log::info("Payment processed successfully", [
                'quotation_id' => $this->quotation->id,
                'gateway' => $this->gateway,
                'transaction_id' => $result['transaction_id'] ?? null,
            ]);
        } catch (\Exception $e) {
            Log::error("ProcessPaymentJob failed: {$e->getMessage()}", [
                'quotation_id' => $this->quotation->id,
                'gateway' => $this->gateway,
                'exception' => $e,
            ]);
            throw $e;
        }
    }

    protected function processPayment(): array
    {
        if ($this->gateway === 'mock') {
            return [
                'success' => true,
                'transaction_id' => 'MOCK_' . uniqid(),
                'amount' => $this->quotation->total_amount,
            ];
        }

        $gatewayUrl = config("services.payment.{$this->gateway}.url");
        $apiKey = config("services.payment.{$this->gateway}.key");

        if (!$gatewayUrl || !$apiKey) {
            return ['success' => false, 'message' => 'Payment gateway not configured'];
        }

        $response = Http::timeout(config('services.payment.timeout', 30))
            ->withToken($apiKey)
            ->post("{$gatewayUrl}/pay", [
                'order_id' => $this->quotation->id,
                'amount' => $this->quotation->total_amount,
                'currency' => 'CNY',
                'description' => "采购报价单 #{$this->quotation->id}",
            ]);

        if (!$response->successful()) {
            return ['success' => false, 'message' => 'Gateway error: ' . $response->body()];
        }

        return $response->json();
    }

    public function failed(\Throwable $exception): void
    {
        FailedBatch::create([
            'batch_type' => 'payment',
            'channel' => $this->gateway,
            'payload' => json_encode([
                'quotation_id' => $this->quotation->id,
                'amount' => $this->quotation->total_amount,
            ]),
            'error_message' => $exception->getMessage(),
            'status' => BatchStatus::FAILED->value,
            'retry_count' => 0,
            'next_retry_at' => now()->addMinutes(30),
        ]);
    }
}
