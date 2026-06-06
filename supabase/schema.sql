-- 艺术馆展品借展管理系统数据模型
-- 创建时间: 2024

-- 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============ 枚举类型 ============
CREATE TYPE user_role AS ENUM ('admin', 'curator', 'registrar', 'conservator', 'logistics', 'finance', 'viewer');
CREATE TYPE exhibit_status AS ENUM ('in_collection', 'on_loan', 'in_transit', 'in_installation', 'in_deinstallation', 'under_conservation', 'retired');
CREATE TYPE loan_status AS ENUM ('draft', 'pending_review', 'qualified', 'inventory_verified', 'schedule_confirmed', 'awaiting_confirmation', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected');
CREATE TYPE insurance_status AS ENUM ('draft', 'submitted', 'verified', 'expired', 'cancelled');
CREATE TYPE condition_report_status AS ENUM ('draft', 'pending_confirmation', 'confirmed', 'disputed');
CREATE TYPE transport_status AS ENUM ('preparing', 'in_transit', 'delivered', 'received', 'returned');
CREATE TYPE location_type AS ENUM ('gallery', 'storage', 'conservation_lab', 'loading_dock', 'off_site');
CREATE TYPE notification_type AS ENUM ('system', 'loan_status', 'condition_report', 'transport', 'insurance', 'reconciliation');
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE job_type AS ENUM ('import', 'export');

-- ============ 用户资料表 ============
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    department TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 布展位置表 ============
CREATE TABLE exhibition_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type location_type NOT NULL DEFAULT 'gallery',
    floor TEXT,
    area TEXT,
    description TEXT,
    max_exhibits INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 借展机构表 ============
CREATE TABLE borrowing_institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT,
    address TEXT,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    qualification_certificates TEXT[],
    is_qualified BOOLEAN DEFAULT false,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 展品表 ============
CREATE TABLE exhibits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    accession_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    artist TEXT,
    creation_date TEXT,
    medium TEXT,
    dimensions TEXT,
    weight_kg DECIMAL(10,2),
    description TEXT,
    provenance TEXT,
    status exhibit_status NOT NULL DEFAULT 'in_collection',
    current_location_id UUID REFERENCES exhibition_locations(id),
    estimated_value DECIMAL(15,2),
    currency TEXT DEFAULT 'CNY',
    images TEXT[],
    condition_notes TEXT,
    special_handling TEXT,
    crate_id UUID,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 借展合同表 ============
CREATE TABLE loan_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    borrowing_institution_id UUID NOT NULL REFERENCES borrowing_institutions(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    purpose TEXT,
    terms_and_conditions TEXT,
    fee_amount DECIMAL(15,2),
    currency TEXT DEFAULT 'CNY',
    payment_terms TEXT,
    signed_by_institution BOOLEAN DEFAULT false,
    signed_by_museum BOOLEAN DEFAULT false,
    signed_at TIMESTAMPTZ,
    contract_file_url TEXT,
    status loan_status NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 借展申请表（合同关联展品） ============
CREATE TABLE loan_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES loan_contracts(id) ON DELETE CASCADE,
    exhibit_id UUID NOT NULL REFERENCES exhibits(id),
    requested_start_date DATE NOT NULL,
    requested_end_date DATE NOT NULL,
    actual_start_date DATE,
    actual_end_date DATE,
    display_location TEXT,
    qualification_check_passed BOOLEAN,
    inventory_check_passed BOOLEAN,
    schedule_check_passed BOOLEAN,
    manual_confirmed_by UUID REFERENCES profiles(id),
    manual_confirmed_at TIMESTAMPTZ,
    notes TEXT,
    status loan_status NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(contract_id, exhibit_id)
);

-- ============ 保险单表 ============
CREATE TABLE insurance_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_number TEXT UNIQUE NOT NULL,
    insurance_company TEXT NOT NULL,
    application_id UUID REFERENCES loan_applications(id),
    exhibit_id UUID NOT NULL REFERENCES exhibits(id),
    coverage_amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'CNY',
    coverage_start_date TIMESTAMPTZ NOT NULL,
    coverage_end_date TIMESTAMPTZ NOT NULL,
    policy_type TEXT,
    coverage_details TEXT,
    premium_amount DECIMAL(15,2),
    policy_file_url TEXT,
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    status insurance_status NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 运输箱表 ============
CREATE TABLE shipping_crates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crate_number TEXT UNIQUE NOT NULL,
    name TEXT,
    dimensions TEXT,
    max_weight_kg DECIMAL(10,2),
    material TEXT,
    climate_control BOOLEAN DEFAULT false,
    shock_sensors BOOLEAN DEFAULT false,
    current_status TEXT DEFAULT 'available',
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 状况报告表 ============
CREATE TABLE condition_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_number TEXT UNIQUE NOT NULL,
    exhibit_id UUID NOT NULL REFERENCES exhibits(id),
    application_id UUID REFERENCES loan_applications(id),
    report_type TEXT NOT NULL,
    report_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    overall_condition TEXT NOT NULL,
    condition_details TEXT,
    previous_damage TEXT,
    new_damage TEXT,
    treatment_recommendations TEXT,
    images TEXT[],
    prepared_by UUID REFERENCES profiles(id),
    confirmed_by UUID REFERENCES profiles(id),
    confirmed_at TIMESTAMPTZ,
    status condition_report_status NOT NULL DEFAULT 'draft',
    signature_data_sender TEXT,
    signature_data_receiver TEXT,
    signed_by_sender_at TIMESTAMPTZ,
    signed_by_receiver_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 运输交接表 ============
CREATE TABLE transport_handovers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handover_number TEXT UNIQUE NOT NULL,
    application_id UUID NOT NULL REFERENCES loan_applications(id),
    crate_id UUID REFERENCES shipping_crates(id),
    transport_type TEXT,
    carrier_name TEXT,
    tracking_number TEXT,
    departure_location TEXT,
    destination_location TEXT,
    planned_departure TIMESTAMPTZ,
    actual_departure TIMESTAMPTZ,
    planned_arrival TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    sender_signature TEXT,
    sender_signed_by UUID REFERENCES profiles(id),
    sender_signed_at TIMESTAMPTZ,
    receiver_signature TEXT,
    receiver_signed_by UUID REFERENCES profiles(id),
    receiver_signed_at TIMESTAMPTZ,
    condition_report_id UUID REFERENCES condition_reports(id),
    status transport_status NOT NULL DEFAULT 'preparing',
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 布展确认表 ============
CREATE TABLE installation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_number TEXT UNIQUE NOT NULL,
    application_id UUID NOT NULL REFERENCES loan_applications(id),
    location_id UUID REFERENCES exhibition_locations(id),
    planned_install_date TIMESTAMPTZ,
    actual_install_date TIMESTAMPTZ,
    installed_by UUID REFERENCES profiles(id),
    condition_before_install TEXT,
    installation_notes TEXT,
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    photos TEXT[],
    is_completed BOOLEAN DEFAULT false,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 撤展归还表 ============
CREATE TABLE deinstallation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_number TEXT UNIQUE NOT NULL,
    application_id UUID NOT NULL REFERENCES loan_applications(id),
    planned_deinstall_date TIMESTAMPTZ,
    actual_deinstall_date TIMESTAMPTZ,
    deinstalled_by UUID REFERENCES profiles(id),
    condition_after_deinstall TEXT,
    deinstallation_notes TEXT,
    returned_to_storage BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    photos TEXT[],
    is_completed BOOLEAN DEFAULT false,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 执行记录表 ============
CREATE TABLE execution_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT,
    performed_by UUID REFERENCES profiles(id),
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 月度对账表 ============
CREATE TABLE monthly_reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reconciliation_month TEXT NOT NULL,
    total_contracts INTEGER DEFAULT 0,
    total_fees DECIMAL(15,2) DEFAULT 0,
    total_insurance_premiums DECIMAL(15,2) DEFAULT 0,
    total_transport_costs DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'draft',
    prepared_by UUID REFERENCES profiles(id),
    prepared_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(reconciliation_month)
);

