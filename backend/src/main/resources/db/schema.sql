-- =============================================
-- 青禾课程运营台 - 数据库表结构
-- =============================================

-- 用户表（学员/运营/管理员统一管理）
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password VARCHAR(256) NOT NULL,
    nickname VARCHAR(128),
    phone VARCHAR(32),
    email VARCHAR(128),
    avatar VARCHAR(512),
    role VARCHAR(32) NOT NULL DEFAULT 'STUDENT',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 课程表
CREATE TABLE IF NOT EXISTS course (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(256) NOT NULL,
    subtitle VARCHAR(512),
    description TEXT,
    cover_url VARCHAR(512),
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    original_price DECIMAL(10,2),
    total_hours INT NOT NULL DEFAULT 0,
    total_lessons INT NOT NULL DEFAULT 0,
    category VARCHAR(64),
    tags TEXT[],
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT REFERENCES sys_user(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 营期/班级表
CREATE TABLE IF NOT EXISTS course_class (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES course(id),
    class_name VARCHAR(256) NOT NULL,
    start_date DATE,
    end_date DATE,
    capacity INT NOT NULL DEFAULT 50,
    enrolled_count INT NOT NULL DEFAULT 0,
    teacher_name VARCHAR(128),
    assistant_name VARCHAR(128),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_by BIGINT REFERENCES sys_user(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 营期资料
CREATE TABLE IF NOT EXISTS class_material (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES course_class(id),
    title VARCHAR(256) NOT NULL,
    file_url VARCHAR(512) NOT NULL,
    file_name VARCHAR(256),
    file_size BIGINT,
    file_type VARCHAR(64),
    description TEXT,
    sort_order INT DEFAULT 0,
    created_by BIGINT REFERENCES sys_user(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 优惠券表
CREATE TABLE IF NOT EXISTS coupon (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(256) NOT NULL,
    type VARCHAR(32) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_amount DECIMAL(10,2) DEFAULT 0,
    total_count INT NOT NULL DEFAULT 0,
    used_count INT NOT NULL DEFAULT 0,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    course_ids BIGINT[],
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_by BIGINT REFERENCES sys_user(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 订单表
CREATE TABLE IF NOT EXISTS course_order (
    id BIGSERIAL PRIMARY KEY,
    order_no VARCHAR(64) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES sys_user(id),
    course_id BIGINT NOT NULL REFERENCES course(id),
    class_id BIGINT REFERENCES course_class(id),
    coupon_id BIGINT REFERENCES coupon(id),
    original_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(32),
    paid_at TIMESTAMP,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    refund_status VARCHAR(32),
    remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 学员学习进度
CREATE TABLE IF NOT EXISTS learning_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES sys_user(id),
    course_id BIGINT NOT NULL REFERENCES course(id),
    class_id BIGINT REFERENCES course_class(id),
    total_hours INT NOT NULL DEFAULT 0,
    consumed_hours DECIMAL(10,1) NOT NULL DEFAULT 0,
    completed_lessons INT NOT NULL DEFAULT 0,
    last_lesson_id BIGINT,
    last_study_at TIMESTAMP,
    completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id, class_id)
);

-- 作业表
CREATE TABLE IF NOT EXISTS assignment (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES course_class(id),
    lesson_id BIGINT,
    title VARCHAR(256) NOT NULL,
    description TEXT,
    attachment_url VARCHAR(512),
    due_date TIMESTAMP,
    created_by BIGINT REFERENCES sys_user(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 作业提交
CREATE TABLE IF NOT EXISTS assignment_submission (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES assignment(id),
    user_id BIGINT NOT NULL REFERENCES sys_user(id),
    content TEXT,
    attachment_url VARCHAR(512),
    submitted_at TIMESTAMP,
    score DECIMAL(5,2),
    comment TEXT,
    reviewed_by BIGINT REFERENCES sys_user(id),
    reviewed_at TIMESTAMP,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, user_id)
);

-- 分销佣金
CREATE TABLE IF NOT EXISTS distribution_commission (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES course_order(id),
    distributor_id BIGINT NOT NULL REFERENCES sys_user(id),
    order_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    settled_at TIMESTAMP,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 退款申请
CREATE TABLE IF NOT EXISTS refund_request (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES course_order(id),
    user_id BIGINT NOT NULL REFERENCES sys_user(id),
    refund_amount DECIMAL(10,2) NOT NULL,
    refund_reason TEXT,
    consumed_hours DECIMAL(10,1),
    hours_written_back BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_sent_at TIMESTAMP,
    processed_by BIGINT REFERENCES sys_user(id),
    processed_at TIMESTAMP,
    process_remark TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 附件表
CREATE TABLE IF NOT EXISTS attachment (
    id BIGSERIAL PRIMARY KEY,
    biz_type VARCHAR(64) NOT NULL,
    biz_id BIGINT NOT NULL,
    file_name VARCHAR(256) NOT NULL,
    file_url VARCHAR(512) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(64),
    uploaded_by BIGINT REFERENCES sys_user(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 备注表
CREATE TABLE IF NOT EXISTS remark (
    id BIGSERIAL PRIMARY KEY,
    biz_type VARCHAR(64) NOT NULL,
    biz_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_by BIGINT REFERENCES sys_user(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 修改历史表
CREATE TABLE IF NOT EXISTS change_history (
    id BIGSERIAL PRIMARY KEY,
    biz_type VARCHAR(64) NOT NULL,
    biz_id BIGINT NOT NULL,
    field_name VARCHAR(128),
    old_value TEXT,
    new_value TEXT,
    changed_by BIGINT REFERENCES sys_user(id),
    change_remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 状态流转记录
CREATE TABLE IF NOT EXISTS status_flow (
    id BIGSERIAL PRIMARY KEY,
    biz_type VARCHAR(64) NOT NULL,
    biz_id BIGINT NOT NULL,
    old_status VARCHAR(32),
    new_status VARCHAR(32) NOT NULL,
    operator_id BIGINT REFERENCES sys_user(id),
    operator_name VARCHAR(128),
    remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_course_status ON course(status);
CREATE INDEX IF NOT EXISTS idx_course_class_course ON course_class(course_id);
CREATE INDEX IF NOT EXISTS idx_course_class_status ON course_class(status);
CREATE INDEX IF NOT EXISTS idx_course_order_user ON course_order(user_id);
CREATE INDEX IF NOT EXISTS idx_course_order_status ON course_order(status);
CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_class ON assignment(class_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submission_user ON assignment_submission(user_id);
CREATE INDEX IF NOT EXISTS idx_distribution_commission_distributor ON distribution_commission(distributor_id);
CREATE INDEX IF NOT EXISTS idx_distribution_commission_status ON distribution_commission(status);
CREATE INDEX IF NOT EXISTS idx_refund_request_status ON refund_request(status);
CREATE INDEX IF NOT EXISTS idx_attachment_biz ON attachment(biz_type, biz_id);
CREATE INDEX IF NOT EXISTS idx_remark_biz ON remark(biz_type, biz_id);
CREATE INDEX IF NOT EXISTS idx_change_history_biz ON change_history(biz_type, biz_id);
CREATE INDEX IF NOT EXISTS idx_status_flow_biz ON status_flow(biz_type, biz_id);
