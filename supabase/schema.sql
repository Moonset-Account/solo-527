-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户资料表
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 自动创建用户资料的触发器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 棚位表
CREATE TABLE studios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_capacity INTEGER,
  equipment_included JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 器材表
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('camera', 'lighting', 'accessory', 'other')),
  description TEXT,
  rental_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  purchase_price NUMERIC(10,2),
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'damaged', 'lost')),
  serial_number TEXT UNIQUE,
  brand TEXT,
  model TEXT,
  purchase_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 套餐表
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  studio_hours INTEGER NOT NULL DEFAULT 0,
  equipment_included JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 订单表
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES profiles(id) NOT NULL,
  package_id UUID REFERENCES packages(id),
  studio_id UUID REFERENCES studios(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
  notes TEXT,
  confirmed_by UUID REFERENCES profiles(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 订单器材关联表
CREATE TABLE order_equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  rental_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_extra BOOLEAN DEFAULT false,
  picked_up BOOLEAN DEFAULT false,
  picked_up_by UUID REFERENCES profiles(id),
  picked_up_at TIMESTAMPTZ,
  returned BOOLEAN DEFAULT false,
  returned_by UUID REFERENCES profiles(id),
  returned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, equipment_id)
);

-- 押金流水表
CREATE TABLE deposit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('charge', 'refund', 'adjustment')),
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT,
  transaction_ref TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 损坏记录表
CREATE TABLE damage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe', 'total')),
  repair_cost NUMERIC(10,2),
  responsible_party_id UUID REFERENCES profiles(id) NOT NULL,
  reported_by UUID REFERENCES profiles(id) NOT NULL,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  photos JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 合同附件表
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  signed BOOLEAN DEFAULT false,
  signed_by UUID REFERENCES profiles(id),
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 通知表
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order_status', 'equipment_return', 'damage_report', 'payment', 'system')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  related_order_id UUID REFERENCES orders(id),
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 通知队列表（用于失败重试）
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 5,
  last_error TEXT,
  last_attempt_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 自动更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加 updated_at 触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_studios_updated_at BEFORE UPDATE ON studios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_equipment_updated_at BEFORE UPDATE ON order_equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_damage_records_updated_at BEFORE UPDATE ON damage_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_queue_updated_at BEFORE UPDATE ON notification_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 自动生成订单号的函数
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  date_part TEXT;
  seq_part TEXT;
BEGIN
  IF NEW.order_number IS NULL THEN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT LPAD(COALESCE(COUNT(*)::TEXT, '0'), 4, '0') INTO seq_part
    FROM orders
    WHERE order_number LIKE date_part || '%';
    NEW.order_number := date_part || seq_part;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- 检查器材是否可用的函数（用于预约时验证）
CREATE OR REPLACE FUNCTION check_equipment_availability(
  p_equipment_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_exclude_order_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM order_equipment oe
    JOIN orders o ON oe.order_id = o.id
    WHERE oe.equipment_id = p_equipment_id
      AND o.status IN ('confirmed', 'in_progress')
      AND (p_exclude_order_id IS NULL OR o.id != p_exclude_order_id)
      AND o.start_time < p_end_time
      AND o.end_time > p_start_time
      AND oe.returned = false
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 检查棚位是否可用的函数
CREATE OR REPLACE FUNCTION check_studio_availability(
  p_studio_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_exclude_order_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.studio_id = p_studio_id
      AND o.status IN ('confirmed', 'in_progress')
      AND (p_exclude_order_id IS NULL OR o.id != p_exclude_order_id)
      AND o.start_time < p_end_time
      AND o.end_time > p_start_time
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS 策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Profiles 策略
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Staff can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Studios 策略（所有人可读，仅员工可写）
CREATE POLICY "Public can view active studios" ON studios
  FOR SELECT USING (is_active = true OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
  ));
CREATE POLICY "Staff can manage studios" ON studios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );

-- Equipment 策略（客户看不到采购价）
CREATE POLICY "Public can view available equipment" ON equipment
  FOR SELECT USING (
    status = 'available' OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );
CREATE POLICY "Staff can manage equipment" ON equipment
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );

-- Packages 策略
CREATE POLICY "Public can view active packages" ON packages
  FOR SELECT USING (is_active = true OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
  ));
CREATE POLICY "Staff can manage packages" ON packages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );

-- Orders 策略
CREATE POLICY "Customers can view their own orders" ON orders
  FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Staff can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );
CREATE POLICY "Customers can create orders" ON orders
  FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Staff can manage orders" ON orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );

-- Order Equipment 策略
CREATE POLICY "Customers can view their order equipment" ON order_equipment
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o WHERE o.id = order_equipment.order_id AND o.customer_id = auth.uid()
    )
  );
CREATE POLICY "Staff can view all order equipment" ON order_equipment
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );
CREATE POLICY "Staff can manage order equipment" ON order_equipment
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );

-- Deposit Transactions 策略
CREATE POLICY "Customers can view their deposit transactions" ON deposit_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o WHERE o.id = deposit_transactions.order_id AND o.customer_id = auth.uid()
    )
  );
CREATE POLICY "Staff can view all deposit transactions" ON deposit_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );
CREATE POLICY "Staff can manage deposit transactions" ON deposit_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );

-- Damage Records 策略
CREATE POLICY "Customers can view damage records for their orders" ON damage_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o WHERE o.id = damage_records.order_id AND o.customer_id = auth.uid()
    )
  );
CREATE POLICY "Staff can view all damage records" ON damage_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );
CREATE POLICY "Staff can manage damage records" ON damage_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );

-- Contracts 策略
CREATE POLICY "Customers can view contracts for their orders" ON contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o WHERE o.id = contracts.order_id AND o.customer_id = auth.uid()
    )
  );
CREATE POLICY "Staff can view all contracts" ON contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );
CREATE POLICY "Staff can manage contracts" ON contracts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );

-- Notifications 策略
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Staff can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );

-- Notification Queue 策略（仅员工/系统可访问）
CREATE POLICY "Only staff can view notification queue" ON notification_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );
CREATE POLICY "Only staff can manage notification queue" ON notification_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );
