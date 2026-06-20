-- 装修线索客户画像库数据库脚本

-- 创建枚举类型
CREATE TYPE user_role AS ENUM ('ADMIN', 'SALES', 'DESIGNER', 'MANAGER');
CREATE TYPE lead_status AS ENUM ('NEW', 'CONTACTED', 'MEASURED', 'QUOTED', 'NEGOTIATING', 'DEAL', 'LOST');
CREATE TYPE lead_level AS ENUM ('S', 'A', 'B', 'C', 'D');
CREATE TYPE follow_up_status AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE');
CREATE TYPE public_sea_status AS ENUM ('IN_SEA', 'CLAIMED', 'TRANSFERRED');

-- 用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    real_name VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'SALES',
    department VARCHAR(100),
    status BOOLEAN NOT NULL DEFAULT true,
    avatar VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 标签表
CREATE TABLE IF NOT EXISTS lead_tag (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20) DEFAULT '#1890ff',
    category VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 线索客户表
CREATE TABLE IF NOT EXISTS lead_customer (
    id BIGSERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    gender VARCHAR(10),
    age INTEGER,
    address VARCHAR(255),
    community VARCHAR(100),
    house_type VARCHAR(50),
    house_area DECIMAL(10,2),
    budget_min DECIMAL(12,2),
    budget_max DECIMAL(12,2),
    decoration_style VARCHAR(50),
    decoration_type VARCHAR(50),
    move_in_date DATE,
    source VARCHAR(50),
    status lead_status NOT NULL DEFAULT 'NEW',
    level lead_level NOT NULL DEFAULT 'C',
    owner_id BIGINT,
    public_sea_status public_sea_status DEFAULT 'IN_SEA',
    public_sea_in_time TIMESTAMP,
    lost_reason_id BIGINT,
    lost_remark TEXT,
    lost_time TIMESTAMP,
    remark TEXT,
    next_follow_time TIMESTAMP,
    total_follow_count INTEGER DEFAULT 0,
    last_follow_time TIMESTAMP,
    measure_date TIMESTAMP,
    measure_designer_id BIGINT,
    measure_remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES sys_user(id),
    FOREIGN KEY (measure_designer_id) REFERENCES sys_user(id)
);

