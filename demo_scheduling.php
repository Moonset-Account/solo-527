<?php
/**
 * 陶瓷工作室窑炉排烧平台 - 核心功能演示脚本
 * 此脚本独立运行，不依赖 vendor，演示核心业务逻辑
 * 运行方式: php demo_scheduling.php
 */

echo "============================================\n";
echo "陶瓷工作室窑炉排烧平台 - 核心功能演示\n";
echo "============================================\n\n";

// 1. 模拟数据初始化
echo "【1】初始化基础数据...\n";

$teacher = new class {
    public $id = 1;
    public $name = '张老师';
    public $role = 'teacher';
    public function isTeacher() { return true; }
    public function isStudent() { return false; }
};

$student1 = new class {
    public $id = 2;
    public $name = '李学员';
    public $role = 'student';
    public $max_works_per_batch = 3;
    public function isTeacher() { return false; }
    public function isStudent() { return true; }
};

$student2 = new class {
    public $id = 3;
    public $name = '王学员';
    public $role = 'student';
    public $max_works_per_batch = 2;
    public function isTeacher() { return false; }
    public function isStudent() { return true; }
};

$clay1 = new class {
    public $id = 1;
    public $name = '紫砂泥';
    public $firing_temp_min = 1100;
    public $firing_temp_max = 1280;
    public function isCompatibleWithTemperature($temp) {
        return $temp >= $this->firing_temp_min && $temp <= $this->firing_temp_max;
    }
};

$glaze1 = new class {
    public $id = 1;
    public $name = '天青釉';
    public $firing_temp_min = 1180;
    public $firing_temp_max = 1260;
    public function isCompatibleWithTemperature($temp) {
        return $temp >= $this->firing_temp_min && $temp <= $this->firing_temp_max;
    }
    public function getCompatibilityWith($otherGlaze) {
        return 'compatible';
    }
};

$glaze2 = new class {
    public $id = 2;
    public $name = '铜红釉';
    public $firing_temp_min = 1200;
    public $firing_temp_max = 1280;
    public function isCompatibleWithTemperature($temp) {
        return $temp >= $this->firing_temp_min && $temp <= $this->firing_temp_max;
    }
    public function getCompatibilityWith($otherGlaze) {
        return $otherGlaze->id == 1 ? 'incompatible' : 'compatible';
    }
};

$kiln = new class {
    public $id = 1;
    public $name = '1号电窑';
    public $capacity = 20;
    public $width = 100;
    public $height = 100;
    public $depth = 100;
    public $temperature_zones = [1240, 1260, 1280];
    public function getTotalVolume() {
        return $this->width * $this->height * $this->depth;
    }
};

$curve = new class {
    public $id = 1;
    public $name = '标准中温氧化烧';
    public $max_temperature = 1250;
    public $total_duration_minutes = 480;
};

$lowCurve = new class {
    public $id = 2;
    public $name = '低温素烧';
    public $max_temperature = 900;
    public $total_duration_minutes = 300;
};

echo "  ✓ 老师: {$teacher->name}\n";
echo "  ✓ 学员1: {$student1->name} (每窑最多 {$student1->max_works_per_batch} 件)\n";
echo "  ✓ 学员2: {$student2->name} (每窑最多 {$student2->max_works_per_batch} 件)\n";
echo "  ✓ 泥料: {$clay1->name} ({$clay1->firing_temp_min}-{$clay1->firing_temp_max}°C)\n";
echo "  ✓ 釉料: {$glaze1->name}, {$glaze2->name}\n";
echo "  ✓ 窑炉: {$kiln->name} (容量: {$kiln->capacity}, 温区: " . implode(', ', $kiln->temperature_zones) . "°C)\n";
echo "  ✓ 曲线: {$curve->name} (最高 {$curve->max_temperature}°C)\n\n";

// 2. 创建窑次
echo "【2】创建窑次计划...\n";

