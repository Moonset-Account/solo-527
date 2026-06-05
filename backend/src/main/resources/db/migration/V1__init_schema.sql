-- ========================================
-- 物业报修和巡检系统数据库初始化脚本
-- ========================================

-- 1. 用户表（系统用户，包含所有角色）
CREATE TABLE sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码（加密）',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    role VARCHAR(20) NOT NULL COMMENT '角色：ADMIN-物业主管, PROPERTY-物业人员, MAINTENANCE-维修人员, INSPECTOR-巡检人员, OWNER-业主',
    avatar VARCHAR(255) COMMENT '头像URL',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- 2. 业主信息表
CREATE TABLE owner (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '业主ID',
    user_id BIGINT NOT NULL COMMENT '关联系统用户ID',
    id_card VARCHAR(18) COMMENT '身份证号',
    contact_address VARCHAR(255) COMMENT '联系地址',
    emergency_contact VARCHAR(50) COMMENT '紧急联系人',
    emergency_phone VARCHAR(20) COMMENT '紧急联系电话',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES sys_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='业主信息表';

-- 3. 楼栋单元表
CREATE TABLE building (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '楼栋ID',
    building_no VARCHAR(20) NOT NULL COMMENT '楼栋号',
    building_name VARCHAR(50) COMMENT '楼栋名称',
    total_floors INT COMMENT '总楼层数',
    description VARCHAR(255) COMMENT '描述',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_building_no (building_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='楼栋表';

-- 4. 房间号表
CREATE TABLE room (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '房间ID',
    building_id BIGINT NOT NULL COMMENT '楼栋ID',
    room_no VARCHAR(20) NOT NULL COMMENT '房间号',
    floor INT NOT NULL COMMENT '楼层',
    area DECIMAL(10,2) COMMENT '面积（平方米）',
    room_type VARCHAR(20) COMMENT '户型：一室一厅、两室一厅等',
    owner_id BIGINT COMMENT '业主ID',
    status VARCHAR(20) DEFAULT 'EMPTY' COMMENT '状态：EMPTY-空置，OCCUPIED-已入住',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_building_room (building_id, room_no),
    INDEX idx_owner_id (owner_id),
    FOREIGN KEY (building_id) REFERENCES building(id),
    FOREIGN KEY (owner_id) REFERENCES owner(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='房间表';

-- 5. 报修工单表
CREATE TABLE work_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '工单ID',
    order_no VARCHAR(32) NOT NULL UNIQUE COMMENT '工单编号',
    title VARCHAR(100) NOT NULL COMMENT '工单标题',
    description TEXT COMMENT '问题描述',
    category VARCHAR(50) NOT NULL COMMENT '工单分类：水电维修、家电维修、门窗维修、墙面地面、公共设施、其他',
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' COMMENT '优先级：LOW-低，NORMAL-普通，HIGH-高，URGENT-紧急',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '状态：PENDING-待审核，APPROVED-已审核派单，PROCESSING-处理中，COMPLETED-待验收，CLOSED-已关闭，REJECTED-已驳回',
    owner_id BIGINT NOT NULL COMMENT '报修业主ID',
    room_id BIGINT NOT NULL COMMENT '报修房间ID',
    report_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '报修时间',
    contact_person VARCHAR(50) COMMENT '联系人',
    contact_phone VARCHAR(20) COMMENT '联系电话',
    appoint_time DATETIME COMMENT '预约上门时间',
    assignee_id BIGINT COMMENT '指派维修人员ID',
    assign_time DATETIME COMMENT '派单时间',
    start_process_time DATETIME COMMENT '开始处理时间',
    complete_time DATETIME COMMENT '处理完成时间',
    close_time DATETIME COMMENT '关闭时间',
    expected_cost DECIMAL(10,2) DEFAULT 0 COMMENT '预估费用',
    actual_cost DECIMAL(10,2) DEFAULT 0 COMMENT '实际费用',
    is_paid TINYINT DEFAULT 0 COMMENT '是否已缴费：0-未缴费，1-已缴费',
    pay_time DATETIME COMMENT '缴费时间',
    reject_reason VARCHAR(255) COMMENT '驳回原因',
    handler_remark TEXT COMMENT '处理备注',
    has_photo TINYINT DEFAULT 0 COMMENT '是否有处理照片：0-无，1-有',
    created_by BIGINT COMMENT '创建人',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by BIGINT COMMENT '更新人',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_order_no (order_no),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_owner_id (owner_id),
    INDEX idx_room_id (room_id),
    INDEX idx_assignee_id (assignee_id),
    INDEX idx_report_time (report_time),
    FOREIGN KEY (owner_id) REFERENCES owner(id),
    FOREIGN KEY (room_id) REFERENCES room(id),
    FOREIGN KEY (assignee_id) REFERENCES sys_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报修工单表';

-- 6. 工单状态历史追踪表
CREATE TABLE work_order_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '历史记录ID',
    work_order_id BIGINT NOT NULL COMMENT '工单ID',
    operation VARCHAR(50) NOT NULL COMMENT '操作类型：CREATE-创建，APPROVE-审核通过，REJECT-驳回，ASSIGN-派单，START_PROCESS-开始处理，COMPLETE-完成处理，CLOSE-关闭，REOPEN-重新打开',
    old_status VARCHAR(20) COMMENT '原状态',
    new_status VARCHAR(20) NOT NULL COMMENT '新状态',
    operator_id BIGINT NOT NULL COMMENT '操作人ID',
    operator_name VARCHAR(50) NOT NULL COMMENT '操作人姓名',
    remark TEXT COMMENT '操作备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    INDEX idx_work_order_id (work_order_id),
    INDEX idx_operator_id (operator_id),
    FOREIGN KEY (work_order_id) REFERENCES work_order(id),
    FOREIGN KEY (operator_id) REFERENCES sys_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单状态历史表';

-- 7. 维修材料表
CREATE TABLE material (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '材料ID',
    material_code VARCHAR(50) NOT NULL UNIQUE COMMENT '材料编码',
    material_name VARCHAR(100) NOT NULL COMMENT '材料名称',
    category VARCHAR(50) COMMENT '材料分类',
    specification VARCHAR(100) COMMENT '规格型号',
    unit VARCHAR(20) COMMENT '单位',
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '单价',
    stock_quantity INT DEFAULT 0 COMMENT '库存数量',
    description VARCHAR(255) COMMENT '描述',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_material_code (material_code),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修材料表';

-- 8. 工单使用材料明细表
CREATE TABLE work_order_material (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '明细ID',
    work_order_id BIGINT NOT NULL COMMENT '工单ID',
    material_id BIGINT NOT NULL COMMENT '材料ID',
    material_name VARCHAR(100) COMMENT '材料名称（冗余）',
    specification VARCHAR(100) COMMENT '规格型号（冗余）',
    unit VARCHAR(20) COMMENT '单位（冗余）',
    quantity INT NOT NULL COMMENT '使用数量',
    unit_price DECIMAL(10,2) NOT NULL COMMENT '单价',
    total_price DECIMAL(10,2) NOT NULL COMMENT '总价',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_work_order_id (work_order_id),
    INDEX idx_material_id (material_id),
    FOREIGN KEY (work_order_id) REFERENCES work_order(id),
    FOREIGN KEY (material_id) REFERENCES material(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单材料明细表';

-- 9. 满意度评价表
CREATE TABLE satisfaction (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '评价ID',
    work_order_id BIGINT NOT NULL UNIQUE COMMENT '工单ID',
    owner_id BIGINT NOT NULL COMMENT '评价业主ID',
    overall_score INT NOT NULL COMMENT '总体评分：1-5分',
    response_speed_score INT COMMENT '响应速度评分',
    service_attitude_score INT COMMENT '服务态度评分',
    quality_score INT COMMENT '维修质量评分',
    content TEXT COMMENT '评价内容',
    is_solved TINYINT DEFAULT 1 COMMENT '问题是否解决：0-未解决，1-已解决',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '评价时间',
    INDEX idx_work_order_id (work_order_id),
    INDEX idx_owner_id (owner_id),
    INDEX idx_overall_score (overall_score),
    FOREIGN KEY (work_order_id) REFERENCES work_order(id),
    FOREIGN KEY (owner_id) REFERENCES owner(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='满意度评价表';

-- 10. 巡检点表
CREATE TABLE inspection_point (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '巡检点ID',
    point_code VARCHAR(50) NOT NULL UNIQUE COMMENT '巡检点编号',
    point_name VARCHAR(100) NOT NULL COMMENT '巡检点名称',
    location VARCHAR(255) NOT NULL COMMENT '位置描述',
    category VARCHAR(50) COMMENT '分类：消防设施、电梯、水电、公共区域、安防设施',
    check_items TEXT COMMENT '检查项目（JSON格式）',
    qr_code VARCHAR(255) COMMENT '二维码内容',
    status TINYINT DEFAULT 1 COMMENT '状态：0-停用，1-启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_point_code (point_code),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='巡检点表';

-- 11. 巡检记录表
CREATE TABLE inspection_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    record_no VARCHAR(32) NOT NULL UNIQUE COMMENT '记录编号',
    point_id BIGINT NOT NULL COMMENT '巡检点ID',
    inspector_id BIGINT NOT NULL COMMENT '巡检人员ID',
    check_time DATETIME NOT NULL COMMENT '巡检时间',
    status VARCHAR(20) NOT NULL DEFAULT 'NORMAL' COMMENT '状态：NORMAL-正常，ABNORMAL-异常',
    abnormal_description TEXT COMMENT '异常描述',
    is_handled TINYINT DEFAULT 0 COMMENT '是否已处理：0-未处理，1-已处理',
    handle_remark TEXT COMMENT '处理备注',
    related_order_id BIGINT COMMENT '关联工单ID',
    location_lng DECIMAL(10,7) COMMENT '经度',
    location_lat DECIMAL(10,7) COMMENT '纬度',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_record_no (record_no),
    INDEX idx_point_id (point_id),
    INDEX idx_inspector_id (inspector_id),
    INDEX idx_check_time (check_time),
    INDEX idx_status (status),
    FOREIGN KEY (point_id) REFERENCES inspection_point(id),
    FOREIGN KEY (inspector_id) REFERENCES sys_user(id),
    FOREIGN KEY (related_order_id) REFERENCES work_order(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='巡检记录表';

-- 12. 站内消息表
CREATE TABLE sys_message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '消息ID',
    receiver_id BIGINT NOT NULL COMMENT '接收人ID',
    sender_id BIGINT COMMENT '发送人ID',
    message_type VARCHAR(50) NOT NULL COMMENT '消息类型：ORDER_NEW-新工单，ORDER_ASSIGN-工单派单，ORDER_COMPLETE-工单完成，URGENT_REMIND-紧急提醒，SYSTEM_NOTICE-系统通知',
    title VARCHAR(100) NOT NULL COMMENT '消息标题',
    content TEXT COMMENT '消息内容',
    related_type VARCHAR(20) COMMENT '关联类型：WORK_ORDER-工单，INSPECTION-巡检',
    related_id BIGINT COMMENT '关联ID',
    is_read TINYINT DEFAULT 0 COMMENT '是否已读：0-未读，1-已读',
    read_time DATETIME COMMENT '阅读时间',
    priority VARCHAR(20) DEFAULT 'NORMAL' COMMENT '优先级：LOW-低，NORMAL-普通，HIGH-高，URGENT-紧急',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_receiver_id (receiver_id),
    INDEX idx_is_read (is_read),
    INDEX idx_message_type (message_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (receiver_id) REFERENCES sys_user(id),
    FOREIGN KEY (sender_id) REFERENCES sys_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站内消息表';

-- 13. 附件表
CREATE TABLE attachment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '附件ID',
    biz_type VARCHAR(50) NOT NULL COMMENT '业务类型：WORK_ORDER-工单，INSPECTION-巡检，AVATAR-头像',
    biz_id BIGINT NOT NULL COMMENT '业务ID',
    file_name VARCHAR(255) NOT NULL COMMENT '文件名',
    original_name VARCHAR(255) COMMENT '原始文件名',
    file_path VARCHAR(500) NOT NULL COMMENT '文件存储路径',
    file_url VARCHAR(500) COMMENT '访问URL',
    file_size BIGINT COMMENT '文件大小（字节）',
    file_type VARCHAR(50) COMMENT '文件类型：image-图片，video-视频，doc-文档，other-其他',
    mime_type VARCHAR(100) COMMENT 'MIME类型',
    uploader_id BIGINT NOT NULL COMMENT '上传人ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_biz (biz_type, biz_id),
    INDEX idx_uploader_id (uploader_id),
    FOREIGN KEY (uploader_id) REFERENCES sys_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='附件表';

-- 14. 费用登记表
CREATE TABLE expense_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '费用ID',
    expense_no VARCHAR(32) NOT NULL UNIQUE COMMENT '费用编号',
    work_order_id BIGINT COMMENT '关联工单ID',
    expense_type VARCHAR(50) NOT NULL COMMENT '费用类型：MATERIAL-材料费，LABOR-人工费，OTHER-其他',
    amount DECIMAL(10,2) NOT NULL COMMENT '金额',
    description VARCHAR(255) COMMENT '费用描述',
    payer_id BIGINT COMMENT '缴费人ID（业主）',
    pay_status VARCHAR(20) DEFAULT 'UNPAID' COMMENT '缴费状态：UNPAID-未缴费，PAID-已缴费',
    pay_time DATETIME COMMENT '缴费时间',
    pay_method VARCHAR(20) COMMENT '缴费方式：CASH-现金，WECHAT-微信，ALIPAY-支付宝，BANK-银行转账',
    operator_id BIGINT COMMENT '操作人ID',
    remark TEXT COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_expense_no (expense_no),
    INDEX idx_work_order_id (work_order_id),
    INDEX idx_pay_status (pay_status),
    FOREIGN KEY (work_order_id) REFERENCES work_order(id),
    FOREIGN KEY (payer_id) REFERENCES owner(id),
    FOREIGN KEY (operator_id) REFERENCES sys_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='费用登记表';