-- 线索-标签关联表
CREATE TABLE IF NOT EXISTS lead_tag_rel (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES lead_customer(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES lead_tag(id) ON DELETE CASCADE,
    UNIQUE(lead_id, tag_id)
);

-- 报价版本表
CREATE TABLE IF NOT EXISTS quotation_version (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    version_no VARCHAR(20) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    design_fee DECIMAL(12,2),
    material_fee DECIMAL(12,2),
    labor_fee DECIMAL(12,2),
    other_fee DECIMAL(12,2),
    discount DECIMAL(5,2),
    final_price DECIMAL(12,2),
    payment_method VARCHAR(50),
    construction_period INTEGER,
    remark TEXT,
    created_by BIGINT,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES lead_customer(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES sys_user(id)
);

-- 流失原因表
CREATE TABLE IF NOT EXISTS lost_reason (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 公海规则表
CREATE TABLE IF NOT EXISTS public_sea_rule (
    id BIGSERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50),
    days_before_public INTEGER NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 附件表
CREATE TABLE IF NOT EXISTS lead_attachment (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),
    category VARCHAR(50),
    uploaded_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES lead_customer(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES sys_user(id)
);

-- 备注表
CREATE TABLE IF NOT EXISTS lead_remark (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES lead_customer(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES sys_user(id)
);

-- 修改历史表
CREATE TABLE IF NOT EXISTS lead_change_log (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by BIGINT,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    change_type VARCHAR(20),
    FOREIGN KEY (lead_id) REFERENCES lead_customer(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES sys_user(id)
);

-- 跟进记录表
CREATE TABLE IF NOT EXISTS follow_up_record (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    follow_type VARCHAR(50),
    content TEXT NOT NULL,
    next_follow_time TIMESTAMP,
    follow_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    follow_by BIGINT,
    status follow_up_status DEFAULT 'PENDING',
    duration_minutes INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES lead_customer(id) ON DELETE CASCADE,
    FOREIGN KEY (follow_by) REFERENCES sys_user(id)
);

-- 异常记录表
CREATE TABLE IF NOT EXISTS exception_record (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    exception_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    overdue_reason TEXT,
    handling_cost_minutes INTEGER,
    responsible_id BIGINT,
    handler_id BIGINT,
    status VARCHAR(20) DEFAULT 'PENDING',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES lead_customer(id) ON DELETE CASCADE,
    FOREIGN KEY (responsible_id) REFERENCES sys_user(id),
    FOREIGN KEY (handler_id) REFERENCES sys_user(id)
);

-- 销售漏斗阶段配置
CREATE TABLE IF NOT EXISTS funnel_stage (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL,
    color VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_lead_customer_status ON lead_customer(status);
CREATE INDEX IF NOT EXISTS idx_lead_customer_level ON lead_customer(level);
CREATE INDEX IF NOT EXISTS idx_lead_customer_owner ON lead_customer(owner_id);
CREATE INDEX IF NOT EXISTS idx_lead_customer_public_sea ON lead_customer(public_sea_status);
CREATE INDEX IF NOT EXISTS idx_lead_customer_source ON lead_customer(source);
CREATE INDEX IF NOT EXISTS idx_lead_tag_rel_lead ON lead_tag_rel(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotation_version_lead ON quotation_version(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_lead ON follow_up_record(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_status ON follow_up_record(status);
CREATE INDEX IF NOT EXISTS idx_exception_lead ON exception_record(lead_id);
CREATE INDEX IF NOT EXISTS idx_exception_status ON exception_record(status);
CREATE INDEX IF NOT EXISTS idx_attachment_lead ON lead_attachment(lead_id);
CREATE INDEX IF NOT EXISTS idx_remark_lead ON lead_remark(lead_id);
CREATE INDEX IF NOT EXISTS idx_change_log_lead ON lead_change_log(lead_id);

-- 插入初始数据
INSERT INTO sys_user (username, password, real_name, role, status) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '系统管理员', 'ADMIN', true),
('sales1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '销售张三', 'SALES', true),
('sales2', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '销售李四', 'SALES', true),
('designer1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '设计师王五', 'DESIGNER', true),
('manager1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '经理赵六', 'MANAGER', true);

INSERT INTO lead_tag (name, color, category, sort_order) VALUES
('高意向', '#f5222d', '意向等级', 1),
('中意向', '#faad14', '意向等级', 2),
('低意向', '#52c41a', '意向等级', 3),
('全款', '#1890ff', '付款方式', 1),
('贷款', '#722ed1', '付款方式', 2),
('婚房', '#eb2f96', '用途', 1),
('改善住房', '#13c2c2', '用途', 2),
('投资', '#fa8c16', '用途', 3),
('推荐客户', '#52c41a', '来源', 1),
('自然到访', '#1890ff', '来源', 2),
('网络咨询', '#722ed1', '来源', 3);

INSERT INTO lost_reason (name, category, sort_order, enabled) VALUES
('价格太高', '价格因素', 1, true),
('预算不足', '价格因素', 2, true),
('选择其他公司', '竞争因素', 3, true),
('暂时不装修', '时间因素', 4, true),
('对设计不满意', '服务因素', 5, true),
('对施工质量有疑虑', '服务因素', 6, true),
('家人意见不统一', '客户因素', 7, true),
('其他原因', '其他', 99, true);

INSERT INTO public_sea_rule (rule_name, rule_type, days_before_public, description, enabled) VALUES
('新线索3天未跟进进入公海', 'NEW_LEAD', 3, '新创建的线索3天内未进行任何跟进操作，自动进入公海', true),
('跟进超过7天未更新进入公海', 'FOLLOW_UP', 7, '已有跟进记录但超过7天未更新下次跟进时间，自动进入公海', true),
('报价后15天未成交进入公海', 'QUOTATION', 15, '已报价但15天内未进入谈判阶段，自动进入公海', true),
('量房后10天未报价进入公海', 'MEASURE', 10, '已量房但10天内未生成报价，自动进入公海', true);

INSERT INTO funnel_stage (name, code, sort_order, color) VALUES
('新线索', 'NEW', 1, '#1890ff'),
('已接触', 'CONTACTED', 2, '#13c2c2'),
('已量房', 'MEASURED', 3, '#52c41a'),
('已报价', 'QUOTED', 4, '#faad14'),
('谈判中', 'NEGOTIATING', 5, '#722ed1'),
('已成交', 'DEAL', 6, '#f5222d');
