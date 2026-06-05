-- 摄影棚档期和器材租赁系统数据库 Schema
-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 自定义类型定义
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'photographer', 'assistant', 'client');
CREATE TYPE booking_status AS ENUM ('draft', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled');
CREATE TYPE contract_status AS ENUM ('draft', 'sent', 'signed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('unpaid', 'deposit_paid', 'partial_paid', 'paid', 'refunded');
CREATE TYPE equipment_status AS ENUM ('available', 'rented', 'maintenance', 'damaged', 'lost');
CREATE TYPE studio_status AS ENUM ('available', 'booked', 'maintenance', 'closed');
CREATE TYPE damage_severity AS ENUM ('minor', 'moderate', 'severe', 'total');
CREATE TYPE notification_type AS ENUM ('email', 'sms', 'in_app');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');

-- 用户资料表（扩展 Supabase auth.users）
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 客户表
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 棚位表
CREATE TABLE studios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  area_sqm DECIMAL,
  hourly_rate DECIMAL(10, 2) NOT NULL,
  daily_rate DECIMAL(10, 2),
  status studio_status NOT NULL DEFAULT 'available',
  features TEXT[],
  images TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 器材分类表
CREATE TABLE equipment_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES equipment_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 器材表
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  category_id UUID REFERENCES equipment_categories(id),
  description TEXT,
  hourly_rate DECIMAL(10, 2) NOT NULL,
  daily_rate DECIMAL(10, 2),
  purchase_price DECIMAL(10, 2),
  purchase_date DATE,
  status equipment_status NOT NULL DEFAULT 'available',
  serial_number TEXT,
  brand TEXT,
  model TEXT,
  images TEXT[],
  notes TEXT,
  qr_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 套餐表
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_hours DECIMAL,
  includes_studio BOOLEAN DEFAULT false,
  studio_id UUID REFERENCES studios(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 套餐包含器材关联表
CREATE TABLE package_equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(package_id, equipment_id)
);

-- 拍摄助理表
CREATE TABLE assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  hourly_rate DECIMAL(10, 2) NOT NULL,
  skills TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 订单/合同表
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_no TEXT UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  studio_id UUID REFERENCES studios(id),
  package_id UUID REFERENCES packages(id),
  status booking_status NOT NULL DEFAULT 'draft',
  contract_status contract_status NOT NULL DEFAULT 'draft',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  deposit_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  photographer_id UUID REFERENCES profiles(id),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- 订单器材关联表
CREATE TABLE booking_equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  pickup_time TIMESTAMPTZ,
  return_time TIMESTAMPTZ,
  pickup_by UUID REFERENCES profiles(id),
  return_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(booking_id, equipment_id)
);

-- 订单助理关联表
CREATE TABLE booking_assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES assistants(id),
  hours DECIMAL NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(booking_id, assistant_id)
);

-- 支付记录表
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_no TEXT,
  is_deposit BOOLEAN DEFAULT false,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 器材损坏记录表
CREATE TABLE equipment_damages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES equipment(id),
  booking_id UUID REFERENCES bookings(id),
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  responsible_party TEXT NOT NULL,
  severity damage_severity NOT NULL,
  description TEXT NOT NULL,
  repair_cost DECIMAL(10, 2),
  images TEXT[],
  status TEXT NOT NULL DEFAULT 'reported',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 操作日志表
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 通知表
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type notification_type NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status notification_status NOT NULL DEFAULT 'pending',
  booking_id UUID REFERENCES bookings(id),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 报价单表
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_no TEXT UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  studio_id UUID REFERENCES studios(id),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  valid_until DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 报价单器材明细
CREATE TABLE quotation_equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_studio_id ON bookings(studio_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_end_time ON bookings(end_time);
CREATE INDEX idx_booking_equipment_booking_id ON booking_equipment(booking_id);
CREATE INDEX idx_booking_equipment_equipment_id ON booking_equipment(equipment_id);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_category_id ON equipment(category_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_booking_id ON notifications(booking_id);
CREATE INDEX idx_equipment_damages_equipment_id ON equipment_damages(equipment_id);
CREATE INDEX idx_equipment_damages_booking_id ON equipment_damages(booking_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);

-- 更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 自动生成订单号函数
CREATE OR REPLACE FUNCTION generate_booking_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_no IS NULL THEN
    NEW.booking_no = 'BK' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 自动生成报价单号函数
CREATE OR REPLACE FUNCTION generate_quotation_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quotation_no IS NULL THEN
    NEW.quotation_no = 'QT' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 操作日志触发器函数
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
BEGIN
  user_id := auth.uid();
  
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, ip_address)
    VALUES (user_id, 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), inet_client_addr());
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data, ip_address)
    VALUES (user_id, 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW), inet_client_addr());
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data, ip_address)
    VALUES (user_id, 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW), inet_client_addr());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 应用触发器
