-- ============================================
-- 联合办公房源管理系统数据库初始化脚本
-- PostgreSQL 14+
-- ============================================

-- 启用 pgcrypto 扩展以支持 gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. users 表
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. properties 表
-- ============================================
CREATE TYPE property_type AS ENUM ('private_office', 'hot_desk', 'meeting_room', 'long_term');
CREATE TYPE property_status AS ENUM ('vacant', 'rented', 'maintenance', 'closed');

CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    type property_type NOT NULL,
    area DECIMAL(10,2),
    capacity INTEGER,
    floor VARCHAR(255),
    building VARCHAR(255),
    status property_status NOT NULL DEFAULT 'vacant',
    base_price DECIMAL(12,2),
    description TEXT,
    close_reason TEXT,
    source VARCHAR(255),
    source_remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type ON properties(type);

-- ============================================
-- 3. leases 表
-- ============================================
CREATE TYPE lease_status AS ENUM ('active', 'expired', 'terminated');

CREATE TABLE leases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_no VARCHAR(255) NOT NULL UNIQUE,
    property_id UUID NOT NULL REFERENCES properties(id),
    tenant_name VARCHAR(255) NOT NULL,
    tenant_contact VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent DECIMAL(12,2) NOT NULL,
    deposit_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status lease_status NOT NULL DEFAULT 'active',
    remarks TEXT,
    source VARCHAR(255),
    source_remark TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leases_status ON leases(status);
CREATE INDEX idx_leases_property_id ON leases(property_id);
CREATE INDEX idx_leases_start_date ON leases(start_date);

-- ============================================
-- 4. bills 表
-- ============================================
CREATE TYPE bill_type AS ENUM ('rent', 'deposit', 'service', 'other');
CREATE TYPE bill_status AS ENUM ('unpaid', 'paid', 'partial', 'void');

CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_no VARCHAR(255) NOT NULL UNIQUE,
    lease_id UUID NOT NULL REFERENCES leases(id),
    type bill_type NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE,
    status bill_status NOT NULL DEFAULT 'unpaid',
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    paid_date DATE,
    reconciled BOOLEAN NOT NULL DEFAULT false,
    reconciled_at TIMESTAMP,
    reconciled_by UUID REFERENCES users(id),
    source VARCHAR(255),
    source_remark TEXT,
    remarks TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_lease_id ON bills(lease_id);
CREATE INDEX idx_bills_reconciled ON bills(reconciled);
CREATE INDEX idx_bills_bill_date ON bills(bill_date);

-- ============================================
-- 5. deposits 表
-- ============================================
CREATE TYPE deposit_type AS ENUM ('received', 'refunded', 'deducted');
CREATE TYPE deposit_status AS ENUM ('active', 'refunded', 'deducted');

CREATE TABLE deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deposit_no VARCHAR(255) NOT NULL UNIQUE,
    lease_id UUID NOT NULL REFERENCES leases(id),
    amount DECIMAL(12,2) NOT NULL,
    type deposit_type NOT NULL,
    status deposit_status NOT NULL DEFAULT 'active',
    receive_date DATE,
    refund_date DATE,
    source VARCHAR(255),
    source_remark TEXT,
    remarks TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_deposits_lease_id ON deposits(lease_id);

-- ============================================
-- 6. pricing 表
-- ============================================
CREATE TYPE price_type AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

CREATE TABLE pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id),
    name VARCHAR(255) NOT NULL,
    price_type price_type NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT false,
    effective_date DATE,
    expiry_date DATE,
    source VARCHAR(255),
    source_remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_property_id ON pricing(property_id);
CREATE INDEX idx_pricing_is_current ON pricing(is_current);

-- ============================================
-- 7. room_status_logs 表
-- ============================================
CREATE TABLE room_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id),
    old_status property_status,
    new_status property_status NOT NULL,
    reason TEXT,
    operator_id UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_room_status_logs_property_id ON room_status_logs(property_id);
CREATE INDEX idx_room_status_logs_created_at ON room_status_logs(created_at);

