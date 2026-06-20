-- =====================================================
-- 物业客服公寓住户报修工单中心 数据库初始化脚本
-- PostgreSQL 14+
-- =====================================================

-- 创建数据库
-- CREATE DATABASE property_workorder WITH ENCODING 'UTF8';

-- 公共枚举类型
CREATE TYPE work_order_status AS ENUM ('PENDING', 'ASSIGNED', 'PROCESSING', 'COMPLETED', 'CLOSED', 'CANCELLED');
CREATE TYPE work_order_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE bill_status AS ENUM ('UNPAID', 'PARTIAL_PAID', 'PAID', 'OVERDUE', 'CANCELLED');
CREATE TYPE payment_method AS ENUM ('ALIPAY', 'WECHAT', 'BANK', 'CASH', 'TRANSFER');
CREATE TYPE visitor_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHECKED_IN', 'CHECKED_OUT', 'EXPIRED');
CREATE TYPE inspection_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');
CREATE TYPE risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE risk_status AS ENUM ('OPEN', 'PROCESSING', 'MITIGATED', 'CLOSED');
CREATE TYPE callback_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'RETRYING');
CREATE TYPE user_role AS ENUM ('RESIDENT', 'STAFF', 'ADMIN', 'FINANCE', 'ENGINEER');

