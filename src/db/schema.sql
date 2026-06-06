-- 手术室耗材备包系统 数据库 Schema
-- 设计原则：围绕真实手术室流程，强调台账追踪和批号管理

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========== 基础配置表 ==========

-- 用户表（手术室护士、护士长、设备科、管理员）
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('nurse', 'head_nurse', 'equipment', 'admin')),
    department VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 手术间表
CREATE TABLE operating_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(20) UNIQUE NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    floor VARCHAR(20),
    room_type VARCHAR(50) NOT NULL CHECK (room_type IN ('general', 'orthopedic', 'cardiac', 'neuro', 'obstetric', 'emergency')),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'cleaning')),
    equipment TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 术式表（手术类型字典）
CREATE TABLE surgery_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    department VARCHAR(100) NOT NULL,
    estimated_duration INTEGER NOT NULL,
    default_package_id UUID,
    is_high_risk BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 耗材目录表
CREATE TABLE supply_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_code VARCHAR(50) UNIQUE NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    specification VARCHAR(200),
    unit VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('suture', 'dressing', 'instrument', 'implant', 'disposable', 'medication', 'other')),
    is_high_value BOOLEAN DEFAULT FALSE,
    manufacturer VARCHAR(200),
    supplier VARCHAR(200),
    price DECIMAL(10, 2),
    safety_stock INTEGER DEFAULT 10,
    shelf_life_days INTEGER,
    requires_scan BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 耗材包模板表（对应术式的标准备包）
CREATE TABLE package_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_code VARCHAR(50) UNIQUE NOT NULL,
    template_name VARCHAR(200) NOT NULL,
    surgery_type_id UUID REFERENCES surgery_types(id),
    description TEXT,
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 耗材包模板明细
CREATE TABLE package_template_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES package_templates(id) ON DELETE CASCADE,
    supply_item_id UUID REFERENCES supply_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    is_required BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_id, supply_item_id)
);

-- ========== 库存与批号管理 ==========

-- 耗材批次表（批号管理核心）
CREATE TABLE supply_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_no VARCHAR(100) NOT NULL,
    supply_item_id UUID REFERENCES supply_items(id),
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    unit_price DECIMAL(10, 2),
    manufacture_date DATE,
    expiry_date DATE NOT NULL,
    received_date DATE DEFAULT CURRENT_DATE,
    supplier VARCHAR(200),
    certificate_no VARCHAR(200),
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'normal' CHECK (status IN ('normal', 'expired', 'quarantined', 'depleted')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(batch_no, supply_item_id)
);

-- 库存预警表
CREATE TABLE stock_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supply_item_id UUID REFERENCES supply_items(id),
    alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('low_stock', 'expiring_soon', 'expired')),
    message TEXT NOT NULL,
    threshold_value INTEGER,
    current_value INTEGER,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id)
);

-- ========== 业务流程表 ==========

-- 手术排班表
CREATE TABLE surgery_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_no VARCHAR(50) UNIQUE NOT NULL,
    surgery_type_id UUID REFERENCES surgery_types(id),
    operating_room_id UUID REFERENCES operating_rooms(id),
    patient_name VARCHAR(100) NOT NULL,
    patient_id VARCHAR(50),
    admission_no VARCHAR(50),
    surgeon_name VARCHAR(100) NOT NULL,
    anesthesiologist VARCHAR(100),
    scheduled_start_time TIMESTAMP NOT NULL,
    scheduled_end_time TIMESTAMP NOT NULL,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('emergency', 'urgent', 'normal', 'elective')),
    status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'delayed')),
    package_template_id UUID REFERENCES package_templates(id),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 备包记录表（核心业务表）
