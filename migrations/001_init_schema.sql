-- Migration: 001_init_schema.sql
-- 实验预约数据登记站 - 初始数据库架构

CREATE TABLE labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('researcher', 'archivist', 'admin', 'equipment_teacher')),
  lab_id UUID REFERENCES labs(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  lead_id UUID REFERENCES users(id),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'disabled')),
  teacher_id UUID REFERENCES users(id),
  location TEXT,
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  instrument_id UUID NOT NULL REFERENCES instruments(id),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'disabled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  project_id UUID REFERENCES projects(id),
  created_by UUID REFERENCES users(id),
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'in_progress', 'completed')),
  responsible_person TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  instrument_id UUID NOT NULL REFERENCES instruments(id),
  station_id UUID NOT NULL REFERENCES stations(id),
  project_id UUID REFERENCES projects(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT booking_time_check CHECK (end_time > start_time)
);

CREATE TABLE booking_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sample_id UUID NOT NULL REFERENCES samples(id)
);

CREATE TABLE archive_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  sample_id UUID REFERENCES samples(id),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'in_progress', 'completed')),
  responsible_person TEXT,
  metadata JSONB DEFAULT '{}',
  archived_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE deactivation_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID NOT NULL REFERENCES instruments(id),
  reason TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  deactivated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id)
);

CREATE TABLE utilization_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID NOT NULL REFERENCES instruments(id),
  log_date DATE NOT NULL,
  total_hours NUMERIC(6,2) NOT NULL DEFAULT 24,
  used_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  disabled_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(instrument_id, log_date)
);

CREATE TABLE permission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  requested_role TEXT NOT NULL CHECK (requested_role IN ('researcher', 'archivist', 'admin', 'equipment_teacher')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE api_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  response_time_ms INTEGER,
  checked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_instrument ON bookings(instrument_id);
CREATE INDEX idx_bookings_station ON bookings(station_id);
CREATE INDEX idx_bookings_time ON bookings(start_time, end_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_samples_project ON samples(project_id);
CREATE INDEX idx_samples_status ON samples(processing_status);
CREATE INDEX idx_archive_project ON archive_records(project_id);
CREATE INDEX idx_archive_status ON archive_records(processing_status);
CREATE INDEX idx_deactivation_instrument ON deactivation_alerts(instrument_id);
CREATE INDEX idx_deactivation_resolved ON deactivation_alerts(resolved);
CREATE INDEX idx_utilization_instrument ON utilization_logs(instrument_id, log_date);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
CREATE INDEX idx_permission_status ON permission_requests(status);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all bookings" ON bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE archive_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own archives" ON archive_records FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all archives" ON archive_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own samples" ON samples FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Admins can view all samples" ON samples FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE deactivation_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipment teachers can view alerts" ON deactivation_alerts FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'equipment_teacher'))
);

ALTER TABLE utilization_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view utilization" ON utilization_logs FOR SELECT USING (
  auth.uid() IS NOT NULL
);

ALTER TABLE permission_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own requests" ON permission_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all requests" ON permission_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
