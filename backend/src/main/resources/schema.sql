CREATE DATABASE IF NOT EXISTS email_ai_workbench DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE email_ai_workbench;

-- 用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    role VARCHAR(20) NOT NULL DEFAULT 'AGENT' COMMENT '角色: AGENT-销售, SUPERVISOR-主管, ADMIN-管理员',
    department VARCHAR(100) COMMENT '部门',
    status TINYINT DEFAULT 1 COMMENT '状态: 1-启用 0-禁用',
    deleted TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- 邮件草稿表
CREATE TABLE IF NOT EXISTS email_draft (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    draft_no VARCHAR(50) NOT NULL UNIQUE COMMENT '草稿编号',
    subject VARCHAR(200) COMMENT '邮件主题',
    recipient VARCHAR(500) COMMENT '收件人',
    cc VARCHAR(500) COMMENT '抄送',
    bcc VARCHAR(500) COMMENT '密送',
    content TEXT COMMENT '邮件正文',
    source_order_no VARCHAR(100) COMMENT '来源单据号',
    source_type VARCHAR(50) COMMENT '来源类型: CUSTOMER_COMPLAINT-客诉, ORDER_FOLLOWUP-订单跟进, PROMOTION-营销推广',
    agent_id BIGINT COMMENT '销售ID',
    agent_name VARCHAR(50) COMMENT '销售姓名',
    supervisor_id BIGINT COMMENT '主管ID',
    supervisor_name VARCHAR(50) COMMENT '主管姓名',
    current_version INT DEFAULT 1 COMMENT '当前版本号',
    status VARCHAR(20) DEFAULT 'DRAFT' COMMENT '状态: DRAFT-草稿, AI_GENERATED-AI已生成, PENDING_REVIEW-待审核, REVIEWED-已审核, APPROVED-已通过, REJECTED-已驳回, SENT-已发送',
    prompt_version_id BIGINT COMMENT '使用的提示词版本ID',
    risk_hit_reasons VARCHAR(500) COMMENT '风险样本命中原因(JSON数组)',
    risk_level VARCHAR(10) DEFAULT 'LOW' COMMENT '风险等级: LOW-低, MEDIUM-中, HIGH-高',
    remark VARCHAR(500) COMMENT '备注',
    deleted TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_agent_id (agent_id),
    INDEX idx_supervisor_id (supervisor_id),
    INDEX idx_status (status),
    INDEX idx_source_order (source_order_no),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邮件草稿表';

-- 邮件版本表
CREATE TABLE IF NOT EXISTS email_version (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    draft_id BIGINT NOT NULL COMMENT '草稿ID',
    draft_no VARCHAR(50) NOT NULL COMMENT '草稿编号',
    version INT NOT NULL COMMENT '版本号',
    subject VARCHAR(200) COMMENT '邮件主题',
    recipient VARCHAR(500) COMMENT '收件人',
    cc VARCHAR(500) COMMENT '抄送',
    bcc VARCHAR(500) COMMENT '密送',
    content TEXT COMMENT '邮件正文',
    content_source VARCHAR(20) DEFAULT 'MANUAL' COMMENT '内容来源: MANUAL-人工编辑, AI_GENERATED-AI生成, AI_MODIFIED-AI修改',
    prompt_version_id BIGINT COMMENT '使用的提示词版本ID',
    operator_id BIGINT COMMENT '操作人ID',
    operator_name VARCHAR(50) COMMENT '操作人姓名',
    change_summary VARCHAR(500) COMMENT '变更说明',
    deleted TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_draft_id (draft_id),
    INDEX idx_version (draft_id, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邮件版本表';

-- 审核记录表
CREATE TABLE IF NOT EXISTS email_review (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    draft_id BIGINT NOT NULL COMMENT '草稿ID',
    draft_no VARCHAR(50) NOT NULL COMMENT '草稿编号',
    version INT NOT NULL COMMENT '审核版本号',
    reviewer_id BIGINT NOT NULL COMMENT '审核人ID',
    reviewer_name VARCHAR(50) NOT NULL COMMENT '审核人姓名',
    review_type VARCHAR(20) NOT NULL DEFAULT 'AI' COMMENT '审核类型: AI-AI审核, MANUAL-人工复核',
    review_result VARCHAR(20) NOT NULL COMMENT '审核结果: PASS-通过, REJECT-驳回, MODIFY-需修改',
    ai_risk_score DECIMAL(5,2) COMMENT 'AI风险评分',
    forbidden_words_hit TEXT COMMENT '命中禁用词(JSON数组)',
    review_comment VARCHAR(1000) COMMENT '审核意见',
    reminder_sent TINYINT DEFAULT 0 COMMENT '是否已发送提醒: 1-是 0-否',
    source_order_no VARCHAR(100) COMMENT '来源单据号',
    operator_remark VARCHAR(500) COMMENT '操作备注',
    deleted TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_draft_id (draft_id),
    INDEX idx_reviewer_id (reviewer_id),
    INDEX idx_review_type (review_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审核记录表';

-- 禁用词库表
CREATE TABLE IF NOT EXISTS forbidden_word (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(100) NOT NULL COMMENT '禁用词',
    category VARCHAR(50) COMMENT '分类: LEGAL-法律合规, SENSITIVE-敏感词, PROMISE-过度承诺, OTHER-其他',
    risk_level VARCHAR(10) DEFAULT 'MEDIUM' COMMENT '风险等级: LOW-低, MEDIUM-中, HIGH-高',
    replacement VARCHAR(200) COMMENT '建议替换词',
    enabled TINYINT DEFAULT 1 COMMENT '是否启用: 1-是 0-否',
    operator_id BIGINT COMMENT '操作人ID',
    operator_name VARCHAR(50) COMMENT '操作人姓名',
    operator_remark VARCHAR(500) COMMENT '操作备注',
    source_order_no VARCHAR(100) COMMENT '来源单据号',
    deleted TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_word (word),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='禁用词库表';

-- 禁用词命中记录表
CREATE TABLE IF NOT EXISTS forbidden_word_hit (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    draft_id BIGINT NOT NULL COMMENT '草稿ID',
    draft_no VARCHAR(50) NOT NULL COMMENT '草稿编号',
    version INT NOT NULL COMMENT '版本号',
    word_id BIGINT NOT NULL COMMENT '禁用词ID',
    word VARCHAR(100) NOT NULL COMMENT '禁用词',
    hit_position VARCHAR(100) COMMENT '命中位置',
    hit_count INT DEFAULT 1 COMMENT '命中次数',
    source_order_no VARCHAR(100) COMMENT '来源单据号',
    operator_remark VARCHAR(500) COMMENT '操作备注',
    deleted TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_draft_id (draft_id),
    INDEX idx_word_id (word_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='禁用词命中记录表';

-- 提示词模板表
CREATE TABLE IF NOT EXISTS prompt_template (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    template_code VARCHAR(50) NOT NULL UNIQUE COMMENT '模板编码',
    template_name VARCHAR(100) NOT NULL COMMENT '模板名称',
    description VARCHAR(500) COMMENT '模板描述',
    scene_type VARCHAR(50) COMMENT '适用场景: CUSTOMER_COMPLAINT-客诉, ORDER_FOLLOWUP-订单跟进, PROMOTION-营销推广',
    deleted TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提示词模板表';

-- 提示词版本表
CREATE TABLE IF NOT EXISTS prompt_version (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    template_id BIGINT NOT NULL COMMENT '模板ID',
    template_code VARCHAR(50) NOT NULL COMMENT '模板编码',
    version INT NOT NULL COMMENT '版本号',
    prompt_content TEXT NOT NULL COMMENT '提示词内容',
    variables TEXT COMMENT '变量定义(JSON)',
    status VARCHAR(20) DEFAULT 'ACTIVE' COMMENT '状态: DRAFT-草稿, ACTIVE-生效中, DEPRECATED-已弃用',
    operator_id BIGINT COMMENT '操作人ID',
    operator_name VARCHAR(50) COMMENT '操作人姓名',
    operator_remark VARCHAR(500) COMMENT '操作备注',
    source_order_no VARCHAR(100) COMMENT '来源单据号',
    deleted TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_template_id (template_id),
    INDEX idx_version (template_id, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提示词版本表';

-- 采纳率统计表
CREATE TABLE IF NOT EXISTS adoption_statistic (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stat_date DATE NOT NULL COMMENT '统计日期',
    supervisor_id BIGINT COMMENT '主管ID',
    supervisor_name VARCHAR(50) COMMENT '主管姓名',
    agent_id BIGINT COMMENT '销售ID',
    agent_name VARCHAR(50) COMMENT '销售姓名',
    risk_hit_reason VARCHAR(100) COMMENT '风险样本命中原因',
    total_generated INT DEFAULT 0 COMMENT 'AI生成总数',
    adopted_count INT DEFAULT 0 COMMENT '采纳数量',
    partial_adopted_count INT DEFAULT 0 COMMENT '部分采纳数量',
    rejected_count INT DEFAULT 0 COMMENT '拒绝数量',
    adoption_rate DECIMAL(5,4) DEFAULT 0 COMMENT '采纳率',
    deleted TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_stat (stat_date, supervisor_id, agent_id, risk_hit_reason),
    INDEX idx_supervisor (supervisor_id, stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='采纳率统计表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    operation_type VARCHAR(50) NOT NULL COMMENT '操作类型',
    business_type VARCHAR(50) COMMENT '业务类型',
    business_id VARCHAR(100) COMMENT '业务ID',
    source_order_no VARCHAR(100) COMMENT '来源单据号',
    operator_id BIGINT COMMENT '操作人ID',
    operator_name VARCHAR(50) COMMENT '操作人姓名',
    detail TEXT COMMENT '操作详情(JSON)',
    remark VARCHAR(500) COMMENT '备注',
    ip VARCHAR(50) COMMENT 'IP地址',
    deleted TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_operator (operator_id),
    INDEX idx_business (business_type, business_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 初始化用户数据
INSERT INTO sys_user (username, real_name, role, department, status) VALUES
('admin', '系统管理员', 'ADMIN', '运营部', 1),
('supervisor01', '张主管', 'SUPERVISOR', '销售一组', 1),
('supervisor02', '李主管', 'SUPERVISOR', '销售二组', 1),
('agent01', '王销售', 'AGENT', '销售一组', 1),
('agent02', '赵销售', 'AGENT', '销售一组', 1),
('agent03', '陈销售', 'AGENT', '销售二组', 1);

-- 初始化禁用词
INSERT INTO forbidden_word (word, category, risk_level, replacement, enabled, operator_id, operator_name) VALUES
('绝对', 'PROMISE', 'HIGH', '相对', 1, 1, '系统管理员'),
('100%', 'PROMISE', 'HIGH', '大概率', 1, 1, '系统管理员'),
('保证', 'PROMISE', 'MEDIUM', '承诺', 1, 1, '系统管理员'),
('最低价', 'PROMISE', 'MEDIUM', '优惠价', 1, 1, '系统管理员'),
('投诉你们', 'SENSITIVE', 'LOW', '反馈问题', 1, 1, '系统管理员'),
('欺骗', 'LEGAL', 'HIGH', '误解', 1, 1, '系统管理员');

-- 初始化提示词模板和版本
INSERT INTO prompt_template (template_code, template_name, description, scene_type) VALUES
('COMPLAINT_REPLY', '客诉回复模板', '处理客户投诉的邮件回复模板', 'CUSTOMER_COMPLAINT'),
('ORDER_FOLLOWUP', '订单跟进模板', '订单状态跟进邮件模板', 'ORDER_FOLLOWUP'),
('PROMOTION', '营销推广模板', '产品推广营销邮件模板', 'PROMOTION');

INSERT INTO prompt_version (template_id, template_code, version, prompt_content, status, operator_id, operator_name, operator_remark) VALUES
(1, 'COMPLAINT_REPLY', 1, '你是一位专业的客户服务人员，请根据以下客户投诉内容，撰写一封礼貌、专业的回复邮件：\n客户姓名：{{customerName}}\n投诉内容：{{complaintContent}}\n订单号：{{orderNo}}\n要求：1.表达歉意 2.说明处理方案 3.给出处理时限 4.保持友好专业', 'ACTIVE', 1, '系统管理员', '初始版本'),
(1, 'COMPLAINT_REPLY', 2, '你是一位资深客户服务主管，请根据以下客户投诉内容，撰写一封真诚、专业的回复邮件：\n客户姓名：{{customerName}}\n投诉内容：{{complaintContent}}\n订单号：{{orderNo}}\n历史沟通记录：{{history}}\n要求：1.真诚致歉 2.详细说明解决方案 3.明确补偿方案 4.给出联系人及处理时限 5.严禁使用绝对化承诺用语', 'ACTIVE', 1, '系统管理员', '优化版本，增加补偿方案和禁用词要求'),
(2, 'ORDER_FOLLOWUP', 1, '请根据以下订单信息撰写订单跟进邮件：\n客户姓名：{{customerName}}\n订单号：{{orderNo}}\n订单状态：{{orderStatus}}\n预计发货时间：{{shipTime}}', 'ACTIVE', 1, '系统管理员', '初始版本'),
(3, 'PROMOTION', 1, '请根据以下产品信息撰写营销推广邮件：\n产品名称：{{productName}}\n优惠内容：{{promotion}}\n活动截止：{{deadline}}', 'ACTIVE', 1, '系统管理员', '初始版本');
