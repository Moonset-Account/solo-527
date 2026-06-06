<?php

namespace App\Services;

use App\Models\ParkingViolation;
use App\Models\ViolationAppeal;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ViolationService
{
    const APPEAL_LOCK_DAYS = 7;
    const FINE_AMOUNTS = [
        'no_booking' => 200,
        'overtime' => 100,
        'wrong_spot' => 150,
        'unauthorized' => 300,
    ];

    public function createViolation(array $data): ParkingViolation
    {
        $spotId = $data['spot_id'];
        $licensePlate = strtoupper($data['license_plate']);
        $violationTime = Carbon::parse($data['violation_time'] ?? now());
        $type = $data['type'];

        $existingLock = ParkingViolation::where('spot_id', $spotId)
            ->where('license_plate', $licensePlate)
            ->where('type', $type)
            ->where('has_appeal', true)
            ->where('appeal_lock_until', '>', now())
            ->exists();

        if ($existingLock) {
            throw new \Exception('该车辆违停正在申诉中，暂不能重复罚款');
        }

        $fineAmount = self::FINE_AMOUNTS[$type] ?? 100;

        return DB::transaction(function () use ($data, $licensePlate, $violationTime, $type, $fineAmount) {
            $violation = ParkingViolation::create([
                'booking_id' => $data['booking_id'] ?? null,
                'spot_id' => $data['spot_id'],
                'license_plate' => $licensePlate,
                'type' => $type,
                'violation_time' => $violationTime,
                'fine_amount' => $fineAmount,
                'description' => $data['description'] ?? null,
                'evidence_images' => $data['evidence_images'] ?? null,
                'status' => 'pending',
            ]);

            return $violation;
        });
    }

    public function confirmViolation(ParkingViolation $violation, int $processedBy, string $remark = ''): ParkingViolation
    {
        if ($violation->status !== 'pending') {
            throw new \Exception('违停记录状态不允许确认');
        }

        $violation->update([
            'status' => 'confirmed',
            'processed_by' => $processedBy,
            'processed_at' => now(),
            'process_remark' => $remark,
        ]);

        return $violation;
    }

    public function createAppeal(array $data, array $attachments = []): ViolationAppeal
    {
        $violation = ParkingViolation::findOrFail($data['violation_id']);

        if ($violation->has_appeal) {
            $pendingAppeal = $violation->appeals()->where('status', '!=', 'cancelled')->first();
            if ($pendingAppeal) {
                throw new \Exception('该违停已有申诉正在处理中');
            }
        }

        return DB::transaction(function () use ($data, $attachments, $violation) {
            $evidencePaths = [];
            foreach ($attachments as $attachment) {
                $path = $attachment->store('appeal_evidence', 'public');
                $evidencePaths[] = Storage::url($path);
            }

            $appeal = ViolationAppeal::create([
                'violation_id' => $violation->id,
                'appellant_id' => $data['appellant_id'],
                'reason' => $data['reason'],
                'evidence_attachments' => array_merge($evidencePaths, $data['existing_evidence'] ?? []),
                'status' => 'pending',
            ]);

            $violation->update([
                'has_appeal' => true,
                'appeal_lock_until' => now()->addDays(self::APPEAL_LOCK_DAYS),
                'status' => 'appealed',
            ]);

            return $appeal->fresh();
        });
    }

    public function reviewAppeal(ViolationAppeal $appeal, bool $approved, int $reviewerId, string $remark = '', float $refundAmount = 0): ViolationAppeal
    {
        if ($appeal->status !== 'pending' && $appeal->status !== 'reviewing') {
            throw new \Exception('申诉状态不允许审核');
        }

        return DB::transaction(function () use ($appeal, $approved, $reviewerId, $remark, $refundAmount) {
            $appeal->update([
                'status' => $approved ? 'approved' : 'rejected',
                'reviewer_id' => $reviewerId,
                'reviewed_at' => now(),
                'review_remark' => $remark,
                'fine_waived' => $approved,
                'refund_amount' => $refundAmount,
            ]);

            $violation = $appeal->violation;
            $wasPaid = $violation->status === 'paid';

            if ($approved) {
                $violation->update([
                    'status' => 'cancelled',
                    'process_remark' => '申诉通过，违停已取消',
                ]);

                if ($refundAmount > 0 && $wasPaid) {
                    $paymentData = [
                        'user_id' => $appeal->appellant_id,
                        'amount' => -$refundAmount,
                        'type' => 'refund',
                        'method' => 'balance',
                        'status' => 'success',
                        'paid_at' => now(),
                        'remark' => "违停申诉退款: {$violation->violation_no}",
                    ];
                    if ($violation->booking_id) {
                        $paymentData['booking_id'] = $violation->booking_id;
                    }
                    Payment::create($paymentData);
                }
            } else {
                $violation->update([
                    'status' => 'confirmed',
                    'has_appeal' => false,
                    'appeal_lock_until' => null,
                ]);
            }

            return $appeal->fresh(['violation']);
        });
    }

    public function payViolation(ParkingViolation $violation, string $method, int $userId): Payment
    {
        if (!in_array($violation->status, ['confirmed', 'pending'])) {
            throw new \Exception('违停状态不允许支付');
        }

        return DB::transaction(function () use ($violation, $method, $userId) {
            $paymentData = [
                'user_id' => $userId,
                'amount' => $violation->fine_amount,
                'type' => 'fine',
                'method' => $method,
                'status' => 'success',
                'paid_at' => now(),
                'remark' => "违停罚款: {$violation->violation_no}",
            ];
            if ($violation->booking_id) {
                $paymentData['booking_id'] = $violation->booking_id;
            }
            $payment = Payment::create($paymentData);

            $violation->update(['status' => 'paid']);

            return $payment;
        });
    }
}
