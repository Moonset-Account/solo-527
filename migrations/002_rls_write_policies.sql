-- Migration: 002_rls_write_policies.sql
-- 为所有表增加 INSERT/UPDATE/DELETE RLS 策略

-- Helper: 安全地启用 RLS（避免重复执行报错）
CREATE OR REPLACE FUNCTION pg_temp.enable_rls_if_not_exists(tbl TEXT) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = tbl AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- bookings
-- ============================================================
SELECT pg_temp.enable_rls_if_not_exists('bookings');

CREATE POLICY "Users can create own bookings" ON bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bookings, admins can update all" ON bookings
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can delete bookings" ON bookings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- archive_records
-- ============================================================
SELECT pg_temp.enable_rls_if_not_exists('archive_records');

CREATE POLICY "Authenticated users can create archives" ON archive_records
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own archives, admins can update all" ON archive_records
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can delete archives" ON archive_records
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- permission_requests
-- ============================================================
SELECT pg_temp.enable_rls_if_not_exists('permission_requests');

CREATE POLICY "Authenticated users can submit requests" ON permission_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update requests" ON permission_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can delete requests" ON permission_requests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- deactivation_alerts
-- ============================================================
SELECT pg_temp.enable_rls_if_not_exists('deactivation_alerts');

CREATE POLICY "Admins and equipment teachers can create alerts" ON deactivation_alerts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'equipment_teacher'))
  );

CREATE POLICY "Admins and equipment teachers can update alerts" ON deactivation_alerts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'equipment_teacher'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'equipment_teacher'))
  );

CREATE POLICY "Only admins can delete alerts" ON deactivation_alerts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- utilization_logs
-- ============================================================
SELECT pg_temp.enable_rls_if_not_exists('utilization_logs');

CREATE POLICY "Admins, equipment teachers and booking owners can create logs" ON utilization_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'equipment_teacher'))
    OR EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.instrument_id = utilization_logs.instrument_id
      AND bookings.user_id = auth.uid()
      AND bookings.status IN ('confirmed', 'completed')
      AND DATE(bookings.start_time) = utilization_logs.log_date
    )
  );

CREATE POLICY "Admins, equipment teachers and booking owners can update logs" ON utilization_logs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'equipment_teacher'))
    OR EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.instrument_id = utilization_logs.instrument_id
      AND bookings.user_id = auth.uid()
      AND bookings.status IN ('confirmed', 'completed')
      AND DATE(bookings.start_time) = utilization_logs.log_date
    )
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'equipment_teacher'))
    OR EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.instrument_id = utilization_logs.instrument_id
      AND bookings.user_id = auth.uid()
      AND bookings.status IN ('confirmed', 'completed')
      AND DATE(bookings.start_time) = utilization_logs.log_date
    )
  );

CREATE POLICY "Only admins can delete logs" ON utilization_logs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- audit_logs
-- ============================================================
SELECT pg_temp.enable_rls_if_not_exists('audit_logs');

CREATE POLICY "Authenticated users can create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can update audit logs" ON audit_logs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can delete audit logs" ON audit_logs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- users
-- ============================================================
SELECT pg_temp.enable_rls_if_not_exists('users');

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create own profile" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update roles, users can update own display_name" ON users
  FOR UPDATE USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- instruments
-- ============================================================
SELECT pg_temp.enable_rls_if_not_exists('instruments');

CREATE POLICY "Authenticated users can view instruments" ON instruments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and equipment teachers can create instruments" ON instruments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'equipment_teacher'))
  );

CREATE POLICY "Admins and equipment teachers can update instruments" ON instruments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'equipment_teacher'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'equipment_teacher'))
  );

CREATE POLICY "Admins and equipment teachers can delete instruments" ON instruments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'equipment_teacher'))
  );

-- ============================================================
-- stations
-- ============================================================
SELECT pg_temp.enable_rls_if_not_exists('stations');

CREATE POLICY "Authenticated users can view stations" ON stations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can create stations" ON stations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update stations" ON stations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete stations" ON stations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- booking_samples
-- ============================================================
SELECT pg_temp.enable_rls_if_not_exists('booking_samples');

CREATE POLICY "Users can view booking samples for own bookings" ON booking_samples
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_samples.booking_id AND bookings.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create booking samples for own bookings" ON booking_samples
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_samples.booking_id AND bookings.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can delete booking samples for own bookings" ON booking_samples
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_samples.booking_id AND bookings.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- samples
-- ============================================================
SELECT pg_temp.enable_rls_if_not_exists('samples');

CREATE POLICY "Authenticated users can create samples" ON samples
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators or admins can update samples" ON samples
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- projects
-- ============================================================
SELECT pg_temp.enable_rls_if_not_exists('projects');

CREATE POLICY "Authenticated users can view projects" ON projects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can create projects" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update projects" ON projects
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete projects" ON projects
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- api_status
-- ============================================================
SELECT pg_temp.enable_rls_if_not_exists('api_status');

CREATE POLICY "Authenticated users can view api status" ON api_status
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can create api status" ON api_status
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update api status" ON api_status
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete api status" ON api_status
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
