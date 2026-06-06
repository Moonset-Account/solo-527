<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Booking;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentService
{
    public function createPayment(Booking $booking, string $method, float $amount = null): Payment
    {
        if ($booking->status !== 'pending' && $booking->status !== 'confirmed') {
            throw new \Exception('订单状态不允许支付');
        }

        $amount = $amount ?? $booking->total_amount;

        if ($amount <= 0) {
            throw new \Exception('支付金额必须大于0');
        }

        return DB::transaction(function () use ($booking, $method, $amount) {
            $payment = Payment::create([
                'booking_id' => $booking->id,
                'user_id' => $booking->visitor_id,
                'amount' => $amount,
                'type' => 'booking',
                'method' => $method,
                'status' => 'pending',
            ]);

            return $payment;
        });
    }

    public function processPaymentCallback(string $transactionNo, array $callbackData): Payment
    {
        $payment = Payment::where('transaction_no', $transactionNo)->first();

        if (!$payment) {
            throw new \Exception('支付记录不存在');
        }

        if ($payment->status !== 'pending') {
            return $payment;
        }

        $isSuccess = $callbackData['success'] ?? false;
        $thirdPartyNo = $callbackData['third_party_no'] ?? null;

        return DB::transaction(function () use ($payment, $isSuccess, $thirdPartyNo, $callbackData) {
            $payment->update([
                'status' => $isSuccess ? 'success' : 'failed',
                'third_party_no' => $thirdPartyNo,
                'callback_data' => $callbackData,
                'paid_at' => $isSuccess ? now() : null,
            ]);

            if ($isSuccess && $payment->booking) {
                $booking = $payment->booking;
                if ($booking->status === 'pending' || $booking->status === 'confirmed') {
                    $booking->update([
                        'status' => 'paid',
                        'is_locked' => false,
                        'lock_key' => null,
                        'lock_expires_at' => null,
                    ]);
                }
            }

            Log::info('支付回调处理完成', [
                'transaction_no' => $transactionNo,
                'success' => $isSuccess,
            ]);

            return $payment->fresh();
        });
    }

    public function refundPayment(Payment $payment, float $amount = null, string $reason = ''): Payment
    {
        if (!$payment->isSuccessful()) {
            throw new \Exception('只有成功的支付才能退款');
        }

        $refundAmount = $amount ?? $payment->amount;

        if ($refundAmount > $payment->amount) {
            throw new \Exception('退款金额不能大于支付金额');
        }

        return DB::transaction(function () use ($payment, $refundAmount, $reason) {
            $refund = Payment::create([
                'booking_id' => $payment->booking_id,
                'user_id' => $payment->user_id,
                'amount' => -$refundAmount,
                'type' => 'refund',
                'method' => $payment->method,
                'status' => 'success',
                'paid_at' => now(),
                'remark' => $reason,
            ]);

            $newStatus = ($refundAmount == $payment->amount) ? 'refunded' : 'partial_refund';
            $payment->update(['status' => $newStatus]);

            if ($payment->booking) {
                $booking = $payment->booking;
                $totalRefund = $booking->refund_amount + $refundAmount;
                $booking->update([
                    'refund_amount' => $totalRefund,
                    'status' => $totalRefund >= $booking->total_amount ? 'refunded' : $booking->status,
                ]);
            }

            return $refund;
        });
    }

    public function getBookingPayments(int $bookingId)
    {
        return Payment::where('booking_id', $bookingId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function getUserPayments(int $userId, string $type = null)
    {
        $query = Payment::where('user_id', $userId)->orderByDesc('created_at');

        if ($type) {
            $query->where('type', $type);
        }

        return $query->get();
    }
}