CREATE TRIGGER trigger_profiles_update_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_clients_update_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_studios_update_updated_at
  BEFORE UPDATE ON studios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_equipment_update_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_packages_update_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_assistants_update_updated_at
  BEFORE UPDATE ON assistants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_bookings_update_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_equipment_damages_update_updated_at
  BEFORE UPDATE ON equipment_damages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_quotations_update_updated_at
  BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_bookings_generate_no
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_booking_no();

CREATE TRIGGER trigger_quotations_generate_no
  BEFORE INSERT ON quotations
  FOR EACH ROW EXECUTE FUNCTION generate_quotation_no();

-- 审计日志触发器
CREATE TRIGGER trigger_bookings_audit
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER trigger_payments_audit
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER trigger_equipment_audit
  AFTER INSERT OR UPDATE OR DELETE ON equipment
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER trigger_equipment_damages_audit
  AFTER INSERT OR UPDATE OR DELETE ON equipment_damages
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- ==================== RLS (Row Level Security) 策略 ====================

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_damages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_equipment ENABLE ROW LEVEL SECURITY;

-- 辅助函数：获取当前用户角色
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 辅助函数：检查是否为管理员或经理
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
  SELECT get_current_user_role() IN ('admin', 'manager');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles 策略
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles"
  ON profiles FOR SELECT
  USING (is_staff());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Clients 策略
CREATE POLICY "Staff can manage clients"
  ON clients FOR ALL
  USING (is_staff());

CREATE POLICY "Clients can view their own data"
  ON clients FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE phone = clients.phone));

-- Studios 策略
CREATE POLICY "Everyone can view studios"
  ON studios FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage studios"
  ON studios FOR ALL
  USING (is_staff());

-- Equipment 策略
CREATE POLICY "Everyone can view equipment"
  ON equipment FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage equipment"
  ON equipment FOR ALL
  USING (is_staff());

-- Equipment Categories 策略
CREATE POLICY "Everyone can view categories"
  ON equipment_categories FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage categories"
  ON equipment_categories FOR ALL
  USING (is_staff());

-- Packages 策略
CREATE POLICY "Everyone can view packages"
  ON packages FOR SELECT
  USING (is_active OR is_staff());

CREATE POLICY "Staff can manage packages"
  ON packages FOR ALL
  USING (is_staff());

-- Package Equipment 策略
CREATE POLICY "Everyone can view package equipment"
  ON package_equipment FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage package equipment"
  ON package_equipment FOR ALL
  USING (is_staff());

-- Assistants 策略
CREATE POLICY "Everyone can view active assistants"
  ON assistants FOR SELECT
  USING (is_active OR is_staff());

CREATE POLICY "Staff can manage assistants"
  ON assistants FOR ALL
  USING (is_staff());

-- Bookings 策略
CREATE POLICY "Staff can view all bookings"
  ON bookings FOR SELECT
  USING (is_staff());

CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (
    photographer_id = auth.uid() OR
    client_id IN (
      SELECT c.id FROM clients c
      JOIN profiles p ON p.phone = c.phone
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage bookings"
  ON bookings FOR INSERT
  WITH CHECK (is_staff());

CREATE POLICY "Staff can update bookings"
  ON bookings FOR UPDATE
  USING (is_staff());

CREATE POLICY "Staff can delete bookings"
  ON bookings FOR DELETE
  USING (is_staff());

-- Booking Equipment 策略
CREATE POLICY "Staff can view all booking equipment"
  ON booking_equipment FOR SELECT
  USING (is_staff());

CREATE POLICY "Users can view their booking equipment"
  ON booking_equipment FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE 
      photographer_id = auth.uid() OR
      client_id IN (
        SELECT c.id FROM clients c
        JOIN profiles p ON p.phone = c.phone
        WHERE p.id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can manage booking equipment"
  ON booking_equipment FOR ALL
  USING (is_staff());

-- Booking Assistants 策略
CREATE POLICY "Staff can view all booking assistants"
  ON booking_assistants FOR SELECT
  USING (is_staff());

CREATE POLICY "Staff can manage booking assistants"
  ON booking_assistants FOR ALL
  USING (is_staff());

-- Payments 策略
CREATE POLICY "Staff can view all payments"
  ON payments FOR SELECT
  USING (is_staff());

CREATE POLICY "Users can view their payments"
  ON payments FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE 
      client_id IN (
        SELECT c.id FROM clients c
        JOIN profiles p ON p.phone = c.phone
        WHERE p.id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can manage payments"
  ON payments FOR ALL
  USING (is_staff());

-- Equipment Damages 策略
CREATE POLICY "Staff can view all damages"
  ON equipment_damages FOR SELECT
  USING (is_staff());

CREATE POLICY "Users can report damages"
  ON equipment_damages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage damages"
  ON equipment_damages FOR UPDATE
  USING (is_staff());

-- Audit Logs 策略
CREATE POLICY "Only admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (get_current_user_role() = 'admin');

-- Notifications 策略
CREATE POLICY "Staff can manage notifications"
  ON notifications FOR ALL
  USING (is_staff());

-- Quotations 策略
CREATE POLICY "Staff can view all quotations"
  ON quotations FOR SELECT
  USING (is_staff());

CREATE POLICY "Users can view their quotations"
  ON quotations FOR SELECT
  USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN profiles p ON p.phone = c.phone
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage quotations"
  ON quotations FOR ALL
  USING (is_staff());

-- Quotation Equipment 策略
CREATE POLICY "Staff can view all quotation equipment"
  ON quotation_equipment FOR SELECT
  USING (is_staff());

CREATE POLICY "Staff can manage quotation equipment"
  ON quotation_equipment FOR ALL
  USING (is_staff());

-- ==================== 示例数据 ====================

-- 插入用户（需要先在 auth.users 中创建，这里只创建 profiles）
-- 注意：实际使用时需要通过 Supabase Auth API 创建用户

-- 插入器材分类
INSERT INTO equipment_categories (name, sort_order) VALUES
('相机机身', 1),
('镜头', 2),
('灯光设备', 3),
('背景道具', 4),
('三脚架/稳定器', 5);

-- 插入棚位
INSERT INTO studios (name, description, area_sqm, hourly_rate, daily_rate, features) VALUES
('A棚 - 无影墙', '专业无影墙摄影棚，适合电商、人像拍摄', 80, 300, 2000, ARRAY['无影墙', '空调', '化妆间', '休息区']),
('B棚 - 实景棚', '多种实景场景，适合服装、创意拍摄', 120, 400, 2800, ARRAY['实景场景', '空调', '化妆间', '休息区']),
('C棚 - 小型棚', '小型产品拍摄棚，适合小商品、美食拍摄', 40, 150, 1000, ARRAY['产品台', '空调']);

-- 插入器材
INSERT INTO equipment (name, sku, category_id, hourly_rate, daily_rate, brand, model, serial_number) VALUES
('Canon EOS R5', 'CAM-001', (SELECT id FROM equipment_categories WHERE name = '相机机身'), 80, 500, 'Canon', 'EOS R5', 'SN-R5-001'),
('Sony A7 IV', 'CAM-002', (SELECT id FROM equipment_categories WHERE name = '相机机身'), 70, 450, 'Sony', 'A7 IV', 'SN-A74-001'),
('Canon 24-70mm f/2.8', 'LEN-001', (SELECT id FROM equipment_categories WHERE name = '镜头'), 40, 250, 'Canon', 'EF 24-70mm f/2.8L II', 'SN-LEN-001'),
('Profoto B10X Plus', 'LIT-001', (SELECT id FROM equipment_categories WHERE name = '灯光设备'), 60, 400, 'Profoto', 'B10X Plus', 'SN-LIT-001'),
('Godox SL60W', 'LIT-002', (SELECT id FROM equipment_categories WHERE name = '灯光设备'), 25, 150, 'Godox', 'SL60W', 'SN-LIT-002');

-- 插入套餐
INSERT INTO packages (name, description, price, duration_hours, includes_studio, studio_id) VALUES
('基础电商套餐', '4小时A棚使用 + 基础灯光设备', 1500, 4, true, (SELECT id FROM studios WHERE name LIKE 'A棚%')),
('人像拍摄套餐', '8小时B棚使用 + 全套灯光', 3500, 8, true, (SELECT id FROM studios WHERE name LIKE 'B棚%'));

-- 套餐关联器材
INSERT INTO package_equipment (package_id, equipment_id, quantity)
SELECT 
  (SELECT id FROM packages WHERE name = '基础电商套餐'),
  (SELECT id FROM equipment WHERE name = 'Godox SL60W'),
  2;

INSERT INTO package_equipment (package_id, equipment_id, quantity)
SELECT 
  (SELECT id FROM packages WHERE name = '人像拍摄套餐'),
  (SELECT id FROM equipment WHERE name = 'Profoto B10X Plus'),
  3;

-- 插入拍摄助理
INSERT INTO assistants (name, phone, hourly_rate, skills) VALUES
('张三', '13800138001', 100, ARRAY['灯光', '布景', '器材维护']),
('李四', '13800138002', 120, ARRAY['灯光', '摄影助理', '后期']);

-- 插入客户
INSERT INTO clients (name, company, phone, email, created_by)
SELECT '测试客户A', '测试公司', '13900139001', 'test@example.com', auth.uid()
WHERE auth.uid() IS NOT NULL;
