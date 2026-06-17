-- 行级安全策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 管理员角色可以访问所有数据
CREATE POLICY "Admin full access" ON profiles
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 用户可以查看自己的资料
CREATE POLICY "User view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 用户可以更新自己的资料
CREATE POLICY "User update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 公开查看会员套餐
CREATE POLICY "Public view member plans" ON member_plans
  FOR SELECT USING (is_active = true);

-- 用户查看自己的会员记录
CREATE POLICY "User view own membership" ON memberships
  FOR SELECT USING (user_id = auth.uid());

-- 管理员管理会员
CREATE POLICY "Admin manage memberships" ON memberships
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 公开查看检测项目
CREATE POLICY "Public view services" ON service_templates
  FOR SELECT USING (is_active = true);

-- 管理员管理检测项目
CREATE POLICY "Admin manage services" ON service_templates
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 公开查看技师信息
CREATE POLICY "Public view technicians" ON technicians
  FOR SELECT USING (true);

-- 管理员管理技师
CREATE POLICY "Admin manage technicians" ON technicians
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 公开查看工位
CREATE POLICY "Public view stations" ON stations
  FOR SELECT USING (true);

-- 管理员管理工位
CREATE POLICY "Admin manage stations" ON stations
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 管理员管理配件
CREATE POLICY "Admin manage parts" ON parts
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 用户查看自己的预约
CREATE POLICY "User view own appointments" ON appointments
  FOR SELECT USING (user_id = auth.uid());

-- 用户创建预约
CREATE POLICY "User create appointments" ON appointments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 技师查看分配给自己的预约
CREATE POLICY "Technician view assigned appointments" ON appointments
  FOR SELECT USING (technician_id IN (
    SELECT id FROM technicians WHERE id = appointments.technician_id
  ));

-- 管理员管理所有预约
CREATE POLICY "Admin manage appointments" ON appointments
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 预约项目相关策略
CREATE POLICY "User view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.id = order_items.appointment_id 
      AND appointments.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin manage order items" ON order_items
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 配件使用策略
CREATE POLICY "Admin manage order parts" ON order_parts
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "User view own order parts" ON order_parts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.id = order_parts.appointment_id 
      AND appointments.user_id = auth.uid()
    )
  );

-- 收银单策略
CREATE POLICY "User view own invoices" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.id = invoices.appointment_id 
      AND appointments.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin manage invoices" ON invoices
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 返修策略
CREATE POLICY "User view own repairs" ON repairs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.id = repairs.appointment_id 
      AND appointments.user_id = auth.uid()
    )
  );

CREATE POLICY "Technician view assigned repairs" ON repairs
  FOR SELECT USING (assigned_to IN (
    SELECT id FROM technicians WHERE id = repairs.assigned_to
  ));

CREATE POLICY "Admin manage repairs" ON repairs
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 返修记录策略
CREATE POLICY "View repair logs" ON repair_logs
  FOR SELECT USING (true);

CREATE POLICY "Admin manage repair logs" ON repair_logs
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 附件策略
CREATE POLICY "User view own attachments" ON attachments
  FOR SELECT USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin manage attachments" ON attachments
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 备注策略
CREATE POLICY "User view own notes" ON notes
  FOR SELECT USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE user_id = auth.uid()
    )
    AND is_internal = false
  );

CREATE POLICY "Admin manage notes" ON notes
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 审计日志策略
CREATE POLICY "Admin view audit logs" ON audit_logs
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );
