-- 创建数据库
CREATE DATABASE IF NOT EXISTS badminton_arena DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE badminton_arena;

-- 1. 用户表
CREATE TABLE sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码',
    real_name VARCHAR(50) COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    avatar VARCHAR(255) COMMENT '头像',
    status TINYINT DEFAULT 1 COMMENT '状态 1-正常 0-禁用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 2. 角色表
CREATE TABLE sys_role (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE COMMENT '角色名称',
    role_code VARCHAR(50) NOT NULL UNIQUE COMMENT '角色编码',
    description VARCHAR(200) COMMENT '描述',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 3. 用户角色关联表
CREATE TABLE sys_user_role (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- 4. 场地表
CREATE TABLE court (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    court_no VARCHAR(20) NOT NULL UNIQUE COMMENT '场地编号',
    name VARCHAR(50) NOT NULL COMMENT '场地名称',
    type VARCHAR(20) DEFAULT 'standard' COMMENT '场地类型 standard/vip',
    price_per_hour DECIMAL(10,2) NOT NULL COMMENT '每小时价格',
    status TINYINT DEFAULT 1 COMMENT '状态 1-可用 0-维护中',
    description VARCHAR(500) COMMENT '描述',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='场地表';

-- 5. 预约表
CREATE TABLE booking (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_no VARCHAR(32) NOT NULL UNIQUE COMMENT '预约单号',
    user_id BIGINT NOT NULL COMMENT '预约用户ID',
    court_id BIGINT NOT NULL COMMENT '场地ID',
    booking_date DATE NOT NULL COMMENT '预约日期',
    start_time TIME NOT NULL COMMENT '开始时间',
    end_time TIME NOT NULL COMMENT '结束时间',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '总金额',
    pay_amount DECIMAL(10,2) DEFAULT 0 COMMENT '实付金额',
    status TINYINT DEFAULT 0 COMMENT '状态 0-待支付 1-已支付 2-已取消 3-已完成',
    pay_time DATETIME COMMENT '支付时间',
    remark VARCHAR(500) COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    INDEX idx_user_id(user_id),
    INDEX idx_court_id(court_id),
    INDEX idx_booking_date(booking_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约表';

-- 6. 支付表
CREATE TABLE payment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pay_no VARCHAR(32) NOT NULL UNIQUE COMMENT '支付单号',
    booking_id BIGINT NOT NULL COMMENT '预约ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    amount DECIMAL(10,2) NOT NULL COMMENT '支付金额',
    pay_type VARCHAR(20) DEFAULT 'wechat' COMMENT '支付方式 wechat/alipay/cash',
    status TINYINT DEFAULT 0 COMMENT '状态 0-待支付 1-支付成功 2-支付失败',
    transaction_id VARCHAR(100) COMMENT '第三方交易号',
    pay_time DATETIME COMMENT '支付完成时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_booking_id(booking_id),
    INDEX idx_user_id(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付表';

-- 7. 设备表
CREATE TABLE equipment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    equip_no VARCHAR(32) NOT NULL UNIQUE COMMENT '设备编号',
    name VARCHAR(100) NOT NULL COMMENT '设备名称',
    category VARCHAR(50) COMMENT '设备类别',
    location VARCHAR(100) COMMENT '存放位置',
    status TINYINT DEFAULT 1 COMMENT '状态 1-正常 2-待巡检 3-故障 4-维修中',
    last_inspection_time DATETIME COMMENT '上次巡检时间',
    next_inspection_time DATETIME COMMENT '下次巡检时间',
    description VARCHAR(500) COMMENT '描述',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备表';

-- 8. 巡检表
CREATE TABLE inspection (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    inspection_no VARCHAR(32) NOT NULL UNIQUE COMMENT '巡检单号',
    equipment_id BIGINT NOT NULL COMMENT '设备ID',
    inspector_id BIGINT COMMENT '巡检人ID',
    plan_time DATETIME COMMENT '计划巡检时间',
    actual_time DATETIME COMMENT '实际巡检时间',
    status TINYINT DEFAULT 0 COMMENT '状态 0-待巡检 1-巡检中 2-已完成 3-异常',
    result VARCHAR(1000) COMMENT '巡检结果',
    abnormal_desc VARCHAR(500) COMMENT '异常描述',
    images TEXT COMMENT '巡检图片(JSON数组)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    INDEX idx_equipment_id(equipment_id),
    INDEX idx_inspector_id(inspector_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='巡检表';

-- 9. 维修表
CREATE TABLE repair (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    repair_no VARCHAR(32) NOT NULL UNIQUE COMMENT '维修单号',
    equipment_id BIGINT NOT NULL COMMENT '设备ID',
    inspection_id BIGINT COMMENT '关联巡检ID',
    reporter_id BIGINT COMMENT '报修人ID',
    repairer_id BIGINT COMMENT '维修人ID',
    priority TINYINT DEFAULT 2 COMMENT '优先级 1-紧急 2-普通 3-低',
    status TINYINT DEFAULT 0 COMMENT '状态 0-待处理 1-维修中 2-已完成 3-已取消',
    fault_desc VARCHAR(500) COMMENT '故障描述',
    repair_desc VARCHAR(1000) COMMENT '维修描述',
    cost DECIMAL(10,2) DEFAULT 0 COMMENT '维修费用',
    report_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '报修时间',
    start_time DATETIME COMMENT '开始维修时间',
    finish_time DATETIME COMMENT '完成时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    INDEX idx_equipment_id(equipment_id),
    INDEX idx_repairer_id(repairer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修表';

-- 10. 教练表
CREATE TABLE coach (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE COMMENT '关联用户ID',
    coach_no VARCHAR(32) NOT NULL UNIQUE COMMENT '教练编号',
    name VARCHAR(50) NOT NULL COMMENT '教练姓名',
    level VARCHAR(20) DEFAULT 'normal' COMMENT '教练等级 normal/senior/master',
    specialty VARCHAR(200) COMMENT '专长',
    hourly_rate DECIMAL(10,2) NOT NULL COMMENT '课时费',
    status TINYINT DEFAULT 1 COMMENT '状态 1-在职 0-离职',
    description VARCHAR(500) COMMENT '简介',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教练表';

-- 11. 课程表
CREATE TABLE course (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_no VARCHAR(32) NOT NULL UNIQUE COMMENT '课程编号',
    name VARCHAR(100) NOT NULL COMMENT '课程名称',
    coach_id BIGINT NOT NULL COMMENT '教练ID',
    court_id BIGINT COMMENT '场地ID',
    course_type VARCHAR(20) DEFAULT 'private' COMMENT '课程类型 private/group',
    max_students INT DEFAULT 1 COMMENT '最大人数',
    current_students INT DEFAULT 0 COMMENT '当前人数',
    duration INT DEFAULT 60 COMMENT '课程时长(分钟)',
    price DECIMAL(10,2) NOT NULL COMMENT '课程价格',
    status TINYINT DEFAULT 1 COMMENT '状态 1-开放 0-关闭',
    description VARCHAR(500) COMMENT '描述',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程表';

-- 12. 课程排班表
CREATE TABLE course_schedule (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL COMMENT '课程ID',
    coach_id BIGINT NOT NULL COMMENT '教练ID',
    court_id BIGINT COMMENT '场地ID',
    schedule_date DATE NOT NULL COMMENT '排班日期',
    start_time TIME NOT NULL COMMENT '开始时间',
    end_time TIME NOT NULL COMMENT '结束时间',
    max_students INT DEFAULT 1 COMMENT '最大人数',
    enrolled_count INT DEFAULT 0 COMMENT '已报名人数',
    status TINYINT DEFAULT 1 COMMENT '状态 1-可报名 2-已满 3-已取消',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    INDEX idx_course_id(course_id),
    INDEX idx_coach_id(coach_id),
    INDEX idx_schedule_date(schedule_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程排班表';

-- 13. 课程报名表
CREATE TABLE course_enrollment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    schedule_id BIGINT NOT NULL COMMENT '排班ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    course_id BIGINT NOT NULL COMMENT '课程ID',
    status TINYINT DEFAULT 1 COMMENT '状态 1-已报名 2-已取消 3-已完成',
    enroll_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
    cancel_time DATETIME COMMENT '取消时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    INDEX idx_schedule_id(schedule_id),
    INDEX idx_user_id(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程报名表';

-- 14. 候补名单表
CREATE TABLE waitlist (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    schedule_id BIGINT NOT NULL COMMENT '排班ID',
    course_id BIGINT NOT NULL COMMENT '课程ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    wait_order INT NOT NULL COMMENT '候补顺序',
    status TINYINT DEFAULT 0 COMMENT '状态 0-候补中 1-已转正 2-已取消',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    INDEX idx_schedule_id(schedule_id),
    INDEX idx_user_id(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='候补名单表';

-- 15. 待办事项表
CREATE TABLE todo_task (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_no VARCHAR(32) NOT NULL UNIQUE COMMENT '任务编号',
    title VARCHAR(200) NOT NULL COMMENT '任务标题',
    content TEXT COMMENT '任务内容',
    type VARCHAR(50) NOT NULL COMMENT '任务类型 inspection/repair/waitlist/course_schedule',
    biz_id BIGINT COMMENT '关联业务ID',
    assignee_id BIGINT NOT NULL COMMENT '负责人ID',
    assigner_id BIGINT COMMENT '派单人ID',
    priority TINYINT DEFAULT 2 COMMENT '优先级 1-紧急 2-普通 3-低',
    status TINYINT DEFAULT 0 COMMENT '状态 0-待处理 1-处理中 2-已完成 3-已取消',
    due_time DATETIME COMMENT '截止时间',
    finish_time DATETIME COMMENT '完成时间',
    remark VARCHAR(500) COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    INDEX idx_assignee_id(assignee_id),
    INDEX idx_type(type),
    INDEX idx_status(status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='待办事项表';

-- 16. 库存占用报表
CREATE TABLE inventory_report (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_date DATE NOT NULL COMMENT '报表日期',
    report_type VARCHAR(50) NOT NULL COMMENT '报表类型 court_usage/course_occupancy',
    biz_id BIGINT COMMENT '业务ID',
    biz_name VARCHAR(200) COMMENT '业务名称',
    total_capacity INT COMMENT '总容量',
    used_capacity INT COMMENT '已用容量',
    occupancy_rate DECIMAL(5,2) COMMENT '占用率%',
    details TEXT COMMENT '详情(JSON)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_date_type_biz(report_date, report_type, biz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存占用报表';

-- 17. 接口调用日志表
CREATE TABLE api_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trace_id VARCHAR(64) COMMENT '链路ID',
    api_path VARCHAR(255) NOT NULL COMMENT '接口路径',
    api_method VARCHAR(10) COMMENT '请求方法',
    request_params TEXT COMMENT '请求参数(原始参数数组)',
    query_params TEXT COMMENT '查询参数(JSON)',
    request_body TEXT COMMENT '请求体(@RequestBody注解参数的JSON)',
    response_data TEXT COMMENT '响应数据',
    status TINYINT DEFAULT 0 COMMENT '状态 0-成功 1-失败',
    error_msg VARCHAR(1000) COMMENT '错误信息',
    retry_count INT DEFAULT 0 COMMENT '重试次数',
    max_retry INT DEFAULT 3 COMMENT '最大重试次数',
    need_retry TINYINT DEFAULT 0 COMMENT '是否需要重试 0-否 1-是',
    cost_time INT COMMENT '耗时(ms)',
    user_id BIGINT COMMENT '用户ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status(status),
    INDEX idx_need_retry(need_retry),
    INDEX idx_create_time(create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='接口调用日志表';

-- 18. 场地利用统计表
CREATE TABLE court_usage_stats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stat_date DATE NOT NULL COMMENT '统计日期',
    court_id BIGINT NOT NULL COMMENT '场地ID',
    total_hours DECIMAL(5,1) DEFAULT 0 COMMENT '总开放小时数',
    booked_hours DECIMAL(5,1) DEFAULT 0 COMMENT '已预约小时数',
    usage_rate DECIMAL(5,2) DEFAULT 0 COMMENT '利用率%',
    booking_count INT DEFAULT 0 COMMENT '预约次数',
    total_revenue DECIMAL(10,2) DEFAULT 0 COMMENT '总收入',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_date_court(stat_date, court_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='场地利用统计表';

-- 初始化数据
-- 角色
INSERT INTO sys_role (role_name, role_code, description) VALUES
('超级管理员', 'admin', '系统超级管理员'),
('场馆经理', 'manager', '场馆经理'),
('前台人员', 'receptionist', '前台一线人员'),
('教练', 'coach', '羽毛球教练'),
('巡检员', 'inspector', '设备巡检员'),
('维修员', 'repairer', '设备维修员'),
('普通会员', 'member', '普通会员用户');

-- 管理员用户 (密码: admin123)
INSERT INTO sys_user (username, password, real_name, phone, status) VALUES
('admin', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '系统管理员', '13800000000', 1),
('manager', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '张经理', '13800000001', 1),
('receptionist', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '李前台', '13800000002', 1),
('coach01', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '王教练', '13800000003', 1),
('inspector01', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '赵巡检', '13800000004', 1),
('repairer01', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '钱维修', '13800000005', 1),
('member01', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '孙会员', '13800000006', 1);

-- 用户角色关联
INSERT INTO sys_user_role (user_id, role_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (7, 7);

-- 场地
INSERT INTO court (court_no, name, type, price_per_hour, status, description) VALUES
('C001', '1号场地', 'standard', 80.00, 1, '标准羽毛球场'),
('C002', '2号场地', 'standard', 80.00, 1, '标准羽毛球场'),
('C003', '3号场地', 'standard', 80.00, 1, '标准羽毛球场'),
('C004', '4号场地', 'standard', 80.00, 1, '标准羽毛球场'),
('C005', '5号场地', 'vip', 150.00, 1, 'VIP羽毛球场，配备休息区'),
('C006', '6号场地', 'vip', 150.00, 1, 'VIP羽毛球场，配备休息区');

-- 设备
INSERT INTO equipment (equip_no, name, category, location, status, description) VALUES
('E001', '羽毛球网柱', '场地设施', '1号场地', 1, '标准羽毛球网柱'),
('E002', '羽毛球网柱', '场地设施', '2号场地', 1, '标准羽毛球网柱'),
('E003', '羽毛球网柱', '场地设施', '3号场地', 2, '需要巡检'),
('E004', '羽毛球网柱', '场地设施', '4号场地', 1, '标准羽毛球网柱'),
('E005', '羽毛球网柱', '场地设施', '5号场地', 1, 'VIP羽毛球网柱'),
('E006', '羽毛球网柱', '场地设施', '6号场地', 3, '网柱松动'),
('E007', '休息长椅', '配套设施', '休息区A', 1, '塑料休息长椅'),
('E008', '休息长椅', '配套设施', '休息区B', 1, '塑料休息长椅'),
('E009', '更衣柜', '配套设施', '更衣室', 1, '钢制更衣柜'),
('E010', '空调系统', '场馆设施', '主馆', 1, '中央空调系统');

-- 教练
INSERT INTO coach (user_id, coach_no, name, level, specialty, hourly_rate, status, description) VALUES
(4, 'J001', '王教练', 'master', '单打/双打/青少年培训', 300.00, 1, '国家级运动员，10年教学经验');

-- 课程
INSERT INTO course (course_no, name, coach_id, court_id, course_type, max_students, duration, price, status, description) VALUES
('K001', '初级羽毛球班', 1, 1, 'group', 6, 90, 150.00, 1, '零基础入门课程'),
('K002', '一对一私教课', 1, 5, 'private', 1, 60, 300.00, 1, '一对一针对性训练');

-- 课程排班
INSERT INTO course_schedule (course_id, coach_id, court_id, schedule_date, start_time, end_time, max_students, enrolled_count, status) VALUES
(1, 1, 1, CURDATE() + INTERVAL 1 DAY, '19:00:00', '20:30:00', 6, 0, 1),
(2, 1, 5, CURDATE() + INTERVAL 1 DAY, '10:00:00', '11:00:00', 1, 0, 1),
(1, 1, 1, CURDATE() + INTERVAL 3 DAY, '19:00:00', '20:30:00', 6, 0, 1);
