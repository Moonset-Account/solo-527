<?php

namespace App\Services;

use App\Models\EntryRecord;
use App\Models\Booking;
use App\Models\ParkingSpot;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LicensePlateService
{
    const RECOGNITION_CONFIDENCE_THRESHOLD = 0.8;

    public function handleRecognitionCallback(array $data): EntryRecord
    {
        Log::info('车牌识别回调', $data);

        $licensePlate = strtoupper(trim($data['license_plate'] ?? ''));
        $confidence = (float) ($data['confidence'] ?? 0);
        $deviceId = $data['device_id'] ?? null;
        $imageUrl = $data['image_url'] ?? null;
        $occurredAt = Carbon::parse($data['timestamp'] ?? now());
        $type = $data['type'] ?? 'entry';
        $spotId = $data['spot_id'] ?? null;

        if (empty($licensePlate)) {
            throw new \Exception('车牌识别失败，无法获取车牌信息');
        }

        if ($confidence < self::RECOGNITION_CONFIDENCE_THRESHOLD) {
            return $this->createRecognitionRecord($licensePlate, $spotId, $type, $occurredAt, [
                'device_id' => $deviceId,
                'image_url' => $imageUrl,
                'confidence' => $confidence,
                'recognition_method' => 'auto',
                'needs_manual_correction' => true,
            ]);
        }

        return DB::transaction(function () use ($licensePlate, $spotId, $type, $occurredAt, $deviceId, $imageUrl, $confidence) {
            $booking = $this->findActiveBooking($licensePlate, $spotId, $occurredAt);

            $record = EntryRecord::create([
                'booking_id' => $booking?->id,
                'spot_id' => $spotId ?? $booking?->spot_id,
                'license_plate' => $licensePlate,
                'type' => $type,
                'occurred_at' => $occurredAt,
                'recognition_method' => 'auto',
                'device_id' => $deviceId,
                'image_url' => $imageUrl,
                'recognition_confidence' => $confidence,
                'is_manual_release' => false,
            ]);

            if ($booking) {
                if ($type === 'entry' && $booking->status === 'paid') {
                    $booking->update(['status' => 'in_progress']);
                } elseif ($type === 'exit' && $booking->status === 'in_progress') {
                    $booking->update(['status' => 'completed']);
                }
            }

            return $record;
        });
    }

    protected function createRecognitionRecord(string $licensePlate, ?int $spotId, string $type, Carbon $occurredAt, array $extra = []): EntryRecord
    {
        return EntryRecord::create([
            'booking_id' => null,
            'spot_id' => $spotId,
            'license_plate' => $licensePlate ?: 'UNKNOWN',
            'type' => $type,
            'occurred_at' => $occurredAt,
            'recognition_method' => 'auto',
            'device_id' => $extra['device_id'] ?? null,
            'image_url' => $extra['image_url'] ?? null,
            'recognition_confidence' => $extra['confidence'] ?? 0,
            'is_manual_release' => false,
            'remark' => $extra['needs_manual_correction'] ? '识别置信度低，需人工补录' : null,
        ]);
    }

    public function manualEntry(array $data, int $operatorId): EntryRecord
    {
        $licensePlate = strtoupper(trim($data['license_plate'] ?? ''));
        $spotId = $data['spot_id'] ?? null;
        $type = $data['type'] ?? 'entry';
        $occurredAt = Carbon::parse($data['occurred_at'] ?? now());
        $isManualRelease = (bool) ($data['is_manual_release'] ?? false);
        $releaseReason = $data['release_reason'] ?? null;
        $remark = $data['remark'] ?? null;

        if (empty($licensePlate)) {
            throw new \Exception('请输入车牌号码');
        }

        return DB::transaction(function () use ($licensePlate, $spotId, $type, $occurredAt, $operatorId, $isManualRelease, $releaseReason, $remark) {
            $booking = $this->findActiveBooking($licensePlate, $spotId, $occurredAt);

            $record = EntryRecord::create([
                'booking_id' => $booking?->id,
                'spot_id' => $spotId ?? $booking?->spot_id,
                'license_plate' => $licensePlate,
                'type' => $type,
                'occurred_at' => $occurredAt,
                'recognition_method' => 'manual',
                'operator_id' => $operatorId,
                'is_manual_release' => $isManualRelease,
                'release_reason' => $releaseReason,
                'remark' => $remark,
            ]);

            if ($booking && $isManualRelease) {
                $booking->incrementManualIntervention();
            }

            if ($booking) {
                if ($type === 'entry' && in_array($booking->status, ['paid', 'confirmed'])) {
                    $booking->update(['status' => 'in_progress']);
                } elseif ($type === 'exit' && $booking->status === 'in_progress') {
                    $booking->update(['status' => 'completed']);
                }
            }

            return $record->fresh();
        });
    }

    public function correctEntry(int $recordId, array $data, int $operatorId): EntryRecord
    {
        $record = EntryRecord::findOrFail($recordId);

        if ($record->recognition_method !== 'auto') {
            throw new \Exception('只有自动识别记录才能被修正');
        }

        $licensePlate = strtoupper(trim($data['license_plate'] ?? $record->license_plate));

        return DB::transaction(function () use ($record, $licensePlate, $data, $operatorId) {
            $record->update([
                'license_plate' => $licensePlate,
                'recognition_method' => 'corrected',
                'operator_id' => $operatorId,
                'remark' => ($record->remark ? $record->remark . '; ' : '') . ($data['remark'] ?? '人工修正车牌'),
            ]);

            $booking = $this->findActiveBooking($licensePlate, $record->spot_id, $record->occurred_at);
            if ($booking) {
                $record->update(['booking_id' => $booking->id]);
                $booking->incrementManualIntervention();
            }

            return $record->fresh();
        });
    }

    public function manualRelease(array $data, int $operatorId): EntryRecord
    {
        $data['is_manual_release'] = true;
        return $this->manualEntry($data, $operatorId);
    }

    protected function findActiveBooking(string $licensePlate, ?int $spotId, Carbon $time): ?Booking
    {
        $query = Booking::where('license_plate', $licensePlate)
            ->where('start_time', '<=', $time)
            ->where('end_time', '>=', $time)
            ->whereIn('status', ['confirmed', 'paid', 'in_progress']);

        if ($spotId) {
            $query->where('spot_id', $spotId);
        }

        return $query->first();
    }

    public function getManualRecords(Carbon $startDate, Carbon $endDate): array
    {
        $records = EntryRecord::whereIn('recognition_method', ['manual', 'corrected'])
            ->orWhere('is_manual_release', true)
            ->whereBetween('occurred_at', [$startDate, $endDate])
            ->with(['operator', 'booking'])
            ->orderByDesc('occurred_at')
            ->get();

        $stats = [
            'total' => $records->count(),
            'manual_entry' => $records->where('recognition_method', 'manual')->count(),
            'corrected' => $records->where('recognition_method', 'corrected')->count(),
            'manual_release' => $records->where('is_manual_release', true)->count(),
            'records' => $records,
        ];

        return $stats;
    }
}
