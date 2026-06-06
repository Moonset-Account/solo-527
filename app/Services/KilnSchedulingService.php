<?php

namespace App\Services;

use App\Models\Kiln;
use App\Models\KilnBatch;
use App\Models\KilnBatchWork;
use App\Models\Work;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class KilnSchedulingService
{
    protected ConflictCheckService $conflictCheckService;

    public function __construct(ConflictCheckService $conflictCheckService)
    {
        $this->conflictCheckService = $conflictCheckService;
    }

    public function createKilnBatch(array $data, User $creator): KilnBatch
    {
        return DB::transaction(function () use ($data, $creator) {
            $kiln = Kiln::findOrFail($data['kiln_id']);
            $scheduledDate = Carbon::parse($data['scheduled_fire_date']);

            if (!$kiln->isAvailableOn($scheduledDate)) {
                throw new \Exception('该日期为窑炉维护日，无法排烧');
            }

            $batch = KilnBatch::create([
                'kiln_id' => $data['kiln_id'],
                'firing_curve_template_id' => $data['firing_curve_template_id'],
                'created_by' => $creator->id,
                'scheduled_fire_date' => $scheduledDate,
                'status' => $data['status'] ?? 'draft',
                'max_capacity' => $data['max_capacity'] ?? $kiln->capacity,
                'notes' => $data['notes'] ?? null,
            ]);

            $this->cacheBatchInfo($batch);

            return $batch;
        });
    }

    public function addWorkToBatch(KilnBatch $batch, Work $work, array $positionData = []): array
    {
        if (!$batch->isEditable()) {
            return [
                'success' => false,
                'message' => '该窑次状态不允许添加作品',
            ];
        }

        $conflictResult = $this->conflictCheckService->checkAllConflicts(
            $batch,
            $work,
            $positionData['position_zone'] ?? null
        );

        if (!$conflictResult['passed']) {
            return [
                'success' => false,
                'message' => '存在冲突，无法添加作品',
                'conflicts' => $conflictResult['conflicts'],
                'warnings' => $conflictResult['warnings'],
            ];
        }

        return DB::transaction(function () use ($batch, $work, $positionData, $conflictResult) {
            $spaceOccupied = $work->calculateVolume();

            $batch->works()->attach($work->id, [
                'position_shelf' => $positionData['position_shelf'] ?? null,
                'position_zone' => $positionData['position_zone'] ?? null,
                'position_x' => $positionData['position_x'] ?? null,
                'position_y' => $positionData['position_y'] ?? null,
                'space_occupied' => $spaceOccupied,
                'post_firing_status' => 'pending',
            ]);

            $work->update(['status' => 'scheduled']);
            $batch->updateSpaceUsage();
            $this->cacheBatchInfo($batch);

            return [
                'success' => true,
                'message' => '作品已成功添加到窑次',
                'warnings' => $conflictResult['warnings'],
            ];
        });
    }

    public function removeWorkFromBatch(KilnBatch $batch, Work $work): array
    {
        if (!$batch->isEditable()) {
            return [
                'success' => false,
                'message' => '该窑次状态不允许移除作品',
            ];
        }

        return DB::transaction(function () use ($batch, $work) {
            $batch->works()->detach($work->id);
            $work->update(['status' => 'ready_for_firing']);
            $batch->updateSpaceUsage();
            $this->cacheBatchInfo($batch);

            return [
                'success' => true,
                'message' => '作品已从窑次移除，名额已释放',
                'released_capacity' => 1,
            ];
        });
    }

    public function cancelKilnBatch(KilnBatch $batch): array
    {
        if ($batch->status === 'firing' || $batch->status === 'cooling') {
            return [
                'success' => false,
                'message' => '窑次正在烧制或冷却中，无法取消',
            ];
        }

        return DB::transaction(function () use ($batch) {
            $affectedStudents = [];

            foreach ($batch->works as $work) {
                $work->update(['status' => 'ready_for_firing']);
                $studentId = $work->student_id;
                if (!isset($affectedStudents[$studentId])) {
                    $affectedStudents[$studentId] = [
                        'student_id' => $studentId,
                        'student_name' => $work->student?->name,
                        'works' => [],
                    ];
                }
                $affectedStudents[$studentId]['works'][] = [
                    'work_id' => $work->id,
                    'title' => $work->title,
                ];
            }

            $batch->works()->detach();
            $batch->update([
                'status' => 'cancelled',
                'used_space_percent' => 0,
            ]);

            $this->clearBatchCache($batch);

            return [
                'success' => true,
                'message' => '窑次已取消，所有名额已释放',
                'affected_students' => array_values($affectedStudents),
            ];
        });
    }

    public function updateBatchCurve(KilnBatch $batch, int $newCurveTemplateId): array
    {
        if (!$batch->isEditable()) {
            return [
                'success' => false,
                'message' => '该窑次状态不允许修改烧成曲线',
            ];
        }

        return DB::transaction(function () use ($batch, $newCurveTemplateId) {
            $batch->update(['firing_curve_template_id' => $newCurveTemplateId]);
            $batch->load('firingCurveTemplate');

            $checkResult = $this->conflictCheckService->checkBatchForCurveChange($batch);

            $this->cacheBatchInfo($batch);

            return [
                'success' => true,
                'message' => $checkResult['has_affected']
                    ? '曲线已更新，但部分作品可能受影响'
                    : '曲线已更新，所有作品兼容',
                'has_affected_works' => $checkResult['has_affected'],
                'affected_works' => $checkResult['affected_works'],
            ];
        });
    }

    public function batchUnload(KilnBatch $batch, array $worksData): array
    {
        if ($batch->status !== 'cooling') {
            return [
                'success' => false,
                'message' => '只有冷却中的窑次可以出窑',
            ];
        }

        return DB::transaction(function () use ($batch, $worksData) {
            $updatedWorks = [];

            foreach ($worksData as $workData) {
                $work = Work::findOrFail($workData['work_id']);
                $batchWork = KilnBatchWork::where('kiln_batch_id', $batch->id)
                    ->where('work_id', $work->id)
                    ->first();

                if (!$batchWork) {
                    continue;
                }

                $postFiringStatus = $workData['post_firing_status'] ?? 'success';
                $batchWork->update([
                    'post_firing_status' => $postFiringStatus,
                    'post_firing_notes' => $workData['post_firing_notes'] ?? null,
                ]);

                $workUpdate = ['status' => 'unloaded'];

                if ($postFiringStatus === 'broken') {
                    $workUpdate['status'] = 'broken';
                    $workUpdate['breakage_reason'] = $workData['breakage_reason'] ?? null;
                    $workUpdate['compensation_status'] = $workData['compensation_status'] ?? 'none';
                }

                if (isset($workData['for_exhibition'])) {
                    $workUpdate['for_exhibition'] = $workData['for_exhibition'];
                }

                $work->update($workUpdate);
                $updatedWorks[] = $work;
            }

            $batch->update([
                'status' => 'unloaded',
                'unloaded_date' => now(),
            ]);

            $this->clearBatchCache($batch);

            return [
                'success' => true,
                'message' => '出窑记录已保存',
                'updated_works_count' => count($updatedWorks),
            ];
        });
    }

    public function getAvailableSlots(Kiln $kiln, Carbon $startDate, int $days = 30): array
    {
        $slots = [];

        for ($i = 0; $i < $days; $i++) {
            $date = $startDate->copy()->addDays($i);
            $isAvailable = $kiln->isAvailableOn($date);

            $existingBatch = KilnBatch::where('kiln_id', $kiln->id)
                ->whereDate('scheduled_fire_date', $date)
                ->whereNotIn('status', ['cancelled'])
                ->first();

            $slots[] = [
                'date' => $date->toDateString(),
                'day_of_week' => $date->dayOfWeek,
                'is_available' => $isAvailable && !$existingBatch,
                'is_maintenance' => !$isAvailable,
                'existing_batch_id' => $existingBatch?->id,
                'existing_batch_status' => $existingBatch?->status,
            ];
        }

        return $slots;
    }

    protected function cacheBatchInfo(KilnBatch $batch): void
    {
        $cacheKey = "kiln_batch:{$batch->id}";
        $cacheData = [
            'id' => $batch->id,
            'batch_number' => $batch->batch_number,
            'status' => $batch->status,
            'work_count' => $batch->work_count,
            'max_capacity' => $batch->max_capacity,
            'used_space_percent' => $batch->used_space_percent,
        ];

        Redis::setex($cacheKey, 3600, json_encode($cacheData));
    }

    protected function clearBatchCache(KilnBatch $batch): void
    {
        Redis::del("kiln_batch:{$batch->id}");
    }

    public function getCachedBatchInfo(int $batchId): ?array
    {
        $cacheKey = "kiln_batch:{$batchId}";
        $data = Redis::get($cacheKey);

        return $data ? json_decode($data, true) : null;
    }

    public function recommendOptimalZone(KilnBatch $batch, Work $work): ?int
    {
        $kiln = $batch->kiln;
        $zones = $kiln->temperature_zones ?? [];
        $requiredTemp = $work->getSuitableTemperature();

        $occupiedZones = $batch->batchWorks()
            ->whereNotNull('position_zone')
            ->pluck('position_zone')
            ->toArray();

        $zoneCounts = array_count_values($occupiedZones);

        $bestZone = null;
        $minOccupancy = PHP_INT_MAX;

        foreach ($zones as $index => $zoneTemp) {
            if ($zoneTemp >= $requiredTemp) {
                $occupancy = $zoneCounts[$index] ?? 0;
                if ($occupancy < $minOccupancy) {
                    $minOccupancy = $occupancy;
                    $bestZone = $index;
                }
            }
        }

        return $bestZone;
    }
}