-- ============ 对表明细表 ============
CREATE TABLE reconciliation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reconciliation_id UUID NOT NULL REFERENCES monthly_reconciliations(id) ON DELETE CASCADE,
    application_id UUID REFERENCES loan_applications(id),
    item_type TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 通知表 ============
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    type notification_type NOT NULL DEFAULT 'system',
    title TEXT NOT NULL,
    content TEXT,
    related_id UUID,
    related_type TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 导入导出队列表 ============
CREATE TABLE import_export_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type job_type NOT NULL,
    entity_type TEXT NOT NULL,
    status job_status NOT NULL DEFAULT 'pending',
    file_url TEXT,
    file_name TEXT,
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    error_message TEXT,
    created_by UUID REFERENCES profiles(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 错误日志表 ============
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_code TEXT,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    user_id UUID REFERENCES profiles(id),
    path TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 审计日志表 ============
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ 索引 ============
CREATE INDEX idx_exhibits_status ON exhibits(status);
CREATE INDEX idx_loan_contracts_status ON loan_contracts(status);
CREATE INDEX idx_loan_applications_contract ON loan_applications(contract_id);
CREATE INDEX idx_loan_applications_exhibit ON loan_applications(exhibit_id);
CREATE INDEX idx_loan_applications_status ON loan_applications(status);
CREATE INDEX idx_insurance_policies_exhibit ON insurance_policies(exhibit_id);
CREATE INDEX idx_condition_reports_exhibit ON condition_reports(exhibit_id);
CREATE INDEX idx_transport_handovers_application ON transport_handovers(application_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_error_logs_created ON error_logs(created_at DESC);

-- ============ RLS 策略 ============
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibition_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowing_institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibits ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_crates ENABLE ROW LEVEL SECURITY;
ALTER TABLE condition_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE installation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE deinstallation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles 策略
CREATE POLICY "用户可查看自己的资料" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "用户可更新自己的资料" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "管理员可管理所有资料" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- 公共读取策略（适用于基础数据）
CREATE POLICY "认证用户可读" ON exhibition_locations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "管理员和策展人可修改位置" ON exhibition_locations FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'curator', 'registrar'))
);

