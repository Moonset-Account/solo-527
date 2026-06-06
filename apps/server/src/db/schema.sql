-- 社区活动物资借还平台数据库 Schema

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('volunteer_leader', 'warehouse_manager', 'admin')),
    is_frozen BOOLEAN DEFAULT FALSE,
    frozen_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 物资品类表
CREATE TABLE IF NOT EXISTS material_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 物资表（具体单品）
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES material_categories(id),
    name VARCHAR(100) NOT NULL,
    qr_code VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'borrowed', 'damaged', 'repairing', 'scrapped')),
    condition VARCHAR(20) NOT NULL DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
    purchase_date DATE,
    purchase_price DECIMAL(10, 2),
    location VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. 活动表
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    activity_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(200) NOT NULL,
    leader_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. 借用申请表
CREATE TABLE IF NOT EXISTS borrow_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id),
    applicant_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
    expected_borrow_date DATE NOT NULL,
    expected_return_date DATE NOT NULL,
    actual_borrow_date DATE,
    actual_return_date DATE,
    warehouse_manager_id UUID REFERENCES users(id),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. 借用明细
CREATE TABLE IF NOT EXISTS borrow_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES borrow_applications(id),
    material_id UUID NOT NULL REFERENCES materials(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'borrowed', 'returned', 'damaged', 'lost')),
    borrow_condition VARCHAR(20) CHECK (borrow_condition IN ('excellent', 'good', 'fair', 'poor')),
    return_condition VARCHAR(20) CHECK (return_condition IN ('excellent', 'good', 'fair', 'poor')),
    damage_description TEXT,
    missing_parts TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(application_id, material_id)
);

-- 7. 库存预占表（用于防止重叠借出）
CREATE TABLE IF NOT EXISTS inventory_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES materials(id),
    application_id UUID NOT NULL REFERENCES borrow_applications(id),
    reserve_start_date DATE NOT NULL,
    reserve_end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id)
);

-- 8. 赔付单表
CREATE TABLE IF NOT EXISTS compensation_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    borrow_item_id UUID NOT NULL REFERENCES borrow_items(id),
    application_id UUID NOT NULL REFERENCES borrow_applications(id),
    applicant_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'waived', 'processing')),
    handled_by UUID REFERENCES users(id),
    handled_at TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. 通知表（带重试机制）
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 5,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE
);

-- 10. 审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. 人工补录记录表
CREATE TABLE IF NOT EXISTS manual_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('borrow', 'return', 'material', 'compensation')),
    entity_id UUID,
    entered_by UUID NOT NULL REFERENCES users(id),
    entry_reason TEXT NOT NULL,
    entry_details JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(status);
CREATE INDEX IF NOT EXISTS idx_materials_qr_code ON materials(qr_code);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_borrow_applications_dates ON borrow_applications(expected_borrow_date, expected_return_date);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_material ON inventory_reservations(material_id, is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_dates ON inventory_reservations(reserve_start_date, reserve_end_date);
CREATE INDEX IF NOT EXISTS idx_compensation_orders_status ON compensation_orders(status);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_manual_entries_created ON manual_entries(created_at DESC);