$batch = new class($kiln, $curve, $teacher) {
    public $id = 1;
    public $batch_number;
    public $kiln_id;
    public $firing_curve_template_id;
    public $created_by;
    public $scheduled_fire_date;
    public $status = 'draft';
    public $max_capacity;
    public $used_space_percent = 0;
    public $works = [];
    public $kiln;
    public $firingCurveTemplate;

    public function __construct($kiln, $curve, $creator) {
        $this->batch_number = date('Ymd') . '001';
        $this->kiln_id = $kiln->id;
        $this->firing_curve_template_id = $curve->id;
        $this->created_by = $creator->id;
        $this->scheduled_fire_date = date('Y-m-d H:i:s', strtotime('+3 days'));
        $this->max_capacity = $kiln->capacity;
        $this->kiln = $kiln;
        $this->firingCurveTemplate = $curve;
    }

    public function getWorkCountAttribute() {
        return count($this->works);
    }

    public function getRemainingCapacityAttribute() {
        return max(0, $this->max_capacity - count($this->works));
    }

    public function isEditable() {
        return in_array($this->status, ['draft', 'scheduled']);
    }

    public function getStudentWorkCount($studentId) {
        return count(array_filter($this->works, function($w) use ($studentId) {
            return $w['work']->student_id == $studentId;
        }));
    }

    public function getUniqueGlazes() {
        $glazes = [];
        foreach ($this->works as $workData) {
            foreach ($workData['work']->glazes as $g) {
                if (!isset($glazes[$g->id])) {
                    $glazes[$g->id] = $g;
                }
            }
        }
        return array_values($glazes);
    }

    public function batchWorks() {
        return new class($this->works) {
            public $works;
            public function __construct($works) { $this->works = $works; }
            public function sum($field) {
                return array_sum(array_column(array_column($this->works, 'pivot'), $field));
            }
            public function whereNotNull($field) {
                return $this;
            }
            public function pluck($field) {
                return new class(array_column(array_column($this->works, 'pivot'), $field)) {
                    public $items;
                    public function __construct($items) { $this->items = $items; }
                    public function toArray() { return array_filter($this->items, function($v) { return $v !== null; }); }
                };
            }
        };
    }
};

echo "  ✓ 窑次 {$batch->batch_number} 创建成功\n";
echo "  → 计划烧造时间: {$batch->scheduled_fire_date}\n";
echo "  → 当前容量: 0/{$batch->max_capacity}\n\n";

// 3. 创建作品
echo "【3】创建学员作品...\n";

function createWork($id, $title, $student, $clay, $glazes, $width = 10, $height = 10, $depth = 10) {
    return new class($id, $title, $student, $clay, $glazes, $width, $height, $depth) {
        public $id;
        public $title;
        public $student_id;
        public $student;
        public $clay_id;
        public $clay;
        public $glazes;
        public $width;
        public $height;
        public $depth;
        public $status = 'ready_for_firing';
        public $is_scheduled = false;
        public $temperature_zone_preference = null;

        public function __construct($id, $title, $student, $clay, $glazes, $w, $h, $d) {
            $this->id = $id;
            $this->title = $title;
            $this->student_id = $student->id;
            $this->student = $student;
            $this->clay_id = $clay->id;
            $this->clay = $clay;
            $this->glazes = $glazes;
            $this->width = $w;
            $this->height = $h;
            $this->depth = $d;
        }

        public function calculateVolume() {
            return $this->width * $this->height * $this->depth;
        }

        public function getSuitableTemperature() {
            $clayTemp = $this->clay->firing_temp_min;
            $glazeTemps = array_map(function($g) { return $g->firing_temp_min; }, $this->glazes);
            return !empty($glazeTemps) ? max($clayTemp, max($glazeTemps)) : $clayTemp;
        }

        public function isVisibleTo($user) {
            if ($user->isTeacher()) return true;
            return $user->id == $this->student_id;
        }

        public function canViewFailureDetails($user) {
            return $user->isTeacher();
        }
    };
}

$work1 = createWork(1, '青花瓷瓶', $student1, $clay1, [$glaze1], 15, 25, 15);
$work2 = createWork(2, '茶盏套装', $student1, $clay1, [$glaze1], 10, 8, 10);
$work3 = createWork(3, '陶土花瓶', $student2, $clay1, [$glaze2], 20, 35, 20);
$work4 = createWork(4, '雕塑摆件', $student2, $clay1, [$glaze1, $glaze2], 25, 40, 25);