-- 借展机构策略
CREATE POLICY "认证用户可读机构" ON borrowing_institutions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "管理员和登记员可管理机构" ON borrowing_institutions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'registrar'))
);

-- 展品策略
CREATE POLICY "认证用户可读展品" ON exhibits FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "管理员和策展人和登记员可管理展品" ON exhibits FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'curator', 'registrar', 'conservator'))
);

-- 借展合同策略
CREATE POLICY "认证用户可读合同" ON loan_contracts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "管理员和策展人和登记员可管理合同" ON loan_contracts FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'curator', 'registrar'))
);

-- 借展申请策略
CREATE POLICY "认证用户可读申请" ON loan_applications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "管理员和策展人和登记员可管理申请" ON loan_applications FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'curator', 'registrar'))
);

-- 保险单策略
CREATE POLICY "认证用户可读保险" ON insurance_policies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "管理员和登记员和财务可管理保险" ON insurance_policies FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'registrar', 'finance'))
);

-- 运输箱策略
CREATE POLICY "认证用户可读运输箱" ON shipping_crates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "管理员和物流可管理运输箱" ON shipping_crates FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'logistics', 'registrar'))
);

-- 状况报告策略
CREATE POLICY "认证用户可读状况报告" ON condition_reports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "管理员和管理员和保护人员可管理状况报告" ON condition_reports FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'conservator', 'registrar'))
);

-- 运输交接策略
CREATE POLICY "认证用户可读运输交接" ON transport_handovers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "管理员和物流和登记员可管理运输交接" ON transport_handovers FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'logistics', 'registrar'))
);

-- 布展撤展策略
CREATE POLICY "认证用户可读布撤展" ON installation_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "认证用户可读撤展" ON deinstallation_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "管理员和策展人和物流可管理布展" ON installation_records FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'curator', 'logistics', 'registrar'))
);
CREATE POLICY "管理员和策展人和物流可管理撤展" ON deinstallation_records FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'curator', 'logistics', 'registrar'))
);

-- 执行记录策略
CREATE POLICY "认证用户可读执行记录" ON execution_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "系统可写入执行记录" ON execution_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 月度对账策略
CREATE POLICY "认证用户可读对账" ON monthly_reconciliations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "认证用户读对表明细" ON reconciliation_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "管理员和财务可管理对账" ON monthly_reconciliations FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'finance'))
);
CREATE POLICY "管理员和财务可管理对表明细" ON reconciliation_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'finance'))
);

