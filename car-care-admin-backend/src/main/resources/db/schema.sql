CREATE DATABASE IF NOT EXISTS car_care_admin DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE car_care_admin;

DROP TABLE IF EXISTS sys_user;
CREATE TABLE sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    real_name VARCHAR(50) COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    role_code VARCHAR(50) NOT NULL COMMENT '角色编码: BOSS-老板, ADMIN-管理员, MANAGER-负责人, TECHNICIAN-技师',
    status TINYINT DEFAULT 1 COMMENT '状态 0-禁用 1-启用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_phone (phone),
    INDEX idx_role_code (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

DROP TABLE IF EXISTS member;
CREATE TABLE member (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_no VARCHAR(32) NOT NULL UNIQUE COMMENT '会员编号',
    name VARCHAR(50) NOT NULL COMMENT '会员姓名',
    phone VARCHAR(20) NOT NULL UNIQUE COMMENT '手机号',
    car_brand VARCHAR(50) COMMENT '车辆品牌',
    car_model VARCHAR(50) COMMENT '车辆型号',
    plate_number VARCHAR(20) UNIQUE COMMENT '车牌号',
    vin VARCHAR(50) UNIQUE COMMENT '车架号',
    current_package_id BIGINT COMMENT '当前套餐ID',
    status TINYINT DEFAULT 1 COMMENT '状态 0-停用 1-正常',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_member_no (member_no),
    INDEX idx_phone (phone),
    INDEX idx_plate_number (plate_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员表';

DROP TABLE IF EXISTS detection_item;
CREATE TABLE detection_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_code VARCHAR(32) NOT NULL UNIQUE COMMENT '检测项目编码',
    item_name VARCHAR(100) NOT NULL COMMENT '检测项目名称',
    item_category VARCHAR(50) COMMENT '检测分类: 发动机, 底盘, 电气, 外观, 其他',
    standard VARCHAR(500) COMMENT '检测标准',
    unit_price DECIMAL(10,2) DEFAULT 0 COMMENT '单项价格',
    duration INT DEFAULT 30 COMMENT '预计时长(分钟)',
    description TEXT COMMENT '项目说明',
    status TINYINT DEFAULT 1 COMMENT '状态 0-停用 1-启用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_item_code (item_code),
    INDEX idx_item_category (item_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='检测项目表';

DROP TABLE IF EXISTS detection_record;
CREATE TABLE detection_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    record_no VARCHAR(32) NOT NULL UNIQUE COMMENT '检测单号',
    member_id BIGINT NOT NULL COMMENT '会员ID',
    car_info TEXT COMMENT '车辆信息快照(JSON)',
    check_date DATE NOT NULL COMMENT '检测日期',
    check_technician_id BIGINT COMMENT '检测技师ID',
    total_amount DECIMAL(10,2) DEFAULT 0 COMMENT '检测总费用',
    result_summary TEXT COMMENT '检测结果汇总',
    status TINYINT DEFAULT 1 COMMENT '状态 0-已取消 1-待检测 2-检测中 3-已完成',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_record_no (record_no),
    INDEX idx_member_id (member_id),
    INDEX idx_check_date (check_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='检测记录表';

DROP TABLE IF EXISTS detection_record_item;
CREATE TABLE detection_record_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    record_id BIGINT NOT NULL COMMENT '检测记录ID',
    item_id BIGINT NOT NULL COMMENT '检测项目ID',
    item_name VARCHAR(100) NOT NULL COMMENT '项目名称快照',
    item_result VARCHAR(20) COMMENT '检测结果: 正常, 异常, 待观察',
    item_detail TEXT COMMENT '检测详情',
    suggestion TEXT COMMENT '处理建议',
    unit_price DECIMAL(10,2) DEFAULT 0 COMMENT '单价快照',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_record_id (record_id),
    INDEX idx_item_id (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='检测记录明细表';

DROP TABLE IF EXISTS member_package;
CREATE TABLE member_package (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    package_code VARCHAR(32) NOT NULL UNIQUE COMMENT '套餐编码',
    package_name VARCHAR(100) NOT NULL COMMENT '套餐名称',
    package_type VARCHAR(50) COMMENT '套餐类型: 基础保养, 综合保养, 深度保养, 定制',
    original_price DECIMAL(10,2) DEFAULT 0 COMMENT '原价',
    package_price DECIMAL(10,2) DEFAULT 0 COMMENT '套餐价',
    valid_days INT DEFAULT 365 COMMENT '有效期(天)',
    max_usage INT DEFAULT 1 COMMENT '最大使用次数',
    description TEXT COMMENT '套餐说明',
    status TINYINT DEFAULT 0 COMMENT '状态 0-下架 1-上架',
    source_detection_record_id BIGINT COMMENT '来源检测记录ID(溯源)',
    create_by BIGINT COMMENT '创建人ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_package_code (package_code),
    INDEX idx_package_type (package_type),
    INDEX idx_status (status),
    INDEX idx_source_record (source_detection_record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员套餐表';

DROP TABLE IF EXISTS package_benefit;
CREATE TABLE package_benefit (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    package_id BIGINT NOT NULL COMMENT '套餐ID',
    benefit_type VARCHAR(50) NOT NULL COMMENT '权益类型: ITEM-检测项目, DISCOUNT-折扣, COUPON-优惠券, GIFT-赠送',
    benefit_name VARCHAR(100) NOT NULL COMMENT '权益名称',
    benefit_value DECIMAL(10,2) COMMENT '权益值(次数/折扣率/金额)',
    benefit_detail TEXT COMMENT '权益详情说明',
    sort_order INT DEFAULT 0 COMMENT '排序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_package_id (package_id),
    INDEX idx_benefit_type (benefit_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='套餐权益表';

DROP TABLE IF EXISTS member_package_order;
CREATE TABLE member_package_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(32) NOT NULL UNIQUE COMMENT '订单号',
    member_id BIGINT NOT NULL COMMENT '会员ID',
    package_id BIGINT NOT NULL COMMENT '套餐ID',
    package_name VARCHAR(100) COMMENT '套餐名称快照',
    package_price DECIMAL(10,2) DEFAULT 0 COMMENT '套餐价格快照',
    purchase_date DATE NOT NULL COMMENT '购买日期',
    valid_start_date DATE NOT NULL COMMENT '生效开始日期',
    valid_end_date DATE NOT NULL COMMENT '有效结束日期',
    remaining_usage INT DEFAULT 0 COMMENT '剩余使用次数',
    total_usage INT DEFAULT 0 COMMENT '总使用次数',
    status TINYINT DEFAULT 1 COMMENT '状态 0-已失效 1-有效 2-已用完',
    source_detection_record_id BIGINT COMMENT '来源检测记录ID(溯源)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_order_no (order_no),
    INDEX idx_member_id (member_id),
    INDEX idx_package_id (package_id),
    INDEX idx_status (status),
    INDEX idx_source_record (source_detection_record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员套餐购买订单表';

DROP TABLE IF EXISTS technician;
CREATE TABLE technician (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tech_no VARCHAR(32) NOT NULL UNIQUE COMMENT '技师编号',
    name VARCHAR(50) NOT NULL COMMENT '技师姓名',
    phone VARCHAR(20) COMMENT '手机号',
    skill_level VARCHAR(20) COMMENT '技能等级: 初级, 中级, 高级, 专家',
    specialty VARCHAR(200) COMMENT '专长',
    status TINYINT DEFAULT 1 COMMENT '状态 0-离职 1-在岗',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_tech_no (tech_no),
    INDEX idx_skill_level (skill_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='技师表';

DROP TABLE IF EXISTS workstation;
CREATE TABLE workstation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    station_no VARCHAR(32) NOT NULL UNIQUE COMMENT '工位编号',
    station_name VARCHAR(50) NOT NULL COMMENT '工位名称',
    station_type VARCHAR(50) COMMENT '工位类型: 保养工位, 维修工位, 钣金工位, 喷漆工位',
    max_capacity INT DEFAULT 1 COMMENT '最大容纳车辆数',
    equipment TEXT COMMENT '配备设备',
    status TINYINT DEFAULT 1 COMMENT '状态 0-停用 1-可用 2-占用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_station_no (station_no),
    INDEX idx_station_type (station_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工位表';

DROP TABLE IF EXISTS test_drive_record;
CREATE TABLE test_drive_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    drive_no VARCHAR(32) NOT NULL UNIQUE COMMENT '试驾单号',
    member_id BIGINT NOT NULL COMMENT '会员ID',
    car_info TEXT COMMENT '车辆信息快照',
    technician_id BIGINT NOT NULL COMMENT '试驾技师ID',
    workstation_id BIGINT COMMENT '来源工位ID(溯源)',
    repair_order_id BIGINT COMMENT '关联维修单ID(溯源)',
    drive_start_time DATETIME COMMENT '试驾开始时间',
    drive_end_time DATETIME COMMENT '试驾结束时间',
    drive_route VARCHAR(500) COMMENT '试驾路线',
    drive_distance DECIMAL(8,2) COMMENT '试驾里程(公里)',
    drive_result TEXT COMMENT '试驾结果',
    problems_found TEXT COMMENT '发现问题',
    status TINYINT DEFAULT 1 COMMENT '状态 0-已取消 1-待试驾 2-试驾中 3-已完成',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_drive_no (drive_no),
    INDEX idx_member_id (member_id),
    INDEX idx_technician_id (technician_id),
    INDEX idx_repair_order_id (repair_order_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='试驾记录表';

DROP TABLE IF EXISTS repair_order;
CREATE TABLE repair_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(32) NOT NULL UNIQUE COMMENT '维修单号',
    member_id BIGINT NOT NULL COMMENT '会员ID',
    car_info TEXT COMMENT '车辆信息快照(JSON)',
    package_order_id BIGINT COMMENT '使用的套餐订单ID(溯源)',
    detection_record_id BIGINT COMMENT '来源检测记录ID(溯源)',
    technician_id BIGINT COMMENT '负责技师ID',
    workstation_id BIGINT COMMENT '工位ID',
    order_type VARCHAR(50) COMMENT '工单类型: 保养, 维修, 钣金, 喷漆',
    problem_description TEXT COMMENT '问题描述',
    plan_start_time DATETIME COMMENT '计划开始时间',
    plan_end_time DATETIME COMMENT '计划完成时间',
    actual_start_time DATETIME COMMENT '实际开始时间',
    actual_end_time DATETIME COMMENT '实际完成时间',
    delay_reason TEXT COMMENT '延期原因',
    delay_handler_id BIGINT COMMENT '延期处理人ID',
    delay_handle_time DATETIME COMMENT '延期处理时间',
    delay_handle_result TEXT COMMENT '延期处理结果',
    total_amount DECIMAL(10,2) DEFAULT 0 COMMENT '总费用',
    quality_status VARCHAR(20) DEFAULT 'PENDING' COMMENT '质量状态: PENDING-待质检, CHECKING-质检中, PASSED-质检通过, FAILED-质检不通过',
    status TINYINT DEFAULT 1 COMMENT '状态 0-已取消 1-待分配 2-待开工 3-施工中 4-待质检 5-已完成 6-已关闭',
    close_handler_id BIGINT COMMENT '关闭处理人ID',
    close_time DATETIME COMMENT '关闭时间',
    close_remark TEXT COMMENT '关闭备注',
    create_by BIGINT COMMENT '创建人ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_order_no (order_no),
    INDEX idx_member_id (member_id),
    INDEX idx_technician_id (technician_id),
    INDEX idx_workstation_id (workstation_id),
    INDEX idx_status (status),
    INDEX idx_quality_status (quality_status),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修工单表';

DROP TABLE IF EXISTS repair_status_history;
CREATE TABLE repair_status_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    repair_order_id BIGINT NOT NULL COMMENT '维修单ID',
    old_status TINYINT COMMENT '原状态',
    new_status TINYINT NOT NULL COMMENT '新状态',
    old_quality_status VARCHAR(20) COMMENT '原质量状态',
    new_quality_status VARCHAR(20) COMMENT '新质量状态',
    operator_id BIGINT NOT NULL COMMENT '操作人ID',
    operate_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    operate_remark TEXT COMMENT '操作备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_repair_order_id (repair_order_id),
    INDEX idx_operate_time (operate_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修单状态历史表';

DROP TABLE IF EXISTS repair_item;
CREATE TABLE repair_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    repair_order_id BIGINT NOT NULL COMMENT '维修单ID',
    item_type VARCHAR(20) NOT NULL COMMENT '项目类型: LABOR-工时, PART-配件, OTHER-其他',
    item_name VARCHAR(100) NOT NULL COMMENT '项目名称',
    item_code VARCHAR(50) COMMENT '项目编码',
    quantity INT DEFAULT 1 COMMENT '数量',
    unit_price DECIMAL(10,2) DEFAULT 0 COMMENT '单价',
    subtotal DECIMAL(10,2) DEFAULT 0 COMMENT '小计',
    technician_id BIGINT COMMENT '施工技师ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_repair_order_id (repair_order_id),
    INDEX idx_item_type (item_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修项目明细表';

DROP TABLE IF EXISTS efficiency_report;
CREATE TABLE efficiency_report (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_no VARCHAR(32) NOT NULL UNIQUE COMMENT '报表编号',
    report_type VARCHAR(50) NOT NULL COMMENT '报表类型: DAILY-日报, WEEKLY-周报, MONTHLY-月报',
    report_date DATE NOT NULL COMMENT '报表日期',
    total_orders INT DEFAULT 0 COMMENT '总工单数',
    completed_orders INT DEFAULT 0 COMMENT '已完工单数',
    delayed_orders INT DEFAULT 0 COMMENT '延期工单数',
    total_revenue DECIMAL(12,2) DEFAULT 0 COMMENT '总营收',
    average_completion_hours DECIMAL(8,2) DEFAULT 0 COMMENT '平均完工时长(小时)',
    pass_rate DECIMAL(5,2) DEFAULT 0 COMMENT '一次质检通过率(%)',
    tech_efficiency TEXT COMMENT '技师效率数据(JSON)',
    station_utilization TEXT COMMENT '工位利用率数据(JSON)',
    remark TEXT COMMENT '备注',
    source_close_order_ids TEXT COMMENT '来源关闭工单ID列表(溯源)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_report_no (report_no),
    INDEX idx_report_type (report_type),
    INDEX idx_report_date (report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='经营效率报表表';

DROP TABLE IF EXISTS batch_operation;
CREATE TABLE batch_operation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    batch_no VARCHAR(32) NOT NULL UNIQUE COMMENT '批次号',
    operation_type VARCHAR(50) NOT NULL COMMENT '操作类型: STATUS_CHANGE-状态变更, PRICE_CHANGE-价格变更, ASSIGN-分配, EXPORT-导出',
    operation_name VARCHAR(100) NOT NULL COMMENT '操作名称',
    target_type VARCHAR(50) NOT NULL COMMENT '目标类型: REPAIR_ORDER-维修单, PACKAGE-套餐, MEMBER-会员',
    target_ids TEXT NOT NULL COMMENT '目标ID列表(逗号分隔)',
    operation_detail TEXT COMMENT '操作详情(JSON)',
    total_count INT DEFAULT 0 COMMENT '总记录数',
    success_count INT DEFAULT 0 COMMENT '成功数',
    fail_count INT DEFAULT 0 COMMENT '失败数',
    operator_id BIGINT NOT NULL COMMENT '操作人ID',
    confirm_time DATETIME COMMENT '确认时间',
    status TINYINT DEFAULT 0 COMMENT '状态 0-待确认 1-执行中 2-已完成 3-已取消',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_batch_no (batch_no),
    INDEX idx_operation_type (operation_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='批量操作表';

DROP TABLE IF EXISTS exception_record;
CREATE TABLE exception_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    exception_no VARCHAR(32) NOT NULL UNIQUE COMMENT '异常编号',
    exception_type VARCHAR(50) NOT NULL COMMENT '异常类型: BATCH_FAIL-批量操作失败, STATUS_CHANGE_FAIL-状态变更失败, PAYMENT_FAIL-支付失败',
    source_type VARCHAR(50) COMMENT '来源类型',
    source_id BIGINT COMMENT '来源ID',
    batch_operation_id BIGINT COMMENT '关联批量操作ID',
    error_code VARCHAR(50) COMMENT '错误码',
    error_message TEXT COMMENT '错误信息',
    error_detail TEXT COMMENT '错误详情(JSON)',
    handler_id BIGINT COMMENT '处理人ID',
    handle_result TEXT COMMENT '处理结果',
    handle_time DATETIME COMMENT '处理时间',
    status TINYINT DEFAULT 0 COMMENT '状态 0-待处理 1-处理中 2-已处理 3-已忽略',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_exception_no (exception_no),
    INDEX idx_exception_type (exception_type),
    INDEX idx_status (status),
    INDEX idx_source (source_type, source_id),
    INDEX idx_batch_id (batch_operation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='异常清单表';

INSERT INTO sys_user (username, password, real_name, phone, email, role_code, status) VALUES
('boss', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '张老板', '13800138001', 'boss@carcare.com', 'BOSS', 1),
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '李管理员', '13800138002', 'admin@carcare.com', 'ADMIN', 1),
('manager', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '王经理', '13800138003', 'manager@carcare.com', 'MANAGER', 1),
('tech1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '陈技师', '13800138004', 'tech1@carcare.com', 'TECHNICIAN', 1),
('tech2', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '刘技师', '13800138005', 'tech2@carcare.com', 'TECHNICIAN', 1);

INSERT INTO technician (tech_no, name, phone, skill_level, specialty, status) VALUES
('TECH001', '陈技师', '13800138004', '高级', '发动机维修,底盘检测', 1),
('TECH002', '刘技师', '13800138005', '中级', '电气系统,空调维修', 1),
('TECH003', '赵技师', '13800138006', '专家', '变速箱维修,性能调校', 1);

INSERT INTO workstation (station_no, station_name, station_type, max_capacity, equipment, status) VALUES
('ST001', '1号保养工位', '保养工位', 1, '举升机,工具车,接油机', 1),
('ST002', '2号维修工位', '维修工位', 1, '举升机,诊断电脑,专用工具组', 1),
('ST003', '3号钣金工位', '钣金工位', 1, '大梁校正仪,钣金工具组', 1),
('ST004', '4号喷漆工位', '喷漆工位', 1, '烤漆房,喷枪,调漆设备', 1);

INSERT INTO detection_item (item_code, item_name, item_category, standard, unit_price, duration, description, status) VALUES
('DET001', '发动机常规检测', '发动机', '检测发动机运转状态、机油液位、冷却液等', 120.00, 30, '包括发动机异响检测、机油品质检查、冷却系统检测', 1),
('DET002', '变速箱检测', '发动机', '检测变速箱油、换挡平顺性', 150.00, 40, '自动变速箱和手动变速箱检测', 1),
('DET003', '制动系统检测', '底盘', '检测刹车片、刹车盘、制动液', 100.00, 25, '四轮刹车片磨损检测、刹车盘平整度检测', 1),
('DET004', '悬挂系统检测', '底盘', '检测减震器、悬挂连杆、球头', 100.00, 30, '包括减震器性能、悬挂部件松紧度检测', 1),
('DET005', '轮胎检测', '底盘', '检测胎压、胎纹、磨损情况', 50.00, 15, '四轮胎压检测、胎纹深度检测、动平衡检查', 1),
('DET006', '电气系统检测', '电气', '检测电瓶、发电机、灯光系统', 80.00, 20, '电瓶寿命检测、充电系统检测、全车灯光检测', 1),
('DET007', '空调系统检测', '电气', '检测空调制冷效果、管路压力', 100.00, 30, '空调制冷效果、冷媒压力、风道清洁度检测', 1),
('DET008', '外观检测', '外观', '检测车身漆面、玻璃、灯具', 60.00, 20, '车身划痕、凹陷检测,玻璃破损检测', 1),
('DET009', '全车电脑诊断', '电气', '使用诊断电脑读取全车故障码', 150.00, 35, '读取发动机、变速箱、ABS等系统故障码', 1),
('DET010', '底盘综合检测', '底盘', '底盘全方位检测', 200.00, 60, '制动、悬挂、轮胎、转向系统综合检测', 1);

INSERT INTO member (member_no, name, phone, car_brand, car_model, plate_number, vin, status) VALUES
('MBR001', '王先生', '13900139001', '大众', '迈腾2023款', '京A12345', 'LFV2A21K7D4000001', 1),
('MBR002', '李女士', '13900139002', '丰田', '凯美瑞2022款', '京B67890', 'LVGBE40K3DG000002', 1),
('MBR003', '张先生', '13900139003', '宝马', '3系2023款', '京C11111', 'WBA3B1G50FNT00003', 1),
('MBR004', '刘女士', '13900139004', '奔驰', 'C级2022款', '京D22222', 'LE4WG4DB6FL000004', 1),
('MBR005', '陈先生', '13900139005', '奥迪', 'A4L 2023款', '京E33333', 'LFV3A24F4C3000005', 1);

INSERT INTO member_package (package_code, package_name, package_type, original_price, package_price, valid_days, max_usage, description, status, create_by) VALUES
('PKG001', '基础保养套餐', '基础保养', 800.00, 599.00, 365, 4, '包含4次基础保养，每次含机油机滤更换、全车检查', 1, 2),
('PKG002', '综合保养套餐', '综合保养', 1500.00, 1199.00, 365, 2, '包含2次综合保养，含机油三滤、空调滤芯、全车检测', 1, 2),
('PKG003', '深度保养套餐', '深度保养', 3000.00, 2499.00, 545, 2, '包含2次深度保养，含变速箱油、刹车油、火花塞更换', 1, 2),
('PKG004', '新车养护套餐', '定制', 2000.00, 1699.00, 730, 6, '新车专享，包含6次精细养护，延长质保', 1, 2);

INSERT INTO package_benefit (package_id, benefit_type, benefit_name, benefit_value, benefit_detail, sort_order) VALUES
(1, 'ITEM', '机油机滤更换', 4.00, '每次保养含4L品牌机油+原厂机滤', 1),
(1, 'ITEM', '全车安全检测', 4.00, '每次保养包含20项安全检测', 2),
(1, 'DISCOUNT', '维修工时8折', 0.80, '套餐有效期内所有维修工时享受8折优惠', 3),
(1, 'GIFT', '免费洗车', 4.00, '每次保养后赠送精洗一次', 4),
(2, 'ITEM', '机油三滤更换', 2.00, '每次保养含机油、机滤、空滤、燃油滤', 1),
(2, 'ITEM', '空调系统检测', 2.00, '包含空调滤芯更换、制冷效果检测', 2),
(2, 'ITEM', '全车电脑诊断', 2.00, '专业诊断电脑读取全车故障码', 3),
(2, 'DISCOUNT', '配件9折', 0.90, '套餐有效期内所有配件享受9折优惠', 4),
(3, 'ITEM', '变速箱油更换', 2.00, '自动变速箱油循环更换', 1),
(3, 'ITEM', '刹车系统保养', 2.00, '含刹车油更换、刹车片检测', 2),
(3, 'ITEM', '火花塞更换', 1.00, '原厂火花塞4支更换', 3),
(3, 'COUPON', '漆面修复券', 300.00, '赠送300元漆面修复代金券', 4);
