<?php
/**
 * 陶瓷工作室窑炉排烧平台 - API 接口返回演示
 * 模拟 HTTP 请求，展示实际接口返回的数据格式
 * 运行方式: php demo_api.php
 */

echo "============================================\n";
echo "陶瓷工作室窑炉排烧平台 - API 接口演示\n";
echo "============================================\n\n";

// 模拟 API 响应格式化函数
function json_response($data, $status = 200) {
    $statusTexts = [
        200 => 'OK',
        201 => 'Created',
        403 => 'Forbidden',
        422 => 'Unprocessable Entity',
    ];
    echo "HTTP/1.1 {$status} " . ($statusTexts[$status] ?? 'Unknown') . "\n";
    echo "Content-Type: application/json\n";
    echo "\n";
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    echo "\n\n";
    echo str_repeat("-", 60) . "\n\n";
}

// 模拟登录用户
$teacherUser = [
    'id' => 1,
    'name' => '张老师',
    'email' => 'teacher@example.com',
    'role' => 'teacher',
];

$studentUser = [
    'id' => 2,
    'name' => '李学员',
    'email' => 'student@example.com',
    'role' => 'student',
    'student_id' => 'S12345',
    'max_works_per_batch' => 3,
];

// ========================================================================
// 1. 窑次排程 - 创建窑次
// ========================================================================
echo "【API 1】POST /api/kiln-batches - 创建窑次\n";
echo "请求参数:\n";
echo "  kiln_id: 1, firing_curve_template_id: 1\n";
echo "  scheduled_fire_date: 2026-06-15 10:00:00\n\n";
echo "响应结果:\n";

json_response([
    'id' => 1,
    'batch_number' => '20260607001',
    'kiln_id' => 1,
    'kiln' => [
        'id' => 1,
        'name' => '1号电窑',
        'capacity' => 20,
    ],
    'firing_curve_template_id' => 1,
    'firing_curve_template' => [
        'id' => 1,
        'name' => '标准中温氧化烧',
        'max_temperature' => 1250,
    ],
    'created_by' => 1,
    'scheduled_fire_date' => '2026-06-15T10:00:00.000000Z',
    'status' => 'draft',
    'max_capacity' => 20,
    'work_count' => 0,
    'used_space_percent' => 0,
    'created_at' => '2026-06-07T10:00:00.000000Z',
    'updated_at' => '2026-06-07T10:00:00.000000Z',
], 201);

// ========================================================================
// 2. 冲突校验接口
// ========================================================================
echo "【API 2】POST /api/kiln-batches/1/check-conflict - 入窑冲突预校验\n";
echo "请求参数:\n";
echo "  work_id: 5, target_zone: 1\n\n";
echo "响应结果 - 无冲突:\n";

json_response([
    'passed' => true,
    'conflicts' => [],
    'warnings' => [],
]);

echo "响应结果 - 有冲突 (釉料不兼容):\n";

json_response([
    'passed' => false,
    'conflicts' => [
        [
            'type' => 'glaze_compatibility',
            'passed' => false,
            'message' => '存在釉料不兼容问题',
            'incompatibilities' => [
                [
                    'new_glaze' => '铜红釉',
                    'existing_glaze' => '天青釉',
                    'compatibility' => 'incompatible',
                ],
            ],
        ],
    ],
    'warnings' => [],
], 422);

// ========================================================================
// 3. 拖拽作品入窑
// ========================================================================
echo "【API 3】POST /api/kiln-batches/1/add-work - 拖拽作品入窑\n";
echo "请求参数:\n";
echo "  work_id: 5, position_zone: 1, position_shelf: 2\n\n";
echo "响应结果 - 成功:\n";

json_response([
    'success' => true,
    'message' => '作品已成功添加到窑次',
    'warnings' => [],
]);

echo "响应结果 - 失败 (学员名额超限):\n";

json_response([
    'success' => false,
    'message' => '存在冲突，无法添加作品',
    'conflicts' => [
        [
            'type' => 'student_limit',
            'passed' => false,
            'message' => '该学员本窑次作品已达上限 (3/3)',
            'student_id' => 2,
            'student_name' => '李学员',
            'current' => 3,
            'max' => 3,
        ],
    ],
    'warnings' => [],
], 422);

// ========================================================================
// 4. 曲线修改重校验
// ========================================================================
echo "【API 4】POST /api/kiln-batches/1/update-curve - 修改烧成曲线\n";
echo "请求参数:\n";
echo "  firing_curve_template_id: 2 (低温素烧曲线 900°C)\n\n";
echo "响应结果 - 检测到受影响作品:\n";

