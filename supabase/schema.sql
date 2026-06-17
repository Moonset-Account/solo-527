-- 扩展 schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户资料表
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text
);

-- 会员套餐表
CREATE TABLE member_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  benefits TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text
);

-- 会员记录表
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  plan_id UUID REFERENCES member_plans(id),
  start_date DATE,
  end_date DATE,
  balance DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text
);

-- 检测项目模板表
CREATE TABLE service_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text
);

-- 技师表
CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  skills TEXT,
  avatar_url VARCHAR(255),
  status VARCHAR(20) DEFAULT 'available',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text
);

-- 工位表
CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'available',
  equipment TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text
);

-- 配件表
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  sku VARCHAR(50),
  category VARCHAR(50),
  cost_price DECIMAL(10,2) DEFAULT 0,
  sale_price DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 10,
  unit VARCHAR(20),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text
);

-- 预约单表
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  technician_id UUID REFERENCES technicians(id),
  station_id UUID REFERENCES stations(id),
  appointment_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  car_plate VARCHAR(20),
  car_model VARCHAR(100),
  mileage INTEGER,
  customer_name VARCHAR(100),
  customer_phone VARCHAR(20),
  notes TEXT,
  total_amount DECIMAL(10,2) DEFAULT 0,
  quality_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text
);

-- 检测项目明细表
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  template_id UUID REFERENCES service_templates(id),
  item_name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  technician_id UUID REFERENCES technicians(id),
  status VARCHAR(20) DEFAULT 'pending',
  result TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text
);

-- 配件使用明细表
CREATE TABLE order_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id),
  part_name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text
);

-- 收银单表
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id),
  invoice_no VARCHAR(50) UNIQUE,
  total_amount DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  member_discount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  issued_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(20),
  cashier_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text
);

-- 返修工单表
CREATE TABLE repairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  assigned_to UUID REFERENCES technicians(id),
  priority VARCHAR(20) DEFAULT 'normal',
  solution TEXT,
  quality_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text
);

-- 返修处理记录表
CREATE TABLE repair_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES profiles(id),
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text
);

-- 附件表
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text
);

-- 备注表
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text
);

-- 审计日志表
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id),
  repair_id UUID REFERENCES repairs(id),
  operator_id UUID REFERENCES profiles(id),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIME ZONE 'utc'::text
);

-- 索引
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_appointment_time ON appointments(appointment_time);
CREATE INDEX idx_appointments_technician_id ON appointments(technician_id);
CREATE INDEX idx_appointments_station_id ON appointments(station_id);
CREATE INDEX idx_order_items_appointment_id ON order_items(appointment_id);
CREATE INDEX idx_order_parts_appointment_id ON order_parts(appointment_id);
CREATE INDEX idx_invoices_appointment_id ON invoices(appointment_id);
CREATE INDEX idx_repairs_appointment_id ON repairs(appointment_id);
CREATE INDEX idx_repairs_status ON repairs(status);
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_parts_category ON parts(category);
CREATE INDEX idx_service_templates_category ON service_templates(category);
CREATE INDEX idx_attachments_appointment_id ON attachments(appointment_id);
CREATE INDEX idx_notes_appointment_id ON notes(appointment_id);
CREATE INDEX idx_audit_logs_appointment_id ON audit_logs(appointment_id);