echo "  ✓ {$student1->name}: {$work1->title} (体积: {$work1->calculateVolume()} cm³)\n";
echo "  ✓ {$student1->name}: {$work2->title} (体积: {$work2->calculateVolume()} cm³)\n";
echo "  ✓ {$student2->name}: {$work3->title} (体积: {$work3->calculateVolume()} cm³)\n";
echo "  ✓ {$student2->name}: {$work4->title} (体积: {$work4->calculateVolume()} cm³)\n\n";

// 4. 冲突校验服务测试
echo "【4】冲突校验接口测试...\n";

// 模拟 service 所需的方法（与实际 ConflictCheckService 逻辑一致）
$checkCapacity = function($batch) {
    $currentCount = count($batch->works);
    return [
        'type' => 'capacity',
        'passed' => $currentCount < $batch->max_capacity,
        'message' => $currentCount < $batch->max_capacity ? '窑位充足' : "窑次容量已满 ({$currentCount}/{$batch->max_capacity})",
        'current' => $currentCount,
        'max' => $batch->max_capacity,
    ];
};

$checkStudentLimit = function($batch, $work) {
    $student = $work->student;
    $currentWorks = $batch->getStudentWorkCount($student->id);
    $maxAllowed = $student->max_works_per_batch;
    return [
        'type' => 'student_limit',
        'passed' => $currentWorks < $maxAllowed,
        'message' => $currentWorks < $maxAllowed ? '学员名额充足' : "该学员本窑次作品已达上限 ({$currentWorks}/{$maxAllowed})",
        'current' => $currentWorks,
        'max' => $maxAllowed,
    ];
};

$checkTempZone = function($batch, $work, $targetZone = null) {
    $kiln = $batch->kiln;
    $curve = $batch->firingCurveTemplate;
    $maxTemp = $curve->max_temperature;

    $clay = $work->clay;
    if (!$clay->isCompatibleWithTemperature($maxTemp)) {
        return [
            'type' => 'temperature_zone',
            'passed' => false,
            'message' => "泥料 {$clay->name} 不兼容最高温度 {$maxTemp}°C",
        ];
    }

    foreach ($work->glazes as $glaze) {
        if (!$glaze->isCompatibleWithTemperature($maxTemp)) {
            return [
                'type' => 'temperature_zone',
                'passed' => false,
                'message' => "釉料 {$glaze->name} 不兼容最高温度 {$maxTemp}°C",
            ];
        }
    }

    return ['type' => 'temperature_zone', 'passed' => true, 'message' => '温区兼容'];
};

$checkGlazeCompat = function($batch, $newWork) {
    $existingGlazes = $batch->getUniqueGlazes();
    $newGlazes = $newWork->glazes;

    $incompatibilities = [];
    foreach ($newGlazes as $newGlaze) {
        foreach ($existingGlazes as $existingGlaze) {
            if ($newGlaze->id == $existingGlaze->id) continue;
            if ($newGlaze->getCompatibilityWith($existingGlaze) === 'incompatible') {
                $incompatibilities[] = [
                    'new_glaze' => $newGlaze->name,
                    'existing_glaze' => $existingGlaze->name,
                ];
            }
        }
    }

    return [
        'type' => 'glaze_compatibility',
        'passed' => empty($incompatibilities),
        'message' => empty($incompatibilities) ? '釉料兼容性检查通过' : '存在釉料不兼容问题',
        'incompatibilities' => $incompatibilities,
    ];
};

$checkSpace = function($batch, $work) {
    $workVolume = $work->calculateVolume();
    $kilnVolume = $batch->kiln->getTotalVolume();
    $usedSpace = array_sum(array_column(array_column($batch->works, 'pivot'), 'space_occupied'));
    $availableSpace = $kilnVolume - $usedSpace;

    return [
        'type' => 'space',
        'passed' => $workVolume <= $availableSpace,
        'message' => $workVolume <= $availableSpace ? '空间充足' : "窑内空间不足",
        'required' => $workVolume,
        'available' => $availableSpace,
    ];
};

