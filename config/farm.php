<?php

return [

    'status_maps' => [

        'orders' => [
            'pending' => [
                'label' => '待处理',
                'color' => 'yellow',
            ],
            'confirmed' => [
                'label' => '已确认',
                'color' => 'blue',
            ],
            'processing' => [
                'label' => '处理中',
                'color' => 'purple',
            ],
            'sorting' => [
                'label' => '分拣中',
                'color' => 'indigo',
            ],
            'shipped' => [
                'label' => '已发货',
                'color' => 'cyan',
            ],
            'completed' => [
                'label' => '已完成',
                'color' => 'green',
            ],
            'cancelled' => [
                'label' => '已取消',
                'color' => 'red',
            ],
            'refunded' => [
                'label' => '已退款',
                'color' => 'gray',
            ],
        ],

        'sorting_tasks' => [
            'pending' => [
                'label' => '待分拣',
                'color' => 'yellow',
            ],
            'in_progress' => [
                'label' => '分拣中',
                'color' => 'blue',
            ],
            'completed' => [
                'label' => '已完成',
                'color' => 'green',
            ],
            'suspended' => [
                'label' => '已暂停',
                'color' => 'orange',
            ],
            'cancelled' => [
                'label' => '已取消',
                'color' => 'red',
            ],
        ],

        'shipments' => [
            'pending' => [
                'label' => '待发货',
                'color' => 'yellow',
            ],
            'packing' => [
                'label' => '打包中',
                'color' => 'blue',
            ],
            'shipped' => [
                'label' => '已发货',
                'color' => 'purple',
            ],
            'in_transit' => [
                'label' => '运输中',
                'color' => 'indigo',
            ],
            'delivered' => [
                'label' => '已送达',
                'color' => 'green',
            ],
            'returned' => [
                'label' => '已退回',
                'color' => 'orange',
            ],
            'lost' => [
                'label' => '已丢失',
                'color' => 'red',
            ],
        ],

        'alert_levels' => [
            'info' => [
                'label' => '提示',
                'color' => 'blue',
            ],
            'warning' => [
                'label' => '警告',
                'color' => 'yellow',
            ],
            'critical' => [
                'label' => '严重',
                'color' => 'orange',
            ],
            'emergency' => [
                'label' => '紧急',
                'color' => 'red',
            ],
        ],

        'machinery_appointments' => [
            'pending' => [
                'label' => '待确认',
                'color' => 'yellow',
            ],
            'confirmed' => [
                'label' => '已确认',
                'color' => 'blue',
            ],
            'in_progress' => [
                'label' => '进行中',
                'color' => 'purple',
            ],
            'completed' => [
                'label' => '已完成',
                'color' => 'green',
            ],
            'cancelled' => [
                'label' => '已取消',
                'color' => 'red',
            ],
        ],

        'subsidy_vouchers' => [
            'draft' => [
                'label' => '草稿',
                'color' => 'gray',
            ],
            'pending' => [
                'label' => '待审核',
                'color' => 'yellow',
            ],
            'approved' => [
                'label' => '已通过',
                'color' => 'green',
            ],
            'rejected' => [
                'label' => '已拒绝',
                'color' => 'red',
            ],
            'issued' => [
                'label' => '已发放',
                'color' => 'blue',
            ],
            'expired' => [
                'label' => '已过期',
                'color' => 'orange',
            ],
        ],

        'users' => [
            'active' => [
                'label' => '正常',
                'color' => 'green',
            ],
            'inactive' => [
                'label' => '停用',
                'color' => 'gray',
            ],
            'suspended' => [
                'label' => '暂停',
                'color' => 'yellow',
            ],
        ],

        'greenhouses' => [
            'active' => [
                'label' => '运行中',
                'color' => 'green',
            ],
            'maintenance' => [
                'label' => '维护中',
                'color' => 'yellow',
            ],
            'idle' => [
                'label' => '闲置',
                'color' => 'gray',
            ],
            'offline' => [
                'label' => '离线',
                'color' => 'red',
            ],
        ],

    ],

    'sensor_types' => [
        'temperature' => [
            'label' => '温度传感器',
            'unit' => '°C',
            'min' => -20,
            'max' => 60,
            'icon' => 'thermometer',
        ],
        'humidity' => [
            'label' => '湿度传感器',
            'unit' => '%',
            'min' => 0,
            'max' => 100,
            'icon' => 'droplet',
        ],
        'soil_moisture' => [
            'label' => '土壤湿度传感器',
            'unit' => '%',
            'min' => 0,
            'max' => 100,
            'icon' => 'soil',
        ],
        'soil_temperature' => [
            'label' => '土壤温度传感器',
            'unit' => '°C',
            'min' => -10,
            'max' => 50,
            'icon' => 'thermometer',
        ],
        'light' => [
            'label' => '光照传感器',
            'unit' => 'lux',
            'min' => 0,
            'max' => 200000,
            'icon' => 'sun',
        ],
        'co2' => [
            'label' => '二氧化碳传感器',
            'unit' => 'ppm',
            'min' => 0,
            'max' => 10000,
            'icon' => 'gas',
        ],
        'ph' => [
            'label' => 'pH值传感器',
            'unit' => 'pH',
            'min' => 0,
            'max' => 14,
            'icon' => 'flask',
        ],
        'ec' => [
            'label' => '电导率传感器',
            'unit' => 'mS/cm',
            'min' => 0,
            'max' => 20,
            'icon' => 'zap',
        ],
        'wind_speed' => [
            'label' => '风速传感器',
            'unit' => 'm/s',
            'min' => 0,
            'max' => 100,
            'icon' => 'wind',
        ],
    ],

    'quality_levels' => [
        'premium' => [
            'label' => '特级',
            'color' => 'purple',
            'description' => '最高品质，严格筛选标准',
        ],
        'grade_a' => [
            'label' => '一级',
            'color' => 'green',
            'description' => '高品质，符合优质标准',
        ],
        'grade_b' => [
            'label' => '二级',
            'color' => 'blue',
            'description' => '良好品质，符合基本标准',
        ],
        'grade_c' => [
            'label' => '三级',
            'color' => 'yellow',
            'description' => '合格品质',
        ],
        'rejected' => [
            'label' => '不合格',
            'color' => 'red',
            'description' => '不符合品质标准',
        ],
    ],

    'discrepancy_types' => [
        'quantity_missing' => [
            'label' => '数量短缺',
            'color' => 'yellow',
            'description' => '实际数量少于订单数量',
        ],
        'quantity_excess' => [
            'label' => '数量多余',
            'color' => 'blue',
            'description' => '实际数量多于订单数量',
        ],
        'wrong_product' => [
            'label' => '品种错误',
            'color' => 'orange',
            'description' => '产品品种与订单不符',
        ],
        'quality_issue' => [
            'label' => '品质问题',
            'color' => 'red',
            'description' => '产品品质不符合要求',
        ],
        'damage' => [
            'label' => '损坏',
            'color' => 'purple',
            'description' => '产品在运输或分拣过程中损坏',
        ],
        'expired' => [
            'label' => '过期',
            'color' => 'gray',
            'description' => '产品已过期',
        ],
        'packaging_issue' => [
            'label' => '包装问题',
            'color' => 'indigo',
            'description' => '包装不符合要求',
        ],
        'other' => [
            'label' => '其他',
            'color' => 'gray',
            'description' => '其他类型的差异',
        ],
    ],

];
