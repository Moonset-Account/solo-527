<?php

namespace App\Services;

use App\Models\Glaze;
use App\Models\KilnBatch;
use App\Models\Work;
use Illuminate\Support\Collection;

class ConflictCheckService
{
    public function checkAllConflicts(KilnBatch $batch, Work $work, ?int $targetZone = null): array
    {
        $conflicts = [];

        $capacityCheck = $this->checkCapacity($batch);
        if (!$capacityCheck['passed']) {
            $conflicts[] = $capacityCheck;
        }

        $studentLimitCheck = $this->checkStudentWorkLimit($batch, $work);
        if (!$studentLimitCheck['passed']) {
            $conflicts[] = $studentLimitCheck;
        }

        $tempZoneCheck = $this->checkTemperatureZone($batch, $work, $targetZone);
        if (!$tempZoneCheck['passed']) {
            $conflicts[] = $tempZoneCheck;
        }

        $glazeCheck = $this->checkGlazeCompatibility($batch, $work);
        if (!$glazeCheck['passed']) {
            $conflicts[] = $glazeCheck;
        }

        $spaceCheck = $this->checkKilnSpace($batch, $work);
        if (!$spaceCheck['passed']) {
            $conflicts[] = $spaceCheck;
        }

        $workStatusCheck = $this->checkWorkStatus($work);
        if (!$workStatusCheck['passed']) {
            $conflicts[] = $workStatusCheck;
        }

        return [
            'passed' => empty($conflicts),
            'conflicts' => $conflicts,
            'warnings' => $this->collectWarnings($batch, $work, $targetZone),
        ];
    }

    public function checkCapacity(KilnBatch $batch): array
    {
        $currentCount = $batch->work_count;
        $maxCapacity = $batch->max_capacity;

        return [
            'type' => 'capacity',
            'passed' => $currentCount < $maxCapacity,
            'message' => $currentCount < $maxCapacity
                ? '窑位充足'
                : "窑次容量已满 ({$currentCount}/{$maxCapacity})",
            'current' => $currentCount,
            'max' => $maxCapacity,
        ];
    }

    public function checkStudentWorkLimit(KilnBatch $batch, Work $work): array
    {
        $student = $work->student;
        $currentWorks = $batch->getStudentWorkCount($student->id);
        $maxAllowed = $student->max_works_per_batch;

        return [
            'type' => 'student_limit',
            'passed' => $currentWorks < $maxAllowed,
            'message' => $currentWorks < $maxAllowed
                ? '学员名额充足'
                : "该学员本窑次作品已达上限 ({$currentWorks}/{$maxAllowed})",
            'student_id' => $student->id,
            'student_name' => $student->name,
            'current' => $currentWorks,
            'max' => $maxAllowed,
        ];
    }

    public function checkTemperatureZone(KilnBatch $batch, Work $work, ?int $targetZone = null): array
    {
        $kiln = $batch->kiln;
        $curve = $batch->firingCurveTemplate;
        $maxTemp = $curve?->max_temperature ?? 0;

        $clay = $work->clay;
        if ($clay && !$clay->isCompatibleWithTemperature($maxTemp)) {
            return [
                'type' => 'temperature_zone',
                'passed' => false,
                'message' => "泥料 {$clay->name} 不兼容最高温度 {$maxTemp}°C (范围: {$clay->firing_temp_min}-{$clay->firing_temp_max}°C)",
                'max_temp' => $maxTemp,
                'clay_range' => [$clay->firing_temp_min, $clay->firing_temp_max],
            ];
        }

        foreach ($work->glazes as $glaze) {
            if (!$glaze->isCompatibleWithTemperature($maxTemp)) {
                return [
                    'type' => 'temperature_zone',
                    'passed' => false,
                    'message' => "釉料 {$glaze->name} 不兼容最高温度 {$maxTemp}°C (范围: {$glaze->firing_temp_min}-{$glaze->firing_temp_max}°C)",
                    'max_temp' => $maxTemp,
                    'glaze' => $glaze->name,
                    'glaze_range' => [$glaze->firing_temp_min, $glaze->firing_temp_max],
                ];
            }
        }

        if ($targetZone !== null) {
            $zones = $kiln->temperature_zones ?? [];
            if (!isset($zones[$targetZone])) {
                return [
                    'type' => 'temperature_zone',
                    'passed' => false,
                    'message' => "温区 {$targetZone} 不存在",
                    'available_zones' => count($zones),
                ];
            }

            $zoneTemp = $zones[$targetZone];
            $workPreferredTemp = $work->getSuitableTemperature();

            if ($zoneTemp < $workPreferredTemp) {
                return [
                    'type' => 'temperature_zone',
                    'passed' => false,
                    'message' => "温区 {$targetZone} 温度 ({$zoneTemp}°C) 低于作品所需温度 ({$workPreferredTemp}°C)",
                    'zone_temp' => $zoneTemp,
                    'required_temp' => $workPreferredTemp,
                ];
            }
        }

        return [
            'type' => 'temperature_zone',
            'passed' => true,
            'message' => '温区兼容',
            'max_temp' => $maxTemp,
        ];
    }

