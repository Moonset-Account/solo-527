CREATE DATABASE IF NOT EXISTS course_learning DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE course_learning;

CREATE TABLE sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    nickname VARCHAR(100) COMMENT '昵称',
    avatar VARCHAR(500) COMMENT '头像',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER' COMMENT '角色: ADMIN-管理员, TEACHER-讲师, MEMBER-会员',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1-启用, 0-禁用',
    member_expire_time DATETIME COMMENT '会员到期时间',
    invite_code VARCHAR(20) UNIQUE COMMENT '邀请码',
    referrer_id BIGINT COMMENT '推荐人ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

CREATE TABLE course (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '课程标题',
    cover VARCHAR(500) COMMENT '课程封面',
    description TEXT COMMENT '课程简介',
    teacher_id BIGINT NOT NULL COMMENT '讲师ID',
    category VARCHAR(50) COMMENT '分类',
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '价格',
    original_price DECIMAL(10,2) COMMENT '原价',
    member_free TINYINT NOT NULL DEFAULT 0 COMMENT '会员免费: 1-是, 0-否',
    total_chapters INT NOT NULL DEFAULT 0 COMMENT '总章节数',
    total_duration INT NOT NULL DEFAULT 0 COMMENT '总时长(分钟)',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1-上架, 0-下架',
    sort INT NOT NULL DEFAULT 0 COMMENT '排序',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT NOT NULL DEFAULT 0,
    INDEX idx_teacher_id(teacher_id),
    INDEX idx_category(category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程表';

CREATE TABLE chapter (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL COMMENT '课程ID',
    title VARCHAR(200) NOT NULL COMMENT '章节标题',
    chapter_order INT NOT NULL COMMENT '章节顺序',
    duration INT NOT NULL DEFAULT 0 COMMENT '时长(分钟)',
    video_url VARCHAR(500) COMMENT '视频地址',
    is_preview TINYINT NOT NULL DEFAULT 0 COMMENT '是否试看: 1-是, 0-否',
    preview_duration INT DEFAULT 0 COMMENT '试看时长(秒)',
    content TEXT COMMENT '章节内容描述',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT NOT NULL DEFAULT 0,
    INDEX idx_course_id(course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='章节表';

CREATE TABLE user_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(32) NOT NULL UNIQUE COMMENT '订单号',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    course_id BIGINT COMMENT '课程ID',
    order_type VARCHAR(20) NOT NULL DEFAULT 'COURSE' COMMENT '订单类型: COURSE-课程, MEMBER-会员',
    amount DECIMAL(10,2) NOT NULL COMMENT '订单金额',
    pay_amount DECIMAL(10,2) COMMENT '实付金额',
    pay_status TINYINT NOT NULL DEFAULT 0 COMMENT '支付状态: 0-待支付, 1-已支付, 2-已退款',
    pay_time DATETIME COMMENT '支付时间',
    pay_method VARCHAR(20) COMMENT '支付方式',
    member_days INT COMMENT '会员天数',
    referrer_id BIGINT COMMENT '推荐人ID',
    commission_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '佣金金额',
    commission_status TINYINT NOT NULL DEFAULT 0 COMMENT '佣金状态: 0-待结算, 1-已结算, 2-有争议, 3-已取消',
    commission_dispute_note VARCHAR(500) COMMENT '佣金争议备注',
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT NOT NULL DEFAULT 0,
    INDEX idx_user_id(user_id),
    INDEX idx_order_no(order_no),
    INDEX idx_pay_status(pay_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

CREATE TABLE study_progress (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    course_id BIGINT NOT NULL COMMENT '课程ID',
    chapter_id BIGINT NOT NULL COMMENT '章节ID',
    progress INT NOT NULL DEFAULT 0 COMMENT '学习进度(0-100)',
    watch_duration INT NOT NULL DEFAULT 0 COMMENT '观看时长(秒)',
    is_completed TINYINT NOT NULL DEFAULT 0 COMMENT '是否完成: 1-是, 0-否',
    completed_at DATETIME COMMENT '完成时间',
    last_study_time DATETIME COMMENT '最后学习时间',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_chapter(user_id, chapter_id),
    INDEX idx_user_course(user_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习进度表';

CREATE TABLE check_in (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    check_date DATE NOT NULL COMMENT '打卡日期',
    study_duration INT NOT NULL DEFAULT 0 COMMENT '学习时长(分钟)',
    course_id BIGINT COMMENT '关联课程',
    remark VARCHAR(500) COMMENT '备注',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_date(user_id, check_date),
    INDEX idx_user_id(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='打卡记录表';

CREATE TABLE member_benefit (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '权益名称',
    description VARCHAR(500) COMMENT '权益描述',
    icon VARCHAR(200) COMMENT '图标',
    benefit_type VARCHAR(20) NOT NULL DEFAULT 'COURSE' COMMENT '权益类型: COURSE-课程, DISCOUNT-折扣, SERVICE-服务',
    value VARCHAR(200) COMMENT '权益值',
    sort INT NOT NULL DEFAULT 0,
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员权益表';

CREATE TABLE commission_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL COMMENT '订单ID',
    user_id BIGINT NOT NULL COMMENT '佣金用户ID',
    order_user_id BIGINT NOT NULL COMMENT '下单用户ID',
    amount DECIMAL(10,2) NOT NULL COMMENT '佣金金额',
    log_type VARCHAR(20) NOT NULL COMMENT '类型: SETTLE-结算, CONFIRM-确认争议, CANCEL-取消',
    before_status TINYINT COMMENT '变更前状态',
    after_status TINYINT COMMENT '变更后状态',
    remark VARCHAR(500) COMMENT '备注',
    operator_id BIGINT COMMENT '操作人',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id(user_id),
    INDEX idx_order_id(order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='佣金流水表';

CREATE TABLE notification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '接收用户ID',
    type VARCHAR(30) NOT NULL COMMENT '通知类型: COMMISSION_DISPUTE-佣金争议, SYSTEM-系统, ORDER-订单',
    title VARCHAR(200) NOT NULL COMMENT '标题',
    content TEXT COMMENT '内容',
    related_id BIGINT COMMENT '关联ID',
    is_read TINYINT NOT NULL DEFAULT 0 COMMENT '是否已读: 1-是, 0-否',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id(user_id),
    INDEX idx_user_read(user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知表';

INSERT INTO sys_user (username, password, nickname, role, phone, invite_code) VALUES
('admin', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '超级管理员', 'ADMIN', '13800000001', 'ADMIN001'),
('teacher01', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '张老师', 'TEACHER', '13800000002', 'TEACH001'),
('member01', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '李学员', 'MEMBER', '13800000003', 'MEM0001'),
('member02', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '王学员', 'MEMBER', '13800000004', 'MEM0002');

INSERT INTO course (title, cover, description, teacher_id, category, price, original_price, member_free, total_chapters, total_duration, sort) VALUES
('职场沟通必修课', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=business%20communication%20professional%20course%20cover&image_size=square', '从职场小白到沟通高手，系统提升职场沟通能力', 2, '职场软技能', 299.00, 599.00, 1, 12, 480, 1),
('高效时间管理实战', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=time%20management%20productivity%20course%20cover&image_size=square', '告别拖延，掌握高效工作方法论', 2, '职场软技能', 199.00, 399.00, 1, 8, 320, 2),
('Excel数据处理精通', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=excel%20data%20analysis%20professional%20course&image_size=square', '从入门到精通，成为Excel高手', 2, '办公技能', 399.00, 799.00, 0, 16, 640, 3),
('项目管理PMP备考', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=project%20management%20pmp%20certification%20course&image_size=square', '系统学习项目管理知识体系', 2, '专业认证', 899.00, 1599.00, 0, 24, 960, 4);

INSERT INTO chapter (course_id, title, chapter_order, duration, is_preview, preview_duration, content) VALUES
(1, '职场沟通的核心原则', 1, 40, 1, 180, '了解职场沟通的基本框架和核心原则'),
(1, '向上沟通的艺术', 2, 45, 1, 120, '如何与领导进行有效沟通'),
(1, '平行部门协作沟通', 3, 40, 0, 0, '跨部门协作的沟通技巧'),
(1, '向下沟通与反馈', 4, 45, 0, 0, '如何给下属有效反馈'),
(1, '会议沟通技巧', 5, 35, 0, 0, '主持高效会议的方法'),
(1, '书面沟通与邮件写作', 6, 40, 0, 0, '职场邮件和报告的写作规范'),
(2, '时间管理的底层逻辑', 1, 40, 1, 200, '理解时间管理的本质'),
(2, '四象限法则实战', 2, 40, 1, 150, '优先级排序的核心方法'),
(2, '番茄工作法详解', 3, 35, 0, 0, '提升专注力的实用工具'),
(3, 'Excel基础操作速通', 1, 35, 1, 200, '快速掌握Excel基础'),
(3, '函数公式入门', 2, 45, 1, 180, '常用函数详解与实战'),
(3, '数据透视表精通', 3, 50, 0, 0, '数据分析利器');

INSERT INTO member_benefit (name, description, icon, benefit_type, value, sort) VALUES
('全场课程免费', '会员可免费学习所有会员专区课程', '👑', 'COURSE', 'ALL_MEMBER_FREE', 1),
('专属学习社群', '加入会员专属学习社群，与讲师互动', '👥', 'SERVICE', 'VIP_GROUP', 2),
('课程8折优惠', '购买非会员免费课程享8折优惠', '💰', 'DISCOUNT', '0.8', 3),
('优先答疑服务', '提问后24小时内必获解答', '💬', 'SERVICE', 'PRIORITY_QA', 4),
('学习资料下载', '可下载所有课程配套学习资料', '📚', 'COURSE', 'MATERIALS', 5),
('定期直播课', '每月参加会员专属直播课', '🎥', 'SERVICE', 'LIVE_CLASS', 6);

INSERT INTO check_in (user_id, check_date, study_duration, course_id, remark) VALUES
(3, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 65, 1, '学习了第一章和第二章'),
(3, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 45, 1, '完成第三章学习'),
(3, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 80, 2, '开始时间管理课程'),
(3, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 50, 2, '番茄工作法实践'),
(3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 70, 1, '复习沟通技巧'),
(4, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 30, 3, 'Excel基础学习'),
(4, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 90, 3, '函数公式深入学习'),
(4, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 40, 1, '沟通课试听');

INSERT INTO study_progress (user_id, course_id, chapter_id, progress, watch_duration, is_completed, last_study_time) VALUES
(3, 1, 1, 100, 2400, 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 1, 2, 100, 2700, 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 1, 3, 65, 1560, 0, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 2, 1, 100, 2400, 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(3, 2, 2, 80, 1920, 0, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 3, 1, 100, 2100, 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, 3, 2, 75, 2025, 0, DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO user_order (order_no, user_id, course_id, order_type, amount, pay_amount, pay_status, pay_time, pay_method, commission_amount, commission_status, referrer_id) VALUES
('ORD202401150001', 3, NULL, 'MEMBER', 365.00, 365.00, 1, DATE_SUB(NOW(), INTERVAL 30 DAY), 'WECHAT', 36.50, 1, 4),
('ORD202401150002', 4, 3, 'COURSE', 399.00, 319.20, 1, DATE_SUB(NOW(), INTERVAL 20 DAY), 'ALIPAY', 39.90, 2, NULL),
('ORD202401150003', 3, 4, 'COURSE', 899.00, 719.20, 1, DATE_SUB(NOW(), INTERVAL 10 DAY), 'WECHAT', 89.90, 0, 2),
('ORD202401150004', 4, NULL, 'MEMBER', 365.00, 365.00, 1, DATE_SUB(NOW(), INTERVAL 5 DAY), 'WECHAT', 36.50, 0, 3);

INSERT INTO notification (user_id, type, title, content, related_id, is_read) VALUES
(2, 'COMMISSION_DISPUTE', '佣金争议提醒', '订单ORD202401150002存在佣金争议，请及时处理', 2, 0),
(2, 'SYSTEM', '新课程上架提醒', '您的课程"Excel数据处理精通"已有100人购买', 3, 1),
(3, 'ORDER', '会员续费提醒', '您的会员还有30天到期，续费享优惠', NULL, 0);