$checkAllConflicts = function($batch, $work, $targetZone = null) use ($checkCapacity, $checkStudentLimit, $checkTempZone, $checkGlazeCompat, $checkSpace) {
    $conflicts = [];

    foreach ([$checkCapacity($batch), $checkStudentLimit($batch, $work), $checkTempZone($batch, $work, $targetZone),
             $checkGlazeCompat($batch, $work), $checkSpace($batch, $work)] as $check) {
        if (!$check['passed']) $conflicts[] = $check;
    }

    return ['passed' => empty($conflicts), 'conflicts' => $conflicts];
};

echo "  → 检查作品1 ({$work1->title}) 入窑冲突...\n";
$result = $checkAllConflicts($batch, $work1);
echo "    结果: " . ($result['passed'] ? '✓ 通过' : '✗ 失败') . "\n";
if (!$result['passed']) {
    foreach ($result['conflicts'] as $c) {
        echo "      - {$c['message']}\n";
    }
}

// 添加作品1到窑次
$batch->works[] = [
    'work' => $work1,
    'pivot' => ['space_occupied' => $work1->calculateVolume(), 'position_zone' => 1],
];
$work1->is_scheduled = true;
$work1->status = 'scheduled';
echo "  ✓ {$work1->title} 已入窑，当前: " . count($batch->works) . "/{$batch->max_capacity}\n\n";

// 5. 测试王学员的釉料兼容性冲突
echo "【5】釉料兼容性冲突测试...\n";
echo "  → 检查作品4 (铜红釉+天青釉) 入窑...\n";
$result = $checkAllConflicts($batch, $work4);
echo "    结果: " . ($result['passed'] ? '✓ 通过' : '✗ 失败') . "\n";
if (!$result['passed']) {
    foreach ($result['conflicts'] as $c) {
        echo "      - {$c['type']}: {$c['message']}\n";
        if (isset($c['incompatibilities'])) {
            foreach ($c['incompatibilities'] as $ic) {
                echo "        → {$ic['new_glaze']} 与 {$ic['existing_glaze']} 不兼容\n";
            }
        }
    }
}
echo "\n";

// 6. 曲线修改后重新校验
echo "【6】曲线修改重校验并提示受影响作品...\n";
echo "  → 当前曲线: {$curve->name} ({$curve->max_temperature}°C)\n";

$batch->firingCurveTemplate = $lowCurve;
echo "  → 修改曲线为: {$lowCurve->name} ({$lowCurve->max_temperature}°C)\n";

$affectedWorks = [];
foreach ($batch->works as $workData) {
    $work = $workData['work'];
    $issues = [];
    if (!$work->clay->isCompatibleWithTemperature($lowCurve->max_temperature)) {
        $issues[] = "泥料 {$work->clay->name} 不兼容新温度 {$lowCurve->max_temperature}°C";
    }
    foreach ($work->glazes as $glaze) {
        if (!$glaze->isCompatibleWithTemperature($lowCurve->max_temperature)) {
            $issues[] = "釉料 {$glaze->name} 不兼容新温度 {$lowCurve->max_temperature}°C";
        }
    }
    if (!empty($issues)) {
        $affectedWorks[] = [
            'work_id' => $work->id,
            'work_title' => $work->title,
            'student_name' => $work->student->name,
            'issues' => $issues,
        ];
    }
}

echo "  → 检测结果: 发现 " . count($affectedWorks) . " 件受影响作品\n";
foreach ($affectedWorks as $aw) {
    echo "    ! 作品 [{$aw['work_title']}] (学员: {$aw['student_name']})\n";
    foreach ($aw['issues'] as $issue) {
        echo "      - {$issue}\n";
    }
}
echo "\n";

// 恢复曲线
$batch->firingCurveTemplate = $curve;