-- 通知策略
CREATE POLICY "用户可读自己的通知" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "用户可更新自己的通知" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- 导入导出策略
CREATE POLICY "认证用户可读自己的任务" ON import_export_jobs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "管理员和登记员可创建任务" ON import_export_jobs FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'registrar'))
);

-- 错误日志策略
CREATE POLICY "管理员可读错误日志" ON error_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- 审计日志策略
CREATE POLICY "管理员可读审计日志" ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- ============ 触发器 ============
-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_exhibition_locations_updated_at BEFORE UPDATE ON exhibition_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_borrowing_institutions_updated_at BEFORE UPDATE ON borrowing_institutions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_exhibits_updated_at BEFORE UPDATE ON exhibits FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_loan_contracts_updated_at BEFORE UPDATE ON loan_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_loan_applications_updated_at BEFORE UPDATE ON loan_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_insurance_policies_updated_at BEFORE UPDATE ON insurance_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_shipping_crates_updated_at BEFORE UPDATE ON shipping_crates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_condition_reports_updated_at BEFORE UPDATE ON condition_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_transport_handovers_updated_at BEFORE UPDATE ON transport_handovers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_installation_records_updated_at BEFORE UPDATE ON installation_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_deinstallation_records_updated_at BEFORE UPDATE ON deinstallation_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_monthly_reconciliations_updated_at BEFORE UPDATE ON monthly_reconciliations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_import_export_jobs_updated_at BEFORE UPDATE ON import_export_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 审计日志触发器
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_data, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 用户资料自动创建
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, username, full_name, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'viewer');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 自动生成编号函数
CREATE OR REPLACE FUNCTION generate_sequence_number(prefix TEXT, seq_name TEXT)
RETURNS TEXT AS $$
DECLARE
    next_val INTEGER;
    year_part TEXT;
BEGIN
    year_part := to_char(NOW(), 'YYYY');
    EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_val;
    RETURN prefix || '-' || year_part || '-' || LPAD(next_val::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- 创建序列
CREATE SEQUENCE IF NOT EXISTS contract_seq START 1;
CREATE SEQUENCE IF NOT EXISTS application_seq START 1;
CREATE SEQUENCE IF NOT EXISTS insurance_seq START 1;
CREATE SEQUENCE IF NOT EXISTS condition_report_seq START 1;
CREATE SEQUENCE IF NOT EXISTS transport_seq START 1;
CREATE SEQUENCE IF NOT EXISTS installation_seq START 1;
CREATE SEQUENCE IF NOT EXISTS deinstallation_seq START 1;

-- ============ 校验函数 ============
-- 检查展品时段是否可用
CREATE OR REPLACE FUNCTION check_exhibit_availability(
    p_exhibit_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_exclude_application_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM loan_applications la
        WHERE la.exhibit_id = p_exhibit_id
        AND la.status IN ('confirmed', 'in_progress')
        AND (p_exclude_application_id IS NULL OR la.id != p_exclude_application_id)
        AND (
            (la.requested_start_date <= p_end_date AND la.requested_end_date >= p_start_date)
            OR (la.actual_start_date <= p_end_date AND la.actual_end_date >= p_start_date)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 检查机构资格
CREATE OR REPLACE FUNCTION check_institution_qualification(p_institution_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM borrowing_institutions
        WHERE id = p_institution_id AND is_qualified = true
    );
END;
$$ LANGUAGE plpgsql;

-- 检查状况报告是否已确认（用于签收限制）
CREATE OR REPLACE FUNCTION check_condition_report_confirmed(p_application_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM condition_reports cr
        WHERE cr.application_id = p_application_id
        AND cr.status = 'confirmed'
    );
END;
$$ LANGUAGE plpgsql;

-- 检查运输交接是否双方签名
CREATE OR REPLACE FUNCTION check_transport_both_signed(p_handover_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM transport_handovers th
        WHERE th.id = p_handover_id
        AND th.sender_signed_at IS NOT NULL
        AND th.receiver_signed_at IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;