CREATE TABLE package_preparations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_no VARCHAR(50) UNIQUE NOT NULL,
    schedule_id UUID REFERENCES surgery_schedules(id),
    surgery_type_id UUID REFERENCES surgery_types(id),
    operating_room_id UUID REFERENCES operating_rooms(id),
    template_id UUID REFERENCES package_templates(id),
    package_name VARCHAR(200) NOT NULL,
    preparer_id UUID REFERENCES users(id),
    preparer_name VARCHAR(100),
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN (
        'draft', 'pending_review', 'reviewed', 'confirmed', 
        'distributed', 'used', 'returned', 'cancelled'
    )),
    prepared_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP,
    distributed_to_room_at TIMESTAMP,
    used_at TIMESTAMP,
    patient_name VARCHAR(100),
    surgeon_name VARCHAR(100),
    scheduled_time TIMESTAMP,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 备包明细（关联具体批号）
CREATE TABLE package_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID REFERENCES package_preparations(id) ON DELETE CASCADE,
    supply_item_id UUID REFERENCES supply_items(id),
    batch_id UUID REFERENCES supply_batches(id),
    batch_no VARCHAR(100),
    quantity_needed INTEGER NOT NULL CHECK (quantity_needed > 0),
    quantity_prepared INTEGER DEFAULT 0 CHECK (quantity_prepared >= 0),
    quantity_used INTEGER DEFAULT 0 CHECK (quantity_used >= 0),
    quantity_returned INTEGER DEFAULT 0 CHECK (quantity_returned >= 0),
    is_high_value BOOLEAN DEFAULT FALSE,
    is_scanned BOOLEAN DEFAULT FALSE,
    scan_code VARCHAR(200),
    scanned_batch_code VARCHAR(200),
    scan_time TIMESTAMP,
    scanned_at TIMESTAMP,
    scanned_by UUID REFERENCES users(id),
    unit_price DECIMAL(10, 2),
    expiry_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'prepared', 'verified', 'used', 'returned', 'missing')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 领用确认记录
CREATE TABLE pickup_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pickup_no VARCHAR(50) UNIQUE NOT NULL,
    package_id UUID REFERENCES package_preparations(id),
    operating_room_id UUID REFERENCES operating_rooms(id),
    picked_up_by UUID REFERENCES users(id),
    picked_up_by_name VARCHAR(100),
    received_by UUID REFERENCES users(id),
    received_by_name VARCHAR(100),
    pickup_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    receive_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'picked_up' CHECK (status IN ('picked_up', 'received', 'returned')),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 退包记录表
CREATE TABLE return_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_no VARCHAR(50) UNIQUE NOT NULL,
    package_id UUID REFERENCES package_preparations(id),
    returned_by UUID REFERENCES users(id),
    returned_by_name VARCHAR(100),
    received_by UUID REFERENCES users(id),
    received_by_name VARCHAR(100),
    return_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    return_reason VARCHAR(200) NOT NULL,
    return_reason_detail TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'checked', 'completed')),
    checked_by UUID REFERENCES users(id),
    checked_at TIMESTAMP,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 退包明细
CREATE TABLE return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID REFERENCES return_records(id) ON DELETE CASCADE,
    package_item_id UUID REFERENCES package_items(id),
    supply_item_id UUID REFERENCES supply_items(id),
    batch_id UUID REFERENCES supply_batches(id),
    quantity_returned INTEGER NOT NULL CHECK (quantity_returned > 0),
    condition VARCHAR(20) DEFAULT 'good' CHECK (condition IN ('good', 'damaged', 'opened', 'contaminated', 'expired')),
    is_restockable BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== 台账与对账 ==========

