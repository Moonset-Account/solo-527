-- 装修线索报价协同系统数据库初始化脚本
CREATE DATABASE IF NOT EXISTS decoration_coop DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE decoration_coop;

-- 用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    avatar VARCHAR(255) COMMENT '头像',
    dept_id BIGINT COMMENT '部门ID',
    status TINYINT DEFAULT 1 COMMENT '状态 0-禁用 1-启用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by BIGINT,
    update_by BIGINT,
    deleted TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 角色表
CREATE TABLE IF NOT EXISTS sys_role (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_code VARCHAR(50) NOT NULL UNIQUE COMMENT '角色编码',
    role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
    description VARCHAR(200) COMMENT '描述',
    status TINYINT DEFAULT 1 COMMENT '状态 0-禁用 1-启用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by BIGINT,
    update_by BIGINT,
    deleted TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS sys_user_role (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    UNIQUE KEY uk_user_role (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- 权限表
CREATE TABLE IF NOT EXISTS sys_permission (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    permission_code VARCHAR(100) NOT NULL UNIQUE COMMENT '权限编码',
    permission_name VARCHAR(100) NOT NULL COMMENT '权限名称',
    parent_id BIGINT DEFAULT 0 COMMENT '父ID',
    type TINYINT COMMENT '类型 1-菜单 2-按钮',
    path VARCHAR(200) COMMENT '路由路径',
    icon VARCHAR(100) COMMENT '图标',
    sort_order INT DEFAULT 0 COMMENT '排序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS sys_role_permission (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id BIGINT NOT NULL COMMENT '角色ID',
    permission_id BIGINT NOT NULL COMMENT '权限ID',
    UNIQUE KEY uk_role_permission (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

-- 部门表
CREATE TABLE IF NOT EXISTS sys_dept (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    dept_name VARCHAR(50) NOT NULL COMMENT '部门名称',
    parent_id BIGINT DEFAULT 0 COMMENT '父部门ID',
    leader VARCHAR(50) COMMENT '负责人',
    phone VARCHAR(20) COMMENT '联系电话',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表';

-- 客户表
CREATE TABLE IF NOT EXISTS biz_customer (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(50) NOT NULL COMMENT '客户姓名',
    phone VARCHAR(20) NOT NULL COMMENT '联系电话',
    wechat VARCHAR(50) COMMENT '微信号',
    address VARCHAR(500) COMMENT '联系地址',
    gender TINYINT COMMENT '性别 1-男 2-女',
    age INT COMMENT '年龄',
    occupation VARCHAR(50) COMMENT '职业',
    remark TEXT COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by BIGINT,
    update_by BIGINT,
    deleted TINYINT DEFAULT 0,
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户表';

-- 线索表
CREATE TABLE IF NOT EXISTS biz_lead (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    lead_no VARCHAR(32) NOT NULL UNIQUE COMMENT '线索编号',
    customer_id BIGINT NOT NULL COMMENT '客户ID',
    source VARCHAR(50) COMMENT '线索来源: NETWORK,REFERRAL,WALKIN,EXHIBITION,OLD_CUSTOMER',
    source_detail VARCHAR(200) COMMENT '来源详情',
    project_name VARCHAR(200) COMMENT '项目名称',
    decoration_type VARCHAR(50) COMMENT '装修类型: HOME,OFFICE,SHOP,HOTEL,OTHER',
    house_area DECIMAL(10,2) COMMENT '房屋面积(㎡)',
    budget_min DECIMAL(15,2) COMMENT '预算下限',
    budget_max DECIMAL(15,2) COMMENT '预算上限',
    city VARCHAR(50) COMMENT '城市',
    district VARCHAR(50) COMMENT '区域',
    community VARCHAR(100) COMMENT '小区',
    expect_start_date DATE COMMENT '期望开工日期',
    owner_id BIGINT NOT NULL COMMENT '负责人ID',
    status VARCHAR(30) NOT NULL DEFAULT 'NEW' COMMENT '线索状态: NEW,FOLLOWING,MEASURED,QUOTED,NEGOTIATING,CONTRACT,SIGNED,DEAL,CLOSED,LOST',
    follow_stage VARCHAR(30) COMMENT '跟进阶段: INITIAL_CONTACT,NEED_CONFIRM,MEASURE_ARRANGED,QUOTATION,NEGOTIATION,CONTRACT_READY',
    importance TINYINT DEFAULT 2 COMMENT '重要程度 1-高 2-中 3-低',
    conflict_flag TINYINT DEFAULT 0 COMMENT '是否撞单 0-否 1-是',
    conflict_with_ids VARCHAR(500) COMMENT '撞单线索ID列表(逗号分隔)',
    predict_deal_date DATE COMMENT '预测成交日期',
    predict_deal_rate INT DEFAULT 0 COMMENT '预测成交率(0-100)',
    remark TEXT COMMENT '备注',
    assign_time DATETIME COMMENT '分配时间',
    last_follow_time DATETIME COMMENT '最后跟进时间',
    next_follow_time DATETIME COMMENT '下次跟进时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by BIGINT,
    update_by BIGINT,
    deleted TINYINT DEFAULT 0,
    INDEX idx_customer (customer_id),
    INDEX idx_owner (owner_id),
    INDEX idx_status (status),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='线索表';

-- 装修需求表
CREATE TABLE IF NOT EXISTS biz_decoration_requirement (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    lead_id BIGINT NOT NULL COMMENT '线索ID',
    house_type VARCHAR(50) COMMENT '房屋类型: APARTMENT,VILLA,LOFT,OFFICE,SHOP',
    house_structure VARCHAR(50) COMMENT '户型结构: 一室一厅,两室一厅等',
    total_area DECIMAL(10,2) COMMENT '总面积(㎡)',
    usable_area DECIMAL(10,2) COMMENT '使用面积(㎡)',
    floor VARCHAR(20) COMMENT '楼层',
    total_floors INT COMMENT '总楼层',
    orientation VARCHAR(30) COMMENT '朝向',
    decoration_style VARCHAR(50) COMMENT '装修风格: MODERN,EUROPEAN,CHINESE,MINIMALIST,LUXURY,INDUSTRIAL',
    decoration_level VARCHAR(30) COMMENT '装修档次: SIMPLE,STANDARD,HIGH-END,LUXURY',
    decoration_usage VARCHAR(50) COMMENT '装修用途: SELF_LIVE,RENT,INVEST,OFFICE,SHOP',
    style_description TEXT COMMENT '风格偏好描述',
    functional_requirements TEXT COMMENT '功能需求',
    material_preferences TEXT COMMENT '材料偏好',
    color_preferences VARCHAR(200) COMMENT '颜色偏好',
    has_elder TINYINT DEFAULT 0 COMMENT '是否有老人',
    has_child TINYINT DEFAULT 0 COMMENT '是否有小孩',
    has_pet TINYINT DEFAULT 0 COMMENT '是否有宠物',
    special_requirements TEXT COMMENT '特殊需求',
    remark TEXT COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by BIGINT,
    update_by BIGINT,
    deleted TINYINT DEFAULT 0,
    UNIQUE KEY uk_lead_id (lead_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='装修需求表';

-- 量房信息表
CREATE TABLE IF NOT EXISTS biz_house_measure (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    lead_id BIGINT NOT NULL COMMENT '线索ID',
    measure_user_id BIGINT COMMENT '量房人ID',
    measure_date DATE COMMENT '量房日期',
    actual_house_type VARCHAR(50) COMMENT '实际房型',
    actual_total_area DECIMAL(10,2) COMMENT '实际总面积(㎡)',
    measure_data TEXT COMMENT '量房数据(JSON)',
    room_measurements TEXT COMMENT '各房间尺寸(JSON)',
    wall_condition VARCHAR(200) COMMENT '墙面情况',
    floor_condition VARCHAR(200) COMMENT '地面情况',
    ceiling_condition VARCHAR(200) COMMENT '顶面情况',
    water_electric_position TEXT COMMENT '水电点位情况',
    pipeline_condition VARCHAR(200) COMMENT '管道情况',
    load_bearing_walls TEXT COMMENT '承重墙情况',
    difficulty_points TEXT COMMENT '施工难点',
    suggestion TEXT COMMENT '量房建议',
    remark TEXT COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by BIGINT,
    update_by BIGINT,
    deleted TINYINT DEFAULT 0,
    UNIQUE KEY uk_lead_id (lead_id),
    INDEX idx_measure_user (measure_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='量房信息表';

-- 合同表
CREATE TABLE IF NOT EXISTS biz_contract (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    contract_no VARCHAR(32) NOT NULL UNIQUE COMMENT '合同编号',
    lead_id BIGINT NOT NULL COMMENT '线索ID',
    customer_id BIGINT NOT NULL COMMENT '客户ID',
    contract_name VARCHAR(200) NOT NULL COMMENT '合同名称',
    contract_type VARCHAR(30) COMMENT '合同类型: QUOTATION,FORMAL,SUPPLEMENT',
    original_price DECIMAL(15,2) COMMENT '原价',
    discount_rate DECIMAL(5,2) COMMENT '折扣率(%)',
    discount_amount DECIMAL(15,2) COMMENT '优惠金额',
    final_price DECIMAL(15,2) COMMENT '合同金额',
    payment_terms TEXT COMMENT '付款条款',
    project_cycle INT COMMENT '工期(天)',
    start_date DATE COMMENT '开工日期',
    end_date DATE COMMENT '竣工日期',
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' COMMENT '合同状态: DRAFT,DISCOUNT_PENDING,APPROVING,APPROVED,SIGNED,EFFECTIVE,COMPLETED,TERMINATED',
    sign_date DATE COMMENT '签约日期',
    effective_date DATE COMMENT '生效日期',
    owner_id BIGINT COMMENT '负责人ID',
    approver_id BIGINT COMMENT '审批人ID',
    approval_remark TEXT COMMENT '审批意见',
    approval_time DATETIME COMMENT '审批时间',
    remark TEXT COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by BIGINT,
    update_by BIGINT,
    deleted TINYINT DEFAULT 0,
    INDEX idx_lead (lead_id),
    INDEX idx_customer (customer_id),
    INDEX idx_status (status),
    INDEX idx_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同表';

-- 折扣审批表
CREATE TABLE IF NOT EXISTS biz_discount_approval (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    approval_no VARCHAR(32) NOT NULL UNIQUE COMMENT '审批编号',
    contract_id BIGINT NOT NULL COMMENT '合同ID',
    lead_id BIGINT NOT NULL COMMENT '线索ID',
    applicant_id BIGINT NOT NULL COMMENT '申请人ID',
    original_price DECIMAL(15,2) NOT NULL COMMENT '原价',
    request_discount_rate DECIMAL(5,2) NOT NULL COMMENT '申请折扣率(%)',
    request_discount_amount DECIMAL(15,2) COMMENT '申请优惠金额',
    request_final_price DECIMAL(15,2) COMMENT '申请成交价',
    reason TEXT COMMENT '申请原因',
    current_approver_id BIGINT COMMENT '当前审批人ID',
    approval_level INT DEFAULT 1 COMMENT '审批层级',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT '审批状态: PENDING,APPROVING,APPROVED,REJECTED,CANCELLED',
    approve_time DATETIME COMMENT '最终审批时间',
    submit_time DATETIME COMMENT '提交时间',
    remark TEXT COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by BIGINT,
    update_by BIGINT,
    deleted TINYINT DEFAULT 0,
    INDEX idx_contract (contract_id),
    INDEX idx_lead (lead_id),
    INDEX idx_status (status),
    INDEX idx_applicant (applicant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='折扣审批表';

-- 审批记录表
CREATE TABLE IF NOT EXISTS biz_approval_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    approval_id BIGINT NOT NULL COMMENT '审批ID',
    approval_type VARCHAR(30) NOT NULL COMMENT '审批类型: DISCOUNT,CONTRACT',
    approver_id BIGINT NOT NULL COMMENT '审批人ID',
    approver_name VARCHAR(50) COMMENT '审批人姓名',
    approval_action VARCHAR(30) NOT NULL COMMENT '审批动作: SUBMIT,APPROVE,REJECT,TRANSFER,WITHDRAW',
    approval_level INT COMMENT '审批层级',
    opinion TEXT COMMENT '审批意见',
    process_duration BIGINT COMMENT '处理耗时(毫秒)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '处理时间',
    INDEX idx_approval (approval_id, approval_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审批记录表';

-- 跟进记录表
CREATE TABLE IF NOT EXISTS biz_follow_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    lead_id BIGINT NOT NULL COMMENT '线索ID',
    contract_id BIGINT COMMENT '合同ID',
    follower_id BIGINT NOT NULL COMMENT '跟进人ID',
    follower_name VARCHAR(50) COMMENT '跟进人姓名',
    follow_type VARCHAR(30) COMMENT '跟进类型: PHONE,VISIT,WECHAT,MEETING,OTHER',
    follow_stage VARCHAR(30) COMMENT '跟进阶段',
    source_reference VARCHAR(50) COMMENT '关联线索来源标记',
    contract_reference VARCHAR(50) COMMENT '关联合同附件标记',
    content TEXT NOT NULL COMMENT '跟进内容',
    next_follow_time DATETIME COMMENT '下次跟进时间',
    process_duration BIGINT COMMENT '处理耗时(毫秒)',
    attachment_ids VARCHAR(500) COMMENT '附件ID列表(逗号分隔)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by BIGINT,
    update_by BIGINT,
    deleted TINYINT DEFAULT 0,
    INDEX idx_lead (lead_id),
    INDEX idx_follower (follower_id),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='跟进记录表';

-- 附件表
CREATE TABLE IF NOT EXISTS biz_attachment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    biz_type VARCHAR(30) NOT NULL COMMENT '业务类型: CONTRACT,FOLLOW,MEASURE,LEAD',
    biz_id BIGINT NOT NULL COMMENT '业务ID',
    file_name VARCHAR(255) NOT NULL COMMENT '文件名称',
    file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
    file_size BIGINT COMMENT '文件大小(字节)',
    file_type VARCHAR(50) COMMENT '文件类型',
    uploader_id BIGINT COMMENT '上传人ID',
    uploader_name VARCHAR(50) COMMENT '上传人姓名',
    remark VARCHAR(200) COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    INDEX idx_biz (biz_type, biz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='附件表';

-- 待办任务表
CREATE TABLE IF NOT EXISTS biz_todo_task (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_no VARCHAR(32) NOT NULL UNIQUE COMMENT '任务编号',
    task_type VARCHAR(30) NOT NULL COMMENT '任务类型: FOLLOW,MEASURE,APPROVAL,CONTRACT,PAYMENT',
    biz_id BIGINT COMMENT '关联业务ID',
    biz_type VARCHAR(30) COMMENT '关联业务类型',
    title VARCHAR(200) NOT NULL COMMENT '任务标题',
    content TEXT COMMENT '任务内容',
    assignee_id BIGINT NOT NULL COMMENT '处理人ID',
    assigner_id BIGINT COMMENT '指派人人ID',
    priority TINYINT DEFAULT 2 COMMENT '优先级 1-高 2-中 3-低',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT '状态: PENDING,PROCESSING,COMPLETED,CANCELLED,OVERDUE',
    due_time DATETIME COMMENT '截止时间',
    start_time DATETIME COMMENT '开始时间',
    complete_time DATETIME COMMENT '完成时间',
    process_duration BIGINT COMMENT '处理耗时(毫秒)',
    contract_reference VARCHAR(50) COMMENT '关联合同标记',
    stage_reference VARCHAR(50) COMMENT '关联跟进阶段标记',
    source_reference VARCHAR(50) COMMENT '关联线索来源标记',
    remark TEXT COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by BIGINT,
    update_by BIGINT,
    deleted TINYINT DEFAULT 0,
    INDEX idx_assignee (assignee_id),
    INDEX idx_status (status),
    INDEX idx_due_time (due_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='待办任务表';

-- 回款计划表
CREATE TABLE IF NOT EXISTS biz_payment_plan (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    contract_id BIGINT NOT NULL COMMENT '合同ID',
    lead_id BIGINT NOT NULL COMMENT '线索ID',
    period_no INT NOT NULL COMMENT '期数',
    period_name VARCHAR(50) COMMENT '期次名称',
    payment_ratio DECIMAL(5,2) COMMENT '回款比例(%)',
    plan_amount DECIMAL(15,2) NOT NULL COMMENT '计划回款金额',
    actual_amount DECIMAL(15,2) DEFAULT 0 COMMENT '实际回款金额',
    plan_date DATE COMMENT '计划回款日期',
    actual_date DATE COMMENT '实际回款日期',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT '状态: PENDING,PARTIAL,PAID,OVERDUE',
    collector_id BIGINT COMMENT '收款人ID',
    remark TEXT COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by BIGINT,
    update_by BIGINT,
    deleted TINYINT DEFAULT 0,
    INDEX idx_contract (contract_id),
    INDEX idx_status (status),
    INDEX idx_plan_date (plan_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='回款计划表';

-- 回款记录表
CREATE TABLE IF NOT EXISTS biz_payment_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    payment_plan_id BIGINT NOT NULL COMMENT '回款计划ID',
    contract_id BIGINT NOT NULL COMMENT '合同ID',
    amount DECIMAL(15,2) NOT NULL COMMENT '回款金额',
    payment_method VARCHAR(30) COMMENT '回款方式: CASH,BANK,TRANSFER,WECHAT,ALIPAY',
    payment_date DATE NOT NULL COMMENT '回款日期',
    payer VARCHAR(100) COMMENT '付款人',
    collector_id BIGINT COMMENT '收款人ID',
    collector_name VARCHAR(50) COMMENT '收款人姓名',
    voucher_no VARCHAR(100) COMMENT '凭证号',
    remark TEXT COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    create_by BIGINT,
    deleted TINYINT DEFAULT 0,
    INDEX idx_plan (payment_plan_id),
    INDEX idx_contract (contract_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='回款记录表';

-- 撞单记录表
CREATE TABLE IF NOT EXISTS biz_conflict_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    lead_id_1 BIGINT NOT NULL COMMENT '线索1 ID',
    lead_id_2 BIGINT NOT NULL COMMENT '线索2 ID',
    conflict_type VARCHAR(30) COMMENT '撞单类型: SAME_PHONE,SAME_CUSTOMER,SAME_COMMUNITY,SAME_ADDRESS',
    detect_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '检测时间',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT '状态: PENDING,RESOLVED,IGNORED',
    resolved_by BIGINT COMMENT '处理人ID',
    resolved_time DATETIME COMMENT '处理时间',
    resolution VARCHAR(200) COMMENT '处理结果',
    process_duration BIGINT COMMENT '处理耗时(毫秒)',
    remark TEXT COMMENT '备注',
    INDEX idx_lead1 (lead_id_1),
    INDEX idx_lead2 (lead_id_2),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='撞单记录表';

-- 操作日志表（时间轴）
CREATE TABLE IF NOT EXISTS biz_operation_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    biz_type VARCHAR(30) NOT NULL COMMENT '业务类型',
    biz_id BIGINT NOT NULL COMMENT '业务ID',
    operation_type VARCHAR(50) NOT NULL COMMENT '操作类型',
    operation_content TEXT COMMENT '操作内容',
    operator_id BIGINT COMMENT '操作人ID',
    operator_name VARCHAR(50) COMMENT '操作人姓名',
    before_data TEXT COMMENT '变更前数据',
    after_data TEXT COMMENT '变更后数据',
    process_duration BIGINT COMMENT '处理耗时(毫秒)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_biz (biz_type, biz_id),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 初始化数据
INSERT INTO sys_dept (id, dept_name, parent_id, leader, phone, sort_order) VALUES
(1, '总公司', 0, '张总', '13800000001', 1),
(2, '销售部', 1, '李经理', '13800000002', 1),
(3, '设计部', 1, '王设计', '13800000003', 2),
(4, '工程部', 1, '赵工头', '13800000004', 3),
(5, '财务部', 1, '孙财务', '13800000005', 4);

INSERT INTO sys_role (id, role_code, role_name, description) VALUES
(1, 'ADMIN', '系统管理员', '拥有全部权限'),
(2, 'SALES_MANAGER', '销售经理', '销售管理、折扣审批'),
(3, 'SALES', '销售人员', '线索跟进、合同创建'),
(4, 'DESIGNER', '设计师', '量房、装修设计'),
(5, 'FINANCE', '财务人员', '回款管理、报表查看'),
(6, 'GENERAL_MANAGER', '总经理', '高层审批、数据看板');

INSERT INTO sys_user (id, username, password, real_name, phone, email, dept_id, status) VALUES
(1, 'admin', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '系统管理员', '13800000000', 'admin@decoration.com', 1, 1),
(2, 'manager', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '李经理', '13800000002', 'manager@decoration.com', 2, 1),
(3, 'sales01', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '销售员A', '13800000010', 'sales01@decoration.com', 2, 1),
(4, 'sales02', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '销售员B', '13800000011', 'sales02@decoration.com', 2, 1),
(5, 'designer01', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '设计师A', '13800000020', 'designer01@decoration.com', 3, 1),
(6, 'finance01', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '财务A', '13800000030', 'finance01@decoration.com', 5, 1),
(7, 'gm01', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '总经理', '13800000099', 'gm@decoration.com', 1, 1);

INSERT INTO sys_user_role (user_id, role_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 3), (5, 4), (6, 5), (7, 6);

INSERT INTO sys_permission (id, permission_code, permission_name, parent_id, type, path, icon, sort_order) VALUES
(1, 'dashboard', '工作台', 0, 1, '/dashboard', 'dashboard', 1),
(2, 'lead', '线索管理', 0, 1, '/lead', 'user', 2),
(3, 'lead:list', '线索列表', 2, 2, '/lead/list', '', 1),
(4, 'lead:create', '新建线索', 2, 2, '', '', 2),
(5, 'lead:edit', '编辑线索', 2, 2, '', '', 3),
(6, 'lead:view', '查看线索详情', 2, 2, '', '', 4),
(7, 'lead:assign', '分配线索', 2, 2, '', '', 5),
(8, 'contract', '合同管理', 0, 1, '/contract', 'document', 3),
(9, 'contract:list', '合同列表', 8, 2, '/contract/list', '', 1),
(10, 'contract:create', '创建合同', 8, 2, '', '', 2),
(11, 'contract:edit', '编辑合同', 8, 2, '', '', 3),
(12, 'contract:view', '查看合同详情', 8, 2, '', '', 4),
(13, 'approval', '审批中心', 0, 1, '/approval', 'check', 4),
(14, 'approval:discount', '折扣审批', 13, 2, '/approval/discount', '', 1),
(15, 'approval:contract', '合同审批', 13, 2, '/approval/contract', '', 2),
(16, 'approval:approve', '审批操作', 13, 2, '', '', 3),
(17, 'todo', '待办任务', 0, 1, '/todo', 'bell', 5),
(18, 'todo:my', '我的待办', 17, 2, '/todo/my', '', 1),
(19, 'todo:create', '新建待办', 17, 2, '', '', 2),
(20, 'todo:edit', '编辑待办', 17, 2, '', '', 3),
(21, 'report', '报表中心', 0, 1, '/report', 'data-analysis', 6),
(22, 'report:payment', '回款进度', 21, 2, '/report/payment', '', 1),
(23, 'report:prediction', '成交预测', 21, 2, '/report/prediction', '', 2),
(24, 'report:view', '查看报表', 21, 2, '', '', 3),
(25, 'system', '系统管理', 0, 1, '/system', 'setting', 99),
(26, 'system:user', '用户管理', 25, 2, '/system/user', '', 1),
(27, 'system:role', '角色管理', 25, 2, '/system/role', '', 2);

INSERT INTO sys_role_permission (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11), (1, 12), (1, 13), (1, 14), (1, 15), (1, 16), (1, 17), (1, 18), (1, 19), (1, 20), (1, 21), (1, 22), (1, 23), (1, 24), (1, 25), (1, 26), (1, 27),
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8), (2, 9), (2, 10), (2, 11), (2, 12), (2, 13), (2, 14), (2, 16), (2, 17), (2, 18), (2, 19), (2, 20), (2, 21), (2, 22), (2, 23), (2, 24),
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 8), (3, 9), (3, 10), (3, 11), (3, 12), (3, 17), (3, 18), (3, 19), (3, 20),
(4, 1), (4, 2), (4, 3), (4, 6), (4, 17), (4, 18), (4, 19), (4, 20),
(5, 1), (5, 8), (5, 9), (5, 12), (5, 21), (5, 22), (5, 24),
(6, 1), (6, 2), (6, 3), (6, 6), (6, 8), (6, 9), (6, 12), (6, 13), (6, 14), (6, 15), (6, 16), (6, 21), (6, 22), (6, 23), (6, 24);