json_response([
    'success' => true,
    'message' => '曲线已更新，但部分作品可能受影响',
    'has_affected_works' => true,
    'affected_works' => [
        [
            'work_id' => 5,
            'work_title' => '青花瓷瓶',
            'student_id' => 2,
            'student_name' => '李学员',
            'issues' => [
                '泥料 紫砂泥 不兼容新的最高温度 900°C',
                '釉料 天青釉 不兼容新的最高温度 900°C',
            ],
        ],
        [
            'work_id' => 8,
            'work_title' => '陶土花瓶',
            'student_id' => 3,
            'student_name' => '王学员',
            'issues' => [
                '泥料 紫砂泥 不兼容新的最高温度 900°C',
            ],
        ],
    ],
]);

// ========================================================================
// 5. 温区智能推荐
// ========================================================================
echo "【API 5】GET /api/kiln-batches/1/recommend-zone/5 - 智能推荐温区\n";
echo "响应结果:\n";

json_response([
    'recommended_zone' => 1,
    'required_temperature' => 1180,
    'zone_info' => [
        'zone_0' => ['temp' => 1240, 'occupied' => 5],
        'zone_1' => ['temp' => 1260, 'occupied' => 2],
        'zone_2' => ['temp' => 1280, 'occupied' => 4],
    ],
]);

// ========================================================================
// 6. 出窑批量更新
// ========================================================================
echo "【API 6】POST /api/kiln-batches/1/unload - 出窑批量更新\n";
echo "请求参数:\n";
echo "  works: [\n";
echo "    {work_id: 5, post_firing_status: success, for_exhibition: true}\n";
echo "    {work_id: 8, post_firing_status: broken, breakage_reason: 釉面流淌, compensation_status: pending}\n";
echo "  ]\n\n";
echo "响应结果:\n";

json_response([
    'success' => true,
    'message' => '出窑记录已保存',
    'updated_works_count' => 2,
    'details' => [
        [
            'work_id' => 5,
            'title' => '青花瓷瓶',
            'post_firing_status' => 'success',
            'for_exhibition' => true,
            'new_status' => 'unloaded',
        ],
        [
            'work_id' => 8,
            'title' => '陶土花瓶',
            'post_firing_status' => 'broken',
            'breakage_reason' => '釉面流淌',
            'compensation_status' => 'pending',
            'new_status' => 'broken',
        ],
    ],
]);

// ========================================================================
// 7. 撤销排烧 - 释放名额
// ========================================================================
echo "【API 7】DELETE /api/kiln-batches/1/works/5 - 从窑次移除作品\n";
echo "响应结果:\n";

json_response([
    'success' => true,
    'message' => '作品已从窑次移除，名额已释放',
    'released_capacity' => 1,
    'work' => [
        'id' => 5,
        'title' => '青花瓷瓶',
        'previous_status' => 'scheduled',
        'new_status' => 'ready_for_firing',
    ],
    'batch_status' => [
        'previous_count' => 8,
        'current_count' => 7,
        'max_capacity' => 20,
    ],
]);

echo "【API 8】POST /api/kiln-batches/1/cancel - 撤销整个窑次\n";
echo "响应结果:\n";

json_response([
    'success' => true,
    'message' => '窑次已取消，所有名额已释放',
    'affected_students' => [
        [
            'student_id' => 2,
            'student_name' => '李学员',
            'works' => [
                ['work_id' => 5, 'title' => '青花瓷瓶'],
                ['work_id' => 6, 'title' => '茶盏套装'],
            ],
        ],
        [
            'student_id' => 3,
            'student_name' => '王学员',
            'works' => [
                ['work_id' => 8, 'title' => '陶土花瓶'],
            ],
        ],
    ],
    'released_total' => 3,
]);

// ========================================================================
// 8. 学员端 - 作品列表（隐私隔离）
// ========================================================================
echo "【API 9】GET /api/works - 学员查看自己的作品列表\n";
echo "当前用户: 李学员 (student)\n\n";
echo "响应结果:\n";

json_response([
    'data' => [
        [
            'id' => 5,
            'title' => '青花瓷瓶',
            'status' => 'unloaded',
            'clay' => ['id' => 1, 'name' => '紫砂泥'],
            'glazes' => [
                ['id' => 1, 'name' => '天青釉'],
            ],
            'for_exhibition' => true,
            'current_batch' => [
                'id' => 1,
                'batch_number' => '20260607001',
                'status' => 'unloaded',
            ],
            'created_at' => '2026-06-01T10:00:00.000000Z',
        ],
        [
            'id' => 6,
            'title' => '茶盏套装',
            'status' => 'ready_for_firing',
            'clay' => ['id' => 1, 'name' => '紫砂泥'],
            'glazes' => [
                ['id' => 1, 'name' => '天青釉'],
            ],
            'for_exhibition' => false,
            'current_batch' => null,
            'created_at' => '2026-06-02T10:00:00.000000Z',
        ],
    ],
    'current_page' => 1,
    'total' => 2,
    'per_page' => 15,
]);