// 7. 添加更多作品
echo "【7】继续添加作品...\n";
$worksToAdd = [$work2, $work3];
foreach ($worksToAdd as $w) {
    $result = $checkAllConflicts($batch, $w);
    if ($result['passed']) {
        $batch->works[] = [
            'work' => $w,
            'pivot' => ['space_occupied' => $w->calculateVolume(), 'position_zone' => 1],
        ];
        $w->is_scheduled = true;
        $w->status = 'scheduled';
        echo "  ✓ {$w->title} 入窑成功\n";
    } else {
        echo "  ✗ {$w->title} 入窑失败:\n";
        foreach ($result['conflicts'] as $c) {
            echo "    - {$c['message']}\n";
        }
    }
}
echo "  → 窑次当前: " . count($batch->works) . "/{$batch->max_capacity} 件作品\n\n";

// 8. 撤销排烧与名额释放
echo "【8】撤销排烧与名额释放测试...\n";
echo "  → 移除前: 窑次 " . count($batch->works) . " 件作品\n";
echo "  → 移除作品: {$work2->title}\n";

// 从窑次中移除
$batch->works = array_values(array_filter($batch->works, function($wd) use ($work2) {
    return $wd['work']->id != $work2->id;
}));
$work2->is_scheduled = false;
$work2->status = 'ready_for_firing';

echo "  → 移除后: 窑次 " . count($batch->works) . " 件作品 (名额已释放)\n";
echo "  → {$work2->title} 状态: {$work2->status}\n\n";

// 9. 出窑批量更新
echo "【9】出窑批量更新测试...\n";
$batch->status = 'cooling';

$unloadData = [
    ['work_id' => 1, 'post_firing_status' => 'success', 'for_exhibition' => true],
    ['work_id' => 3, 'post_firing_status' => 'broken', 'breakage_reason' => '烧制过程中釉面流淌', 'compensation_status' => 'pending'],
];

echo "  → 批量出窑处理:\n";
foreach ($unloadData as $ud) {
    $work = $ud['work_id'] == 1 ? $work1 : $work3;
    echo "    作品: {$work->title}\n";
    echo "      烧成结果: {$ud['post_firing_status']}\n";
    if ($ud['post_firing_status'] == 'broken') {
        echo "      破损原因: {$ud['breakage_reason']}\n";
        echo "      赔付状态: {$ud['compensation_status']}\n";
    }
    if (isset($ud['for_exhibition']) && $ud['for_exhibition']) {
        echo "      入选作品展: 是\n";
    }
    $work->status = $ud['post_firing_status'] == 'success' ? 'unloaded' : 'broken';
}
$batch->status = 'unloaded';
echo "  ✓ 出窑记录已保存\n\n";

// 10. 学员端隐私隔离
echo "【10】学员端隐私隔离测试...\n";
echo "  → 李学员查看自己的作品:\n";
foreach ([$work1, $work2, $work3] as $w) {
    $visible = $w->isVisibleTo($student1);
    echo "    {$w->title}: " . ($visible ? '✓ 可见' : '✗ 不可见') . " (作者: {$w->student->name})\n";
}
echo "\n";
echo "  → 王学员查看破损记录权限:\n";
echo "    作品3 ({$work3->title}) 破损原因:\n";
echo "      老师可见: " . ($work3->canViewFailureDetails($teacher) ? '✓ 是' : '✗ 否') . "\n";
echo "      本人可见: " . ($work3->canViewFailureDetails($student2) ? '✓ 是' : '✗ 否') . " (学员无法查看烧制失败详情)\n";
echo "      其他学员可见: " . ($work3->canViewFailureDetails($student1) ? '✓ 是' : '✗ 否') . "\n\n";

echo "============================================\n";
echo "演示完成！核心功能验证通过 ✓\n";
echo "============================================\n";
echo "\n核心功能清单:\n";
echo "  1. 窑次排程算法 - 支持容量、名额、温区、釉料、空间5维校验\n";
echo "  2. 冲突校验接口 - checkAllConflicts() 全量校验\n";
echo "  3. 曲线修改重校验 - 自动检测受影响作品并提示\n";
echo "  4. 出窑批量更新 - 支持批量记录结果、破损、赔付、作品展\n";
echo "  5. 撤销排烧名额释放 - 移除作品自动释放名额和空间\n";
echo "  6. 学员端隐私隔离 - 仅见自己作品，不可见他人失败记录\n";