-- =====================================================
-- 1. 住户表
-- =====================================================
CREATE TABLE IF NOT EXISTS resident (
    id              BIGSERIAL PRIMARY KEY,
    resident_no     VARCHAR(32) NOT NULL UNIQUE,
    name            VARCHAR(64) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    id_card         VARCHAR(20),
    building_no     VARCHAR(16) NOT NULL,
    room_no         VARCHAR(16) NOT NULL,
    email           VARCHAR(128),
    status          SMALLINT NOT NULL DEFAULT 1,
    check_in_date   DATE,
    check_out_date  DATE,
    remark          TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_resident_phone ON resident(phone);
CREATE INDEX IF NOT EXISTS idx_resident_room ON resident(building_no, room_no);

-- =====================================================
-- 2. 员工表（物业工作人员）
-- =====================================================
CREATE TABLE IF NOT EXISTS staff (
    id              BIGSERIAL PRIMARY KEY,
    staff_no        VARCHAR(32) NOT NULL UNIQUE,
    name            VARCHAR(64) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    role            user_role NOT NULL DEFAULT 'STAFF',
    department      VARCHAR(64),
    position        VARCHAR(64),
    status          SMALLINT NOT NULL DEFAULT 1,
    remark          TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);

-- =====================================================
-- 3. 报修工单表
-- =====================================================
CREATE TABLE IF NOT EXISTS work_order (
    id              BIGSERIAL PRIMARY KEY,
    order_no        VARCHAR(32) NOT NULL UNIQUE,
    resident_id     BIGINT NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL,
    category        VARCHAR(64) NOT NULL,
    priority        work_order_priority NOT NULL DEFAULT 'MEDIUM',
    status          work_order_status NOT NULL DEFAULT 'PENDING',
    building_no     VARCHAR(16) NOT NULL,
    room_no         VARCHAR(16) NOT NULL,
    contact_name    VARCHAR(64),
    contact_phone   VARCHAR(20),
    appointment_time TIMESTAMP,
    images          TEXT,
    assigned_to     BIGINT,
    assigned_at     TIMESTAMP,
    completed_at    TIMESTAMP,
    closed_at       TIMESTAMP,
    actual_cost     DECIMAL(12,2) DEFAULT 0,
    remark          TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_workorder_status ON work_order(status);
CREATE INDEX IF NOT EXISTS idx_workorder_resident ON work_order(resident_id);
CREATE INDEX IF NOT EXISTS idx_workorder_assigned ON work_order(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workorder_created ON work_order(created_at);

-- =====================================================
-- 4. 工单派工/处理日志
-- =====================================================
CREATE TABLE IF NOT EXISTS work_order_log (
    id              BIGSERIAL PRIMARY KEY,
    work_order_id   BIGINT NOT NULL,
    operator_id     BIGINT,
    operator_name   VARCHAR(64),
    action          VARCHAR(64) NOT NULL,
    old_status      work_order_status,
    new_status      work_order_status,
    content         TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orderlog_orderid ON work_order_log(work_order_id);

-- =====================================================
-- 5. 工单回访记录
-- =====================================================
CREATE TABLE IF NOT EXISTS work_order_visit (
    id              BIGSERIAL PRIMARY KEY,
    work_order_id   BIGINT NOT NULL UNIQUE,
    visited_by      BIGINT NOT NULL,
    visited_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    visit_result    TEXT,
    resident_satisfied SMALLINT,
    need_follow_up  SMALLINT DEFAULT 0,
    follow_up_note  TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);

-- =====================================================
-- 6. 工单评价
-- =====================================================
CREATE TABLE IF NOT EXISTS work_order_review (
    id              BIGSERIAL PRIMARY KEY,
    work_order_id   BIGINT NOT NULL UNIQUE,
    resident_id     BIGINT NOT NULL,
    rating          SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    speed_rating    SMALLINT CHECK (speed_rating >= 1 AND speed_rating <= 5),
    attitude_rating SMALLINT CHECK (attitude_rating >= 1 AND attitude_rating <= 5),
    quality_rating  SMALLINT CHECK (quality_rating >= 1 AND quality_rating <= 5),
    content         TEXT,
    images          TEXT,
    anonymous       SMALLINT DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);

-- =====================================================
-- 7. 费用账单表
-- =====================================================
CREATE TABLE IF NOT EXISTS fee_bill (
    id              BIGSERIAL PRIMARY KEY,
    bill_no         VARCHAR(32) NOT NULL UNIQUE,
    resident_id     BIGINT NOT NULL,
    building_no     VARCHAR(16) NOT NULL,
    room_no         VARCHAR(16) NOT NULL,
    fee_type        VARCHAR(64) NOT NULL,
    bill_period     VARCHAR(16) NOT NULL,
    bill_date       DATE NOT NULL,
    due_date        DATE NOT NULL,
    total_amount    DECIMAL(12,2) NOT NULL,
    paid_amount     DECIMAL(12,2) NOT NULL DEFAULT 0,
    status          bill_status NOT NULL DEFAULT 'UNPAID',
    details         JSONB,
    remark          TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_feebill_resident ON fee_bill(resident_id);
CREATE INDEX IF NOT EXISTS idx_feebill_status ON fee_bill(status);
CREATE INDEX IF NOT EXISTS idx_feebill_period ON fee_bill(bill_period);
CREATE INDEX IF NOT EXISTS idx_feebill_room ON fee_bill(building_no, room_no);

-- =====================================================
-- 8. 缴费记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_record (
    id              BIGSERIAL PRIMARY KEY,
    payment_no      VARCHAR(32) NOT NULL UNIQUE,
    bill_id         BIGINT NOT NULL,
    resident_id     BIGINT NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    method          payment_method NOT NULL,
    transaction_no  VARCHAR(64),
    status          SMALLINT NOT NULL DEFAULT 1,
    paid_at         TIMESTAMP,
    operator_id     BIGINT,
    remark          TEXT,
    callback_data   JSONB,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_payment_bill ON payment_record(bill_id);
CREATE INDEX IF NOT EXISTS idx_payment_resident ON payment_record(resident_id);
CREATE INDEX IF NOT EXISTS idx_payment_created ON payment_record(created_at);

-- =====================================================
-- 9. 访客预约表
-- =====================================================
CREATE TABLE IF NOT EXISTS visitor_appointment (
    id              BIGSERIAL PRIMARY KEY,
    appointment_no  VARCHAR(32) NOT NULL UNIQUE,
    resident_id     BIGINT NOT NULL,
    visitor_name    VARCHAR(64) NOT NULL,
    visitor_phone   VARCHAR(20) NOT NULL,
    visitor_id_card VARCHAR(20),
    visitor_count   SMALLINT NOT NULL DEFAULT 1,
    building_no     VARCHAR(16) NOT NULL,
    room_no         VARCHAR(16) NOT NULL,
    visit_date      DATE NOT NULL,
    visit_time_start TIME NOT NULL,
    visit_time_end  TIME NOT NULL,
    visit_purpose   VARCHAR(200),
    status          visitor_status NOT NULL DEFAULT 'PENDING',
    approved_by     BIGINT,
    approved_at     TIMESTAMP,
    check_in_at     TIMESTAMP,
    check_out_at    TIMESTAMP,
    remark          TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_visitor_resident ON visitor_appointment(resident_id);
CREATE INDEX IF NOT EXISTS idx_visitor_status ON visitor_appointment(status);
CREATE INDEX IF NOT EXISTS idx_visitor_date ON visitor_appointment(visit_date);

-- =====================================================
-- 10. 巡检任务表
-- =====================================================
CREATE TABLE IF NOT EXISTS inspection_task (
    id              BIGSERIAL PRIMARY KEY,
    task_no         VARCHAR(32) NOT NULL UNIQUE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    inspection_type VARCHAR(64) NOT NULL,
    area            VARCHAR(200),
    plan_date       DATE NOT NULL,
    assignee_id     BIGINT,
    status          inspection_status NOT NULL DEFAULT 'PENDING',
    started_at      TIMESTAMP,
    completed_at    TIMESTAMP,
    result          TEXT,
    issues_found    TEXT,
    images          TEXT,
    remark          TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_inspection_status ON inspection_task(status);
CREATE INDEX IF NOT EXISTS idx_inspection_date ON inspection_task(plan_date);
CREATE INDEX IF NOT EXISTS idx_inspection_assignee ON inspection_task(assignee_id);

-- =====================================================
-- 11. 合同风险记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS contract_risk (
    id              BIGSERIAL PRIMARY KEY,
    risk_no         VARCHAR(32) NOT NULL UNIQUE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    risk_type       VARCHAR(64) NOT NULL,
    level           risk_level NOT NULL DEFAULT 'MEDIUM',
    status          risk_status NOT NULL DEFAULT 'OPEN',
    affected_objects TEXT NOT NULL,
    person_in_charge BIGINT NOT NULL,
    closing_condition TEXT NOT NULL,
    discovered_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_close_date DATE,
    actual_close_date DATE,
    mitigation_measures TEXT,
    remark          TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_risk_status ON contract_risk(status);
CREATE INDEX IF NOT EXISTS idx_risk_level ON contract_risk(level);
CREATE INDEX IF NOT EXISTS idx_risk_pic ON contract_risk(person_in_charge);

-- =====================================================
-- 12. 外部回调记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS callback_record (
    id              BIGSERIAL PRIMARY KEY,
    callback_id     VARCHAR(64) NOT NULL UNIQUE,
    callback_type   VARCHAR(64) NOT NULL,
    business_id     VARCHAR(64),
    business_type   VARCHAR(64),
    url             VARCHAR(500) NOT NULL,
    request_body    TEXT,
    response_body   TEXT,
    status          callback_status NOT NULL DEFAULT 'PENDING',
    retry_count     INTEGER NOT NULL DEFAULT 0,
    max_retries     INTEGER NOT NULL DEFAULT 5,
    failure_reason  TEXT,
    last_attempt_at TIMESTAMP,
    next_retry_at   TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_callback_status ON callback_record(status);
CREATE INDEX IF NOT EXISTS idx_callback_business ON callback_record(business_id, business_type);
CREATE INDEX IF NOT EXISTS idx_callback_next ON callback_record(next_retry_at);

-- =====================================================
-- 13. 回调补偿操作日志
-- =====================================================
CREATE TABLE IF NOT EXISTS callback_compensation_log (
    id              BIGSERIAL PRIMARY KEY,
    callback_id     VARCHAR(64) NOT NULL,
    action          VARCHAR(64) NOT NULL,
    operator_id     BIGINT,
    operator_name   VARCHAR(64),
    note            TEXT,
    before_data     TEXT,
    after_data      TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_comp_callback ON callback_compensation_log(callback_id);

-- =====================================================
-- 初始化测试数据
-- =====================================================
INSERT INTO resident (resident_no, name, phone, id_card, building_no, room_no, email, check_in_date) VALUES
('R2024001', '张三', '13800138001', '110101199001011234', '1号楼', '101', 'zhangsan@example.com', '2024-01-15'),
('R2024002', '李四', '13800138002', '110101199002022345', '1号楼', '102', 'lisi@example.com', '2024-02-01'),
('R2024003', '王五', '13800138003', '110101199003033456', '2号楼', '201', 'wangwu@example.com', '2024-03-10');

INSERT INTO staff (staff_no, name, phone, role, department, position) VALUES
('S001', '管理员', '13900139001', 'ADMIN', '管理部', '系统管理员'),
('S002', '张工', '13900139002', 'ENGINEER', '工程部', '维修工程师'),
('S003', '李工', '13900139003', 'ENGINEER', '工程部', '维修工程师'),
('S004', '王客服', '13900139004', 'STAFF', '客服部', '客服专员'),
('S005', '赵财务', '13900139005', 'FINANCE', '财务部', '财务专员');

INSERT INTO fee_bill (bill_no, resident_id, building_no, room_no, fee_type, bill_period, bill_date, due_date, total_amount, paid_amount, status, details) VALUES
('B202406001', 1, '1号楼', '101', '物业费', '2024-06', '2024-06-01', '2024-06-30', 380.00, 380.00, 'PAID', '{"unit_price": 3.8, "area": 100}'),
('B202406002', 2, '1号楼', '102', '物业费', '2024-06', '2024-06-01', '2024-06-30', 456.00, 0, 'UNPAID', '{"unit_price": 3.8, "area": 120}'),
('B202406003', 3, '2号楼', '201', '物业费', '2024-06', '2024-06-01', '2024-06-30', 418.00, 200.00, 'PARTIAL_PAID', '{"unit_price": 3.8, "area": 110}'),
('B202406004', 1, '1号楼', '101', '水费', '2024-06', '2024-06-05', '2024-06-30', 56.80, 0, 'UNPAID', '{"unit_price": 5.0, "usage": 11.36}'),
('B202406005', 1, '1号楼', '101', '电费', '2024-06', '2024-06-05', '2024-06-30', 180.50, 0, 'UNPAID', '{"unit_price": 0.61, "usage": 295.9}');

INSERT INTO work_order (order_no, resident_id, title, description, category, priority, status, building_no, room_no, contact_name, contact_phone, appointment_time) VALUES
('WO202406001', 1, '空调不制冷', '客厅空调开机后出风不凉，需要维修检查', '家电维修', 'HIGH', 'COMPLETED', '1号楼', '101', '张三', '13800138001', '2024-06-10 09:00:00'),
('WO202406002', 2, '水管漏水', '厨房水龙头下方漏水', '水电维修', 'URGENT', 'PROCESSING', '1号楼', '102', '李四', '13800138002', '2024-06-12 10:00:00'),
('WO202406003', 3, '门锁损坏', '入户门锁无法正常开关', '门窗维修', 'MEDIUM', 'ASSIGNED', '2号楼', '201', '王五', '13800138003', '2024-06-13 14:00:00'),
('WO202406004', 1, '灯泡不亮', '卧室灯泡坏了需要更换', '水电维修', 'LOW', 'PENDING', '1号楼', '101', '张三', '13800138001', NULL);

INSERT INTO visitor_appointment (appointment_no, resident_id, visitor_name, visitor_phone, visitor_count, building_no, room_no, visit_date, visit_time_start, visit_time_end, visit_purpose, status) VALUES
('V202406001', 1, '刘先生', '13700137001', 2, '1号楼', '101', CURRENT_DATE, '14:00', '18:00', '朋友拜访', 'APPROVED'),
('V202406002', 2, '快递员', '13700137002', 1, '1号楼', '102', CURRENT_DATE, '10:00', '12:00', '配送快递', 'PENDING');

INSERT INTO inspection_task (task_no, title, inspection_type, area, plan_date, status, assignee_id) VALUES
('IT202406001', '6月消防安全检查', '消防安全', '全园区', CURRENT_DATE, 'IN_PROGRESS', 2),
('IT202406002', '电梯月度巡检', '电梯安全', '1号楼,2号楼', CURRENT_DATE + 1, 'PENDING', 3);

INSERT INTO contract_risk (risk_no, title, description, risk_type, level, status, affected_objects, person_in_charge, closing_condition, expected_close_date) VALUES
('CR2024001', '住户合同到期未续签', '1号楼102住户合同6月30日到期，尚未续签', '合同到期', 'HIGH', 'PROCESSING', '1号楼102住户李四,合同编号HT20230002', 4, '住户完成合同续签或办理退租手续', '2024-06-30'),
('CR2024002', '维修外包合同即将到期', '电梯维保外包合同7月15日到期', '供应商合同', 'MEDIUM', 'OPEN', '电梯维保服务商XX公司,合同编号HT2024008', 1, '完成新合同签订并生效', '2024-07-15');
