-- 连接到数据库
\c expense_approval;

-- 角色表
CREATE TABLE IF NOT EXISTS sys_role (
    id BIGSERIAL PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL UNIQUE,
    role_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    real_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    department VARCHAR(100),
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS sys_user_role (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES sys_user(id),
    role_id BIGINT NOT NULL REFERENCES sys_role(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- 报销类型表
CREATE TABLE IF NOT EXISTS expense_type (
    id BIGSERIAL PRIMARY KEY,
    type_code VARCHAR(50) NOT NULL UNIQUE,
    type_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    max_amount DECIMAL(12,2),
    requires_attachment BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 审批规则表
CREATE TABLE IF NOT EXISTS approval_rule (
    id BIGSERIAL PRIMARY KEY,
    expense_type_id BIGINT NOT NULL REFERENCES expense_type(id),
    min_amount DECIMAL(12,2) NOT NULL,
    max_amount DECIMAL(12,2),
    approval_level INT NOT NULL,
    approver_role_id BIGINT NOT NULL REFERENCES sys_role(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 报销单表
CREATE TABLE IF NOT EXISTS expense_report (
    id BIGSERIAL PRIMARY KEY,
    report_no VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    expense_type_id BIGINT NOT NULL REFERENCES expense_type(id),
    total_amount DECIMAL(12,2) NOT NULL,
    applicant_id BIGINT NOT NULL REFERENCES sys_user(id),
    department VARCHAR(100),
    expense_date DATE,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    current_approval_level INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 报销明细表
CREATE TABLE IF NOT EXISTS expense_item (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES expense_report(id),
    item_name VARCHAR(200) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 附件表
CREATE TABLE IF NOT EXISTS expense_attachment (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES expense_report(id),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),
    uploaded_by BIGINT REFERENCES sys_user(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 审批记录表
CREATE TABLE IF NOT EXISTS approval_record (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES expense_report(id),
    approver_id BIGINT NOT NULL REFERENCES sys_user(id),
    approval_level INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS sys_config (
    id BIGSERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    config_type VARCHAR(50),
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 退回原因选项表
CREATE TABLE IF NOT EXISTS reject_reason (
    id BIGSERIAL PRIMARY KEY,
    reason_code VARCHAR(50) NOT NULL UNIQUE,
    reason_text VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始化角色数据
INSERT INTO sys_role (role_code, role_name, description) VALUES
('ADMIN', '系统管理员', '拥有系统所有权限'),
('FINANCE_MANAGER', '财务经理', '负责财务审批和预算管理'),
('APPROVER', '审批人', '负责报销单审批'),
('APPLICANT', '申请人', '负责提交报销申请')
ON CONFLICT (role_code) DO NOTHING;

-- 初始化用户数据
INSERT INTO sys_user (username, password, real_name, email, phone, department) VALUES
('admin', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '系统管理员', 'admin@example.com', '13800000001', '信息技术部'),
('approver', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV/6tq', '审批人张三', 'approver@example.com', '13800000002', '财务部'),
('applicant', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV/6tq', '申请人李四', 'applicant@example.com', '13800000003', '市场部')
ON CONFLICT (username) DO NOTHING;

-- 为管理员分配所有角色
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r
WHERE u.username = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 为审批人分配审批人角色
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r
WHERE u.username = 'approver' AND r.role_code = 'APPROVER'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 为申请人分配申请人角色
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r
WHERE u.username = 'applicant' AND r.role_code = 'APPLICANT'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 初始化报销类型数据
INSERT INTO expense_type (type_code, type_name, description, max_amount, requires_attachment) VALUES
('TRAVEL', '差旅费', '因公出差产生的交通、住宿等费用', 50000.00, TRUE),
('ENTERTAINMENT', '招待费', '业务招待产生的餐饮、礼品等费用', 20000.00, TRUE),
('OFFICE', '办公费', '办公用品、办公耗材等费用', 5000.00, FALSE),
('TRANSPORT', '交通费', '市内交通、打车等费用', 3000.00, FALSE),
('COMMUNICATION', '通讯费', '电话费、网络费等', 2000.00, FALSE),
('TRAINING', '培训费', '员工培训、学习费用', 10000.00, TRUE),
('MEDICAL', '医药费', '员工医疗相关费用', 5000.00, TRUE),
('OTHER', '其他费用', '其他类型的费用', 10000.00, TRUE)
ON CONFLICT (type_code) DO NOTHING;

-- 初始化审批规则
-- 差旅费审批规则
INSERT INTO approval_rule (expense_type_id, min_amount, max_amount, approval_level, approver_role_id)
SELECT id, 0.00, 1000.00, 1, (SELECT id FROM sys_role WHERE role_code = 'APPROVER')
FROM expense_type WHERE type_code = 'TRAVEL'
ON CONFLICT DO NOTHING;

INSERT INTO approval_rule (expense_type_id, min_amount, max_amount, approval_level, approver_role_id)
SELECT id, 1000.00, 10000.00, 2, (SELECT id FROM sys_role WHERE role_code = 'FINANCE_MANAGER')
FROM expense_type WHERE type_code = 'TRAVEL'
ON CONFLICT DO NOTHING;

INSERT INTO approval_rule (expense_type_id, min_amount, max_amount, approval_level, approver_role_id)
SELECT id, 10000.00, NULL, 3, (SELECT id FROM sys_role WHERE role_code = 'ADMIN')
FROM expense_type WHERE type_code = 'TRAVEL'
ON CONFLICT DO NOTHING;

-- 招待费审批规则
INSERT INTO approval_rule (expense_type_id, min_amount, max_amount, approval_level, approver_role_id)
SELECT id, 0.00, 500.00, 1, (SELECT id FROM sys_role WHERE role_code = 'APPROVER')
FROM expense_type WHERE type_code = 'ENTERTAINMENT'
ON CONFLICT DO NOTHING;

INSERT INTO approval_rule (expense_type_id, min_amount, max_amount, approval_level, approver_role_id)
SELECT id, 500.00, 5000.00, 2, (SELECT id FROM sys_role WHERE role_code = 'FINANCE_MANAGER')
FROM expense_type WHERE type_code = 'ENTERTAINMENT'
ON CONFLICT DO NOTHING;

INSERT INTO approval_rule (expense_type_id, min_amount, max_amount, approval_level, approver_role_id)
SELECT id, 5000.00, NULL, 3, (SELECT id FROM sys_role WHERE role_code = 'ADMIN')
FROM expense_type WHERE type_code = 'ENTERTAINMENT'
ON CONFLICT DO NOTHING;

-- 办公费审批规则
INSERT INTO approval_rule (expense_type_id, min_amount, max_amount, approval_level, approver_role_id)
SELECT id, 0.00, 1000.00, 1, (SELECT id FROM sys_role WHERE role_code = 'APPROVER')
FROM expense_type WHERE type_code = 'OFFICE'
ON CONFLICT DO NOTHING;

INSERT INTO approval_rule (expense_type_id, min_amount, max_amount, approval_level, approver_role_id)
SELECT id, 1000.00, NULL, 2, (SELECT id FROM sys_role WHERE role_code = 'FINANCE_MANAGER')
FROM expense_type WHERE type_code = 'OFFICE'
ON CONFLICT DO NOTHING;

-- 交通费审批规则
INSERT INTO approval_rule (expense_type_id, min_amount, max_amount, approval_level, approver_role_id)
SELECT id, 0.00, NULL, 1, (SELECT id FROM sys_role WHERE role_code = 'APPROVER')
FROM expense_type WHERE type_code = 'TRANSPORT'
ON CONFLICT DO NOTHING;

-- 通讯费审批规则
INSERT INTO approval_rule (expense_type_id, min_amount, max_amount, approval_level, approver_role_id)
SELECT id, 0.00, NULL, 1, (SELECT id FROM sys_role WHERE role_code = 'APPROVER')
FROM expense_type WHERE type_code = 'COMMUNICATION'
ON CONFLICT DO NOTHING;

-- 培训费审批规则
INSERT INTO approval_rule (expense_type_id, min_amount, max_amount, approval_level, approver_role_id)
SELECT id, 0.00, 3000.00, 1, (SELECT id FROM sys_role WHERE role_code = 'APPROVER')
FROM expense_type WHERE type_code = 'TRAINING'
ON CONFLICT DO NOTHING;

INSERT INTO approval_rule (expense_type_id, min_amount, max_amount, approval_level, approver_role_id)
SELECT id, 3000.00, NULL, 2, (SELECT id FROM sys_role WHERE role_code = 'FINANCE_MANAGER')
FROM expense_type WHERE type_code = 'TRAINING'
ON CONFLICT DO NOTHING;

-- 医药费审批规则
INSERT INTO approval_rule (expense_type_id, min_amount, max_amount, approval_level, approver_role_id)
SELECT id, 0.00, 1000.00, 1, (SELECT id FROM sys_role WHERE role_code = 'APPROVER')
FROM expense_type WHERE type_code = 'MEDICAL'
ON CONFLICT DO NOTHING;

INSERT INTO approval_rule (expense_type_id, min_amount, max_amount, approval_level, approver_role_id)
SELECT id, 1000.00, NULL, 2, (SELECT id FROM sys_role WHERE role_code = 'FINANCE_MANAGER')
FROM expense_type WHERE type_code = 'MEDICAL'
ON CONFLICT DO NOTHING;

-- 其他费用审批规则
INSERT INTO approval_rule (expense_type_id, min_amount, max_amount, approval_level, approver_role_id)
SELECT id, 0.00, 1000.00, 1, (SELECT id FROM sys_role WHERE role_code = 'APPROVER')
FROM expense_type WHERE type_code = 'OTHER'
ON CONFLICT DO NOTHING;

INSERT INTO approval_rule (expense_type_id, min_amount, max_amount, approval_level, approver_role_id)
SELECT id, 1000.00, NULL, 2, (SELECT id FROM sys_role WHERE role_code = 'FINANCE_MANAGER')
FROM expense_type WHERE type_code = 'OTHER'
ON CONFLICT DO NOTHING;

-- 初始化系统配置
INSERT INTO sys_config (config_key, config_value, config_type, description) VALUES
('attachment.allowed_types', '.jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx', 'attachment', '允许上传的附件类型'),
('attachment.max_size_mb', '10', 'attachment', '单个附件最大大小(MB)'),
('attachment.max_count', '5', 'attachment', '单次上传最大附件数量'),
('attachment.required_threshold', '1000', 'attachment', '超过此金额必须上传附件'),
('reject.reasons_enabled', 'true', 'reject', '是否启用预设退回原因'),
('system.max_concurrent_users', '100', 'system', '最大并发用户数'),
('system.session_timeout_minutes', '30', 'system', '会话超时时间(分钟)'),
('system.upload_dir', '/data/uploads', 'system', '附件上传目录'),
('email.smtp_host', 'smtp.example.com', 'email', 'SMTP服务器地址'),
('email.smtp_port', '587', 'email', 'SMTP服务器端口'),
('notification.approval_enabled', 'true', 'notification', '审批通知是否启用'),
('notification.reject_enabled', 'true', 'notification', '退回通知是否启用'),
('notification.pass_enabled', 'true', 'notification', '通过通知是否启用')
ON CONFLICT (config_key) DO NOTHING;

-- 初始化退回原因选项
INSERT INTO reject_reason (reason_code, reason_text, sort_order) VALUES
('INCOMPLETE_INFO', '信息不完整，请补充完整后重新提交', 1),
('INVALID_EXPENSE', '费用不符合报销规定', 2),
('EXCEED_BUDGET', '超出预算限额', 3),
('MISSING_ATTACHMENT', '缺少必要的附件凭证', 4),
('WRONG_CATEGORY', '报销类型选择错误', 5),
('DUPLICATE', '重复报销', 6),
('OTHER', '其他原因（请在备注中说明）', 99)
ON CONFLICT (reason_code) DO NOTHING;