-- 耗材台账（每一笔出入库都记录）
CREATE TABLE inventory_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ledger_no VARCHAR(50) UNIQUE NOT NULL,
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN (
        'purchase_in', 'prepare_out', 'use_consume', 'return_in', 
        'adjust_in', 'adjust_out', 'discard_out', 'transfer'
    )),
    supply_item_id UUID REFERENCES supply_items(id),
    batch_id UUID REFERENCES supply_batches(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2),
    total_amount DECIMAL(10, 2),
    reference_type VARCHAR(50),
    reference_id UUID,
    reference_no VARCHAR(100),
    operating_room_id UUID REFERENCES operating_rooms(id),
    operator_id UUID REFERENCES users(id),
    operator_name VARCHAR(100),
    remarks TEXT,
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 月度对账表
CREATE TABLE monthly_reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reconciliation_month VARCHAR(7) NOT NULL,
    supply_item_id UUID REFERENCES supply_items(id),
    opening_quantity INTEGER NOT NULL DEFAULT 0,
    opening_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    purchase_in_quantity INTEGER NOT NULL DEFAULT 0,
    purchase_in_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    used_quantity INTEGER NOT NULL DEFAULT 0,
    used_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    returned_quantity INTEGER NOT NULL DEFAULT 0,
    returned_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discarded_quantity INTEGER NOT NULL DEFAULT 0,
    discarded_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    closing_quantity INTEGER NOT NULL DEFAULT 0,
    closing_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    physical_quantity INTEGER,
    variance_quantity INTEGER,
    variance_amount DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'verified', 'adjusted')),
    prepared_by UUID REFERENCES users(id),
    verified_by UUID REFERENCES users(id),
    prepared_at TIMESTAMP,
    verified_at TIMESTAMP,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reconciliation_month, supply_item_id)
);

-- ========== 系统管理表 ==========

-- 通知消息表
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN (
        'stock_alert', 'expiry_alert', 'task_reminder', 'approval_required', 'system'
    )),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    related_type VARCHAR(50),
    related_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 导入导出任务队列
CREATE TABLE import_export_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_type VARCHAR(20) NOT NULL CHECK (task_type IN ('import', 'export')),
    task_name VARCHAR(200) NOT NULL,
    data_type VARCHAR(50) NOT NULL CHECK (data_type IN (
        'supply_items', 'batches', 'schedules', 'ledger', 'reconciliation'
    )),
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_count INTEGER DEFAULT 0,
    processed_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    error_message TEXT,
    result_file_path VARCHAR(500),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- 错误日志表
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_level VARCHAR(20) NOT NULL CHECK (error_level IN ('debug', 'info', 'warning', 'error', 'critical')),
    error_type VARCHAR(100),
    message TEXT NOT NULL,
    stack_trace TEXT,
    user_id UUID REFERENCES users(id),
    request_path VARCHAR(255),
    request_method VARCHAR(10),
    request_params JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 操作审计日志
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== 创建索引 ==========
CREATE INDEX idx_supply_batches_expiry ON supply_batches(expiry_date);
CREATE INDEX idx_supply_batches_item ON supply_batches(supply_item_id);
CREATE INDEX idx_schedules_time ON surgery_schedules(scheduled_start_time, scheduled_end_time);
CREATE INDEX idx_schedules_room ON surgery_schedules(operating_room_id, scheduled_start_time);
CREATE INDEX idx_package_preparations_status ON package_preparations(status);
CREATE INDEX idx_package_preparations_time ON package_preparations(created_at);
CREATE INDEX idx_package_items_package ON package_items(package_id);
CREATE INDEX idx_ledger_time ON inventory_ledger(transaction_time);
CREATE INDEX idx_ledger_item ON inventory_ledger(supply_item_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_error_logs_time ON error_logs(created_at);
CREATE INDEX idx_audit_logs_time ON audit_logs(created_at);

-- ========== 触发器：自动更新时间戳 ==========
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_operating_rooms_updated_at BEFORE UPDATE ON operating_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_surgery_types_updated_at BEFORE UPDATE ON surgery_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supply_items_updated_at BEFORE UPDATE ON supply_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_package_templates_updated_at BEFORE UPDATE ON package_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supply_batches_updated_at BEFORE UPDATE ON supply_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_surgery_schedules_updated_at BEFORE UPDATE ON surgery_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_package_preparations_updated_at BEFORE UPDATE ON package_preparations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_package_items_updated_at BEFORE UPDATE ON package_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_reconciliations_updated_at BEFORE UPDATE ON monthly_reconciliations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== 触发器：自动更新批次状态（过期检测） ==========
CREATE OR REPLACE FUNCTION check_batch_expiry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expiry_date < CURRENT_DATE AND NEW.status = 'normal' THEN
        NEW.status = 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_batch_expiry_trigger BEFORE UPDATE ON supply_batches
    FOR EACH ROW EXECUTE FUNCTION check_batch_expiry();