    public function checkGlazeCompatibility(KilnBatch $batch, Work $newWork): array
    {
        $existingGlazes = $batch->getUniqueGlazes();
        $newGlazes = $newWork->glazes;

        if ($existingGlazes->isEmpty() || $newGlazes->isEmpty()) {
            return [
                'type' => 'glaze_compatibility',
                'passed' => true,
                'message' => '釉料兼容检查通过',
            ];
        }

        $incompatibilities = [];

        foreach ($newGlazes as $newGlaze) {
            foreach ($existingGlazes as $existingGlaze) {
                if ($newGlaze->id === $existingGlaze->id) {
                    continue;
                }

                $compatibility = $newGlaze->getCompatibilityWith($existingGlaze);
                if ($compatibility === 'incompatible') {
                    $incompatibilities[] = [
                        'new_glaze' => $newGlaze->name,
                        'existing_glaze' => $existingGlaze->name,
                        'compatibility' => $compatibility,
                    ];
                }
            }
        }

        return [
            'type' => 'glaze_compatibility',
            'passed' => empty($incompatibilities),
            'message' => empty($incompatibilities)
                ? '釉料兼容性检查通过'
                : '存在釉料不兼容问题',
            'incompatibilities' => $incompatibilities,
        ];
    }

    public function checkKilnSpace(KilnBatch $batch, Work $work): array
    {
        $workVolume = $work->calculateVolume();
        $kilnVolume = $batch->kiln?->getTotalVolume() ?? 0;

        if ($kilnVolume <= 0) {
            return [
                'type' => 'space',
                'passed' => false,
                'message' => '窑炉体积未设置',
            ];
        }

        $usedSpace = $batch->batchWorks->sum('space_occupied');
        $availableSpace = $kilnVolume - $usedSpace;

        return [
            'type' => 'space',
            'passed' => $workVolume <= $availableSpace,
            'message' => $workVolume <= $availableSpace
                ? '空间充足'
                : "窑内空间不足 (需要: {$workVolume}, 可用: {$availableSpace})",
            'required' => $workVolume,
            'available' => $availableSpace,
            'total' => $kilnVolume,
            'used_percent' => round(($usedSpace / $kilnVolume) * 100, 2),
        ];
    }

    public function checkWorkStatus(Work $work): array
    {
        $allowedStatuses = ['ready_for_firing', 'scheduled'];

        return [
            'type' => 'work_status',
            'passed' => in_array($work->status, $allowedStatuses) && !$work->is_scheduled,
            'message' => in_array($work->status, $allowedStatuses)
                ? ($work->is_scheduled ? '作品已在其他窑次中' : '作品状态正常')
                : "作品状态不允许入窑 (当前: {$work->status})",
            'current_status' => $work->status,
            'is_scheduled' => $work->is_scheduled,
        ];
    }

    public function checkBatchForCurveChange(KilnBatch $batch): array
    {
        $affectedWorks = new Collection();
        $curve = $batch->firingCurveTemplate;
        $maxTemp = $curve?->max_temperature ?? 0;

        foreach ($batch->works as $work) {
            $issues = [];

            $clay = $work->clay;
            if ($clay && !$clay->isCompatibleWithTemperature($maxTemp)) {
                $issues[] = "泥料 {$clay->name} 不兼容新的最高温度 {$maxTemp}°C";
            }

            foreach ($work->glazes as $glaze) {
                if (!$glaze->isCompatibleWithTemperature($maxTemp)) {
                    $issues[] = "釉料 {$glaze->name} 不兼容新的最高温度 {$maxTemp}°C";
                }
            }

            if (!empty($issues)) {
                $affectedWorks->push([
                    'work_id' => $work->id,
                    'work_title' => $work->title,
                    'student_id' => $work->student_id,
                    'student_name' => $work->student?->name,
                    'issues' => $issues,
                ]);
            }
        }

        return [
            'has_affected' => $affectedWorks->isNotEmpty(),
            'affected_works' => $affectedWorks,
            'new_max_temp' => $maxTemp,
        ];
    }

    protected function collectWarnings(KilnBatch $batch, Work $work, ?int $targetZone = null): array
    {
        $warnings = [];

        $newGlazes = $work->glazes;
        $existingGlazes = $batch->getUniqueGlazes();

        foreach ($newGlazes as $newGlaze) {
            foreach ($existingGlazes as $existingGlaze) {
                if ($newGlaze->id === $existingGlaze->id) {
                    continue;
                }

                $compatibility = $newGlaze->getCompatibilityWith($existingGlaze);
                if ($compatibility === 'caution') {
                    $warnings[] = [
                        'type' => 'glaze_caution',
                        'message' => "釉料 {$newGlaze->name} 与 {$existingGlaze->name} 搭配需谨慎",
                    ];
                }
            }
        }

        if ($batch->used_space_percent > 80) {
            $warnings[] = [
                'type' => 'space_warning',
                'message' => "窑炉空间使用率已达 {$batch->used_space_percent}%",
            ];
        }

        return $warnings;
    }
}