-- ============================================
-- 8. tickets 表
-- ============================================
CREATE TYPE ticket_type AS ENUM ('repair', 'complaint', 'other');
CREATE TYPE ticket_status AS ENUM ('pending', 'processing', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_no VARCHAR(255) NOT NULL UNIQUE,
    type ticket_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ticket_status NOT NULL DEFAULT 'pending',
    priority ticket_priority NOT NULL DEFAULT 'medium',
    property_id UUID REFERENCES properties(id),
    reporter_name VARCHAR(255),
    reporter_contact VARCHAR(255),
    assignee_id UUID REFERENCES users(id),
    source VARCHAR(255),
    source_remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_type ON tickets(type);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_property_id ON tickets(property_id);

-- ============================================
-- 9. ticket_logs 表
-- ============================================
CREATE TABLE ticket_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    old_status ticket_status,
    new_status ticket_status NOT NULL,
    action VARCHAR(255) NOT NULL,
    remark TEXT,
    operator_id UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ticket_logs_ticket_id ON ticket_logs(ticket_id);
CREATE INDEX idx_ticket_logs_created_at ON ticket_logs(created_at);

-- ============================================
-- 10. audit_logs 表
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(255) NOT NULL,
    entity_id UUID,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(255),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- 测试数据
-- ============================================

-- 用户数据（密码 123456 的 bcrypt 哈希）
INSERT INTO users (id, username, email, password, name) VALUES
('a1b2c3d4-0001-4000-8000-000000000001', 'admin', 'admin@example.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '系统管理员'),
('a1b2c3d4-0002-4000-8000-000000000002', 'finance', 'finance@example.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '财务专员'),
('a1b2c3d4-0003-4000-8000-000000000003', 'auditor', 'auditor@example.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '审计员');

-- 房源数据
INSERT INTO properties (id, code, name, type, area, capacity, floor, building, status, base_price, description, source, source_remark) VALUES
('60000001-0000-4000-8000-000000000001', 'PO-A-101', '独立办公室 A101', 'private_office', 35.5, 4, '1F', 'A座', 'rented', 8000.00, '朝南，采光好，配备独立卫生间', '销售部-张三', '2024年1月新签客户'),
('60000002-0000-4000-8000-000000000002', 'PO-A-102', '独立办公室 A102', 'private_office', 28.0, 3, '1F', 'A座', 'vacant', 6500.00, '朝北，安静，适合小型团队', '运营部-李四', '刚退租，正在清洁'),
('60000003-0000-4000-8000-000000000003', 'HD-B-201', '开放工位 B201', 'hot_desk', 5.0, 1, '2F', 'B座', 'rented', 1500.00, '开放区域，灵活办公', '销售部-王五', null),
('60000004-0000-4000-8000-000000000004', 'HD-B-202', '开放工位 B202', 'hot_desk', 5.0, 1, '2F', 'B座', 'vacant', 1500.00, '开放区域，灵活办公', '销售部-王五', null),
('60000005-0000-4000-8000-000000000005', 'MR-C-301', '会议室 C301', 'meeting_room', 50.0, 20, '3F', 'C座', 'vacant', 500.00, '可容纳20人，配备投影仪和视频会议系统', '行政部-赵六', '新装修完成'),
('60000006-0000-4000-8000-000000000006', 'MR-C-302', '会议室 C302', 'meeting_room', 30.0, 10, '3F', 'C座', 'maintenance', 300.00, '可容纳10人，白板齐全', '行政部-赵六', '空调维修中'),
('60000007-0000-4000-8000-000000000007', 'LT-D-501', '长租公寓 D501', 'long_term', 45.0, 2, '5F', 'D座', 'rented', 4500.00, '一室一厅，独立厨卫', '长租部-孙七', '2023年签约，租期2年'),
('60000008-0000-4000-8000-000000000008', 'LT-D-502', '长租公寓 D502', 'long_term', 55.0, 3, '5F', 'D座', 'closed', 5500.00, '两室一厅，独立厨卫', '长租部-孙七', '合同到期不再续租'),
('60000009-0000-4000-8000-000000000009', 'PO-A-103', '独立办公室 A103', 'private_office', 42.0, 6, '1F', 'A座', 'rented', 10000.00, '朝南，采光极佳，双开门', '销售部-张三', '2024年2月新签'),
('60000010-0000-4000-8000-000000000010', 'HD-B-203', '开放工位 B203', 'hot_desk', 5.0, 1, '2F', 'B座', 'rented', 1500.00, '靠近茶水间，交通便利', '销售部-王五', null);

UPDATE properties SET close_reason = '合同到期，租客不再续租，房间需要整体翻新' WHERE id = '60000008-0000-4000-8000-000000000008';

-- 租约数据
INSERT INTO leases (id, lease_no, property_id, tenant_name, tenant_contact, start_date, end_date, monthly_rent, deposit_amount, status, remarks, source, source_remark, created_by) VALUES
('10000001-0000-4000-8000-000000000001', 'L202401001', '60000001-0000-4000-8000-000000000001', '科技创新有限公司', '13800138001', '2024-01-15', '2025-01-14', 8000.00, 16000.00, 'active', '首租优惠一个月', '销售部-张三', '客户来源：官网咨询', 'a1b2c3d4-0002-4000-8000-000000000002'),
('10000002-0000-4000-8000-000000000002', 'L202401002', '60000003-0000-4000-8000-000000000003', '自由职业者-李小明', '13800138002', '2024-01-01', '2024-12-31', 1500.00, 1500.00, 'active', '按年付费，已付全年', '销售部-王五', '客户来源：朋友推荐', 'a1b2c3d4-0002-4000-8000-000000000002'),
('10000003-0000-4000-8000-000000000003', 'L202306001', '60000007-0000-4000-8000-000000000007', '张先生', '13800138003', '2023-06-15', '2025-06-14', 4500.00, 9000.00, 'active', '长租公寓，半年付', '长租部-孙七', '客户来源：58同城', 'a1b2c3d4-0002-4000-8000-000000000002'),
('10000004-0000-4000-8000-000000000004', 'L202402001', '60000009-0000-4000-8000-000000000009', '数据科技股份公司', '13800138004', '2024-02-01', '2025-01-31', 10000.00, 20000.00, 'active', '上市企业，季度付费', '销售部-张三', '客户来源：渠道合作', 'a1b2c3d4-0002-4000-8000-000000000002'),
('10000005-0000-4000-8000-000000000005', 'L202401003', '60000010-0000-4000-8000-000000000010', '创意工作室-王芳', '13800138005', '2024-01-10', '2024-06-09', 1500.00, 1500.00, 'expired', '半年租期已结束', '销售部-王五', '客户来源：线下活动', 'a1b2c3d4-0002-4000-8000-000000000002');

-- 账单数据
INSERT INTO bills (id, bill_no, lease_id, type, amount, bill_date, due_date, status, paid_amount, paid_date, reconciled, reconciled_at, reconciled_by, source, source_remark, remarks) VALUES
('20000001-0000-4000-8000-000000000001', 'B202406001', '10000001-0000-4000-8000-000000000001', 'rent', 8000.00, '2024-06-01', '2024-06-10', 'paid', 8000.00, '2024-06-08', true, '2024-06-08 10:30:00', 'a1b2c3d4-0002-4000-8000-000000000002', '银行转账', '招商银行尾号1234', '6月份租金'),
('20000002-0000-4000-8000-000000000002', 'B202406002', '10000002-0000-4000-8000-000000000002', 'rent', 1500.00, '2024-06-01', '2024-06-10', 'paid', 1500.00, '2024-06-05', true, '2024-06-05 14:20:00', 'a1b2c3d4-0002-4000-8000-000000000002', '支付宝', '个人支付', '6月份工位费（已年付，按月出账）'),
('20000003-0000-4000-8000-000000000003', 'B202406003', '10000003-0000-4000-8000-000000000003', 'rent', 4500.00, '2024-06-01', '2024-06-15', 'unpaid', 0.00, null, false, null, null, '银行转账', null, '6月份房租，半年付周期'),
('20000004-0000-4000-8000-000000000004', 'B202406004', '10000004-0000-4000-8000-000000000004', 'rent', 10000.00, '2024-06-01', '2024-06-20', 'partial', 5000.00, '2024-06-15', false, null, null, '银行转账', '工商银行尾号5678', '6月份租金，先付一半'),
('20000005-0000-4000-8000-000000000005', 'B202406005', '10000001-0000-4000-8000-000000000001', 'service', 500.00, '2024-06-10', '2024-06-20', 'paid', 500.00, '2024-06-12', true, '2024-06-12 09:15:00', 'a1b2c3d4-0002-4000-8000-000000000002', '微信支付', '前台扫码', '月度清洁服务费'),
('20000006-0000-4000-8000-000000000006', 'B202405001', '10000001-0000-4000-8000-000000000001', 'rent', 8000.00, '2024-05-01', '2024-05-10', 'paid', 8000.00, '2024-05-08', true, '2024-05-08 11:00:00', 'a1b2c3d4-0003-4000-8000-000000000003', '银行转账', '招商银行尾号1234', '5月份租金（已审计）'),
('20000007-0000-4000-8000-000000000007', 'B202405002', '10000004-0000-4000-8000-000000000004', 'rent', 10000.00, '2024-05-01', '2024-05-20', 'paid', 10000.00, '2024-05-18', true, '2024-05-18 15:45:00', 'a1b2c3d4-0003-4000-8000-000000000003', '银行转账', '工商银行尾号5678', '5月份租金（已审计）'),
('20000008-0000-4000-8000-000000000008', 'B202406006', '10000001-0000-4000-8000-000000000001', 'deposit', 16000.00, '2024-01-15', null, 'paid', 16000.00, '2024-01-15', true, '2024-01-15 16:00:00', 'a1b2c3d4-0002-4000-8000-000000000002', '银行转账', '招商银行尾号1234', '两个月租金作为押金'),
('20000009-0000-4000-8000-000000000009', 'B202406007', '10000002-0000-4000-8000-000000000002', 'other', 100.00, '2024-06-15', '2024-06-25', 'unpaid', 0.00, null, false, null, null, '手工记账', null, '打印复印费用'),
('20000010-0000-4000-8000-000000000010', 'B202406008', '10000004-0000-4000-8000-000000000004', 'service', 800.00, '2024-06-01', '2024-06-20', 'paid', 800.00, '2024-06-10', true, '2024-06-10 10:00:00', 'a1b2c3d4-0002-4000-8000-000000000002', '银行转账', '工商银行尾号5678', '季度物业管理费');

-- 押金数据
INSERT INTO deposits (id, deposit_no, lease_id, amount, type, status, receive_date, source, source_remark, remarks) VALUES
('30000001-0000-4000-8000-000000000001', 'D202401001', '10000001-0000-4000-8000-000000000001', 16000.00, 'received', 'active', '2024-01-15', '银行转账', '招商银行尾号1234', '两个月租金押金，合同到期退还'),
('30000002-0000-4000-8000-000000000002', 'D202401002', '10000002-0000-4000-8000-000000000002', 1500.00, 'received', 'active', '2024-01-01', '支付宝', '个人支付', '一个月工位费押金'),
('30000003-0000-4000-8000-000000000003', 'D202306001', '10000003-0000-4000-8000-000000000003', 9000.00, 'received', 'active', '2023-06-15', '银行转账', '建设银行尾号9012', '两个月房租押金'),
('30000004-0000-4000-8000-000000000004', 'D202402001', '10000004-0000-4000-8000-000000000004', 20000.00, 'received', 'active', '2024-02-01', '银行转账', '工商银行尾号5678', '两个月租金押金'),
('30000005-0000-4000-8000-000000000005', 'D202401003', '10000005-0000-4000-8000-000000000005', 1500.00, 'refunded', 'refunded', '2024-01-10', '微信支付', '个人支付', '租期结束，全额退还，无损坏');

UPDATE deposits SET refund_date = '2024-06-10' WHERE id = '30000005-0000-4000-8000-000000000005';

-- 价格方案数据
INSERT INTO pricing (id, property_id, name, price_type, price, is_current, effective_date, source, source_remark) VALUES
('40000001-0000-4000-8000-000000000001', '60000001-0000-4000-8000-000000000001', '2024年标准价', 'monthly', 8000.00, true, '2024-01-01', '运营部-李四', '年度价格调整后的标准价格'),
('40000002-0000-4000-8000-000000000002', '60000002-0000-4000-8000-000000000002', '2024年促销价', 'monthly', 6500.00, true, '2024-03-01', '销售部-张三', '空置超过1个月，促销优惠'),
('40000003-0000-4000-8000-000000000003', '60000003-0000-4000-8000-000000000003', '灵活工位标准价', 'monthly', 1500.00, true, '2024-01-01', '运营部-李四', '2024年标准价格'),
('pr0000004-0000-4000-8000-000000000004', '60000005-0000-4000-8000-000000000005', '大会议室日租价', 'daily', 500.00, true, '2024-01-01', '行政部-赵六', '按天收费价格'),
('pr0000005-0000-4000-8000-000000000005', '60000007-0000-4000-8000-000000000007', '长租公寓月租价', 'monthly', 4500.00, true, '2023-06-01', '长租部-孙七', '2023年签约时的价格');

-- 工单数据
INSERT INTO tickets (id, ticket_no, type, title, description, status, priority, property_id, reporter_name, reporter_contact, assignee_id, source, source_remark) VALUES
('50000001-0000-4000-8000-000000000001', 'TK202406001', 'repair', '空调不制冷', 'A101办公室空调出风口温度偏高，无法制冷，需要维修。', 'processing', 'high', '60000001-0000-4000-8000-000000000001', '刘经理', '13800138001', 'a1b2c3d4-0001-4000-8000-000000000001', '客户报修', '客户电话报修至前台'),
('50000002-0000-4000-8000-000000000002', 'TK202406002', 'complaint', '楼道噪音太大', '2楼开放工位区域，最近一周下午经常有装修噪音，影响正常办公。', 'pending', 'medium', '60000003-0000-4000-8000-000000000003', '李小明', '13800138002', null, '客户投诉', '客户通过APP提交'),
('50000003-0000-4000-8000-000000000003', 'TK202406003', 'repair', '门锁故障', 'C302会议室电子门锁无法刷卡打开，多次尝试均失败。', 'resolved', 'high', '60000006-0000-4000-8000-000000000006', '行政部小王', '13800138006', 'a1b2c3d4-0001-4000-8000-000000000001', '内部报修', '行政部巡检时发现'),
('50000004-0000-4000-8000-000000000004', 'TK202405001', 'other', '客户咨询续租政策', '客户咨询租约到期后的续租价格和优惠政策。', 'closed', 'low', null, '张总', '13800138004', 'a1b2c3d4-0001-4000-8000-000000000001', '客户咨询', '已通过邮件正式回复'),
('50000005-0000-4000-8000-000000000005', 'TK202406004', 'repair', '投影仪无法开机', 'C301会议室投影仪按下电源键无反应，检查电源线正常。', 'pending', 'urgent', '60000005-0000-4000-8000-000000000005', '行政部小赵', '13800138007', null, '内部报修', '明天有重要客户会议，急需处理');

INSERT INTO ticket_logs (ticket_id, old_status, new_status, action, remark, operator_id) VALUES
('50000001-0000-4000-8000-000000000001', 'pending', 'processing', '分配处理人', '已分配给物业张师傅处理，预计今日上门', 'a1b2c3d4-0001-4000-8000-000000000001'),
('50000003-0000-4000-8000-000000000003', 'pending', 'processing', '分配处理人', '已联系门锁厂商上门维修', 'a1b2c3d4-0001-4000-8000-000000000001'),
('50000003-0000-4000-8000-000000000003', 'processing', 'resolved', '完成维修', '更换了门锁电池，已恢复正常使用', 'a1b2c3d4-0001-4000-8000-000000000001'),
('50000004-0000-4000-8000-000000000004', 'pending', 'processing', '开始处理', '已查询最新续租政策，准备回复客户', 'a1b2c3d4-0001-4000-8000-000000000001'),
('50000004-0000-4000-8000-000000000004', 'processing', 'closed', '关闭工单', '已发送详细的续租方案邮件，客户确认满意', 'a1b2c3d4-0001-4000-8000-000000000001');

-- ============================================
-- 数据统计
-- ============================================
SELECT '用户' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT '房源', COUNT(*) FROM properties
UNION ALL
SELECT '租约', COUNT(*) FROM leases
UNION ALL
SELECT '账单', COUNT(*) FROM bills
UNION ALL
SELECT '押金', COUNT(*) FROM deposits
UNION ALL
SELECT '价格方案', COUNT(*) FROM pricing
UNION ALL
SELECT '工单', COUNT(*) FROM tickets;