// ========================================================================
// 9. 学员端 - 他人作品详情（不可见）
// ========================================================================
echo "【API 10】GET /api/works/8 - 学员尝试查看他人作品\n";
echo "当前用户: 李学员 (student)\n";
echo "作品作者: 王学员\n\n";
echo "响应结果:\n";

json_response([
    'message' => '无权查看此作品',
], 403);

// ========================================================================
// 10. 破损记录权限 - 学员不可见他人失败详情
// ========================================================================
echo "【API 11】GET /api/works/8 - 老师查看破损作品详情\n";
echo "当前用户: 张老师 (teacher)\n\n";
echo "响应结果 - 老师可见完整信息:\n";

json_response([
    'id' => 8,
    'title' => '陶土花瓶',
    'student_id' => 3,
    'student' => [
        'id' => 3,
        'name' => '王学员',
        'student_id' => 'S12346',
    ],
    'status' => 'broken',
    'breakage_reason' => '烧制过程中釉面流淌导致器型变形',
    'compensation_status' => 'pending',
    'compensation_notes' => '等待老师评估赔付方案',
    'post_firing_status' => 'broken',
    'clay' => ['id' => 1, 'name' => '紫砂泥'],
    'glazes' => [['id' => 2, 'name' => '铜红釉']],
    'photos' => [
        [
            'id' => 15,
            'type' => 'post_firing',
            'file_url' => '/storage/works/8/post_firing_1.jpg',
            'caption' => '出窑后照片',
        ],
    ],
]);

echo "【同接口】学员查看自己的破损作品详情\n";
echo "当前用户: 王学员 (student) - 作者本人\n\n";
echo "响应结果 - 学员不可见破损原因和赔付信息:\n";

json_response([
    'id' => 8,
    'title' => '陶土花瓶',
    'student_id' => 3,
    'student' => [
        'id' => 3,
        'name' => '王学员',
    ],
    'status' => 'broken',
    'clay' => ['id' => 1, 'name' => '紫砂泥'],
    'glazes' => [['id' => 2, 'name' => '铜红釉']],
    'photos' => [
        [
            'id' => 15,
            'type' => 'post_firing',
            'file_url' => '/storage/works/8/post_firing_1.jpg',
        ],
    ],
]);

// ========================================================================
// 11. 可排期查询（排除维护日）
// ========================================================================
echo "【API 12】GET /api/kilns/1/available-slots - 查询可排烧日期\n";
echo "参数: start_date=2026-06-07, days=7\n\n";
echo "响应结果:\n";

json_response([
    [
        'date' => '2026-06-07',
        'day_of_week' => 0,
        'is_available' => true,
        'is_maintenance' => false,
        'existing_batch_id' => null,
    ],
    [
        'date' => '2026-06-08',
        'day_of_week' => 1,
        'is_available' => false,
        'is_maintenance' => true,
        'existing_batch_id' => null,
    ],
    [
        'date' => '2026-06-09',
        'day_of_week' => 2,
        'is_available' => false,
        'is_maintenance' => false,
        'existing_batch_id' => 1,
        'existing_batch_status' => 'scheduled',
    ],
    [
        'date' => '2026-06-10',
        'day_of_week' => 3,
        'is_available' => true,
        'is_maintenance' => false,
        'existing_batch_id' => null,
    ],
]);

echo "============================================\n";
echo "API 接口演示完成 ✓\n";
echo "============================================\n\n";

echo "接口统计:\n";
echo "  ✓ 窑次排程: 创建、编辑、列表、详情\n";
echo "  ✓ 冲突校验: 5维度全量校验接口\n";
echo "  ✓ 作品入窑: 拖拽添加 + 位置记录\n";
echo "  ✓ 曲线变更: 自动检测受影响作品\n";
echo "  ✓ 智能推荐: 最优温区推荐算法\n";
echo "  ✓ 出窑管理: 批量更新 + 破损记录 + 赔付\n";
echo "  ✓ 撤销排烧: 作品移除 + 整窑撤销 + 名额释放\n";
echo "  ✓ 学员端: 仅见自己作品，隐私隔离\n";
echo "  ✓ 权限控制: 老师/学员角色分离\n";
echo "  ✓ 维护日: 自动排除不可排烧日期\n";
