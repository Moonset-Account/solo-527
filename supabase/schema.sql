-- ============================================================
-- 同城骑手轨迹看板 - 数据库 Schema
-- 适用于 PostgreSQL 15+ + PostGIS 3+
-- ============================================================

-- 启用 PostGIS 扩展
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- ============================================================
-- 枚举类型定义
-- ============================================================

CREATE TYPE order_status AS ENUM (
  'pending',
  'accepted',
  'assigned',
  'picked',
  'delivering',
  'completed',
  'exception'
);

CREATE TYPE order_priority AS ENUM ('normal', 'urgent', 'vip');

CREATE TYPE rider_status AS ENUM ('idle', 'busy', 'offline', 'delivering');

CREATE TYPE exception_type AS ENUM (
  'timeout',
  'temperature',
  'discrepancy',
  'damage',
  'signature',
  'other'
);

CREATE TYPE exception_status AS ENUM ('pending', 'processing', 'resolved', 'closed');

CREATE TYPE exception_priority AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE operation_log_type AS ENUM (
  'order',
  'rider',
  'tracking',
  'exception',
  'warning',
  'error',
  'config',
  'export',
  'compensation',
  'notification',
  'inventory'
);

-- ============================================================
-- 站点表
-- ============================================================

CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sites_location ON sites USING GIST (location);

-- ============================================================
-- 骑手表
-- ============================================================

CREATE TABLE IF NOT EXISTS riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  status rider_status NOT NULL DEFAULT 'idle',
  current_location GEOGRAPHY(Point, 4326),
  current_order_id UUID REFERENCES orders(id),
  battery_level INTEGER,
  today_mileage DECIMAL(10, 2) DEFAULT 0,
  today_working_hours DECIMAL(5, 2) DEFAULT 0,
  rating DECIMAL(2, 1) NOT NULL DEFAULT 5.0,
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_riders_status ON riders(status);
CREATE INDEX idx_riders_location ON riders USING GIST (current_location);

-- ============================================================
-- 订单表
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no VARCHAR(50) NOT NULL UNIQUE,
  status order_status NOT NULL DEFAULT 'pending',
  priority order_priority NOT NULL DEFAULT 'normal',
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  pickup_location GEOGRAPHY(Point, 4326) NOT NULL,
  delivery_location GEOGRAPHY(Point, 4326) NOT NULL,
  estimated_delivery_time TIMESTAMPTZ NOT NULL,
  actual_delivery_time TIMESTAMPTZ,
  rider_id UUID REFERENCES riders(id),
  rider_name VARCHAR(50),
  goods_type VARCHAR(100) NOT NULL,
  recipient VARCHAR(50),
  recipient_phone VARCHAR(20),
  signature_name VARCHAR(50),
  signature_phone VARCHAR(20),
  signature_image_url TEXT,
  signed_at TIMESTAMPTZ,
  temp_min DECIMAL(5, 2),
  temp_max DECIMAL(5, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_rider_id ON orders(rider_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_pickup_location ON orders USING GIST (pickup_location);
CREATE INDEX idx_orders_delivery_location ON orders USING GIST (delivery_location);

-- ============================================================
-- 轨迹追踪点表
-- ============================================================

CREATE TABLE IF NOT EXISTS tracking_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  speed DECIMAL(5, 2) NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tracking_points_order_id ON tracking_points(order_id);
CREATE INDEX idx_tracking_points_rider_id ON tracking_points(rider_id);
CREATE INDEX idx_tracking_points_timestamp ON tracking_points(timestamp);
CREATE INDEX idx_tracking_points_location ON tracking_points USING GIST (location);

-- ============================================================
-- 温度记录表
-- ============================================================

CREATE TABLE IF NOT EXISTS temperature_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  temperature DECIMAL(5, 2) NOT NULL,
  humidity DECIMAL(5, 2),
  is_normal BOOLEAN NOT NULL DEFAULT true,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_temperature_records_order_id ON temperature_records(order_id);
CREATE INDEX idx_temperature_records_timestamp ON temperature_records(timestamp);
CREATE INDEX idx_temperature_records_is_normal ON temperature_records(is_normal);

-- ============================================================
-- 异常记录表
-- ============================================================

CREATE TABLE IF NOT EXISTS exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_no VARCHAR(50) NOT NULL,
  type exception_type NOT NULL,
  priority exception_priority NOT NULL DEFAULT 'medium',
  reason TEXT NOT NULL,
  is_dispute BOOLEAN NOT NULL DEFAULT false,
  dispute_reason TEXT,
  dispute_evidence TEXT[] DEFAULT '{}',
  compensation_amount DECIMAL(10, 2),
  status exception_status NOT NULL DEFAULT 'pending',
  assignee_id UUID NOT NULL,
  assignee_name VARCHAR(50) NOT NULL,
  processing_start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processing_end_time TIMESTAMPTZ,
  processing_duration INTEGER,
  processing_notes JSONB DEFAULT '[]'::jsonb,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exceptions_status ON exceptions(status);
CREATE INDEX idx_exceptions_order_id ON exceptions(order_id);
CREATE INDEX idx_exceptions_assignee_id ON exceptions(assignee_id);
CREATE INDEX idx_exceptions_type ON exceptions(type);
CREATE INDEX idx_exceptions_created_at ON exceptions(created_at);

-- ============================================================
-- 库存表
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  site_name VARCHAR(100) NOT NULL,
  sku VARCHAR(50) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  in_transit_quantity INTEGER DEFAULT 0,
  in_transit_from VARCHAR(100),
  in_transit_estimated_arrival TIMESTAMPTZ,
  unit_cost DECIMAL(10, 2),
  warning_threshold INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_inventory_site_sku ON inventory_items(site_id, sku);
CREATE INDEX idx_inventory_site_id ON inventory_items(site_id);
CREATE INDEX idx_inventory_available ON inventory_items(available_quantity);

-- ============================================================
-- 配送路线记录表
-- ============================================================

CREATE TABLE IF NOT EXISTS delivery_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  rider_name VARCHAR(50) NOT NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_no VARCHAR(50) NOT NULL,
  distance DECIMAL(10, 2) NOT NULL,
  duration INTEGER NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  order_count INTEGER DEFAULT 1,
  total_distance DECIMAL(10, 2),
  total_time INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_routes_rider_id ON delivery_routes(rider_id);
CREATE INDEX idx_delivery_routes_start_time ON delivery_routes(start_time);

-- ============================================================
-- 签收差异记录表
-- ============================================================

CREATE TABLE IF NOT EXISTS discrepancy_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_no VARCHAR(50) NOT NULL,
  expected_items INTEGER NOT NULL,
  actual_items INTEGER NOT NULL,
  difference INTEGER NOT NULL,
  reason TEXT,
  reported_by VARCHAR(50) NOT NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discrepancy_order_id ON discrepancy_records(order_id);
CREATE INDEX idx_discrepancy_status ON discrepancy_records(status);

-- ============================================================
-- 操作日志表
-- ============================================================

CREATE TABLE IF NOT EXISTS operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  operator_name VARCHAR(50) NOT NULL,
  operator_role VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  type operation_log_type NOT NULL,
  target_id VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  order_no VARCHAR(50),
  ip_address VARCHAR(45) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_operation_logs_type ON operation_logs(type);
CREATE INDEX idx_operation_logs_timestamp ON operation_logs(timestamp);
CREATE INDEX idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX idx_operation_logs_order_no ON operation_logs(order_no);

-- ============================================================
-- 通知表
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  order_id UUID REFERENCES orders(id),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================
-- 履约时效统计表
-- ============================================================

CREATE TABLE IF NOT EXISTS performance_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_orders INTEGER NOT NULL DEFAULT 0,
  on_time_deliveries INTEGER NOT NULL DEFAULT 0,
  late_deliveries INTEGER NOT NULL DEFAULT 0,
  on_time_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  avg_delivery_time INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 自动更新 updated_at 字段的触发器
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为各表添加触发器
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_riders_updated_at BEFORE UPDATE ON riders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exceptions_updated_at BEFORE UPDATE ON exceptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_stats_updated_at BEFORE UPDATE ON performance_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 行级安全策略 (RLS)
-- ============================================================

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE temperature_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discrepancy_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_stats ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有数据
CREATE POLICY "All tables are viewable by authenticated users" ON sites
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All tables are viewable by authenticated users" ON riders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All tables are viewable by authenticated users" ON orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All tables are viewable by authenticated users" ON tracking_points
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All tables are viewable by authenticated users" ON temperature_records
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All tables are viewable by authenticated users" ON exceptions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All tables are viewable by authenticated users" ON inventory_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All tables are viewable by authenticated users" ON delivery_routes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All tables are viewable by authenticated users" ON discrepancy_records
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All tables are viewable by authenticated users" ON operation_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All tables are viewable by authenticated users" ON notifications
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All tables are viewable by authenticated users" ON performance_stats
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- Realtime 发布
-- ============================================================

ALTER publication supabase_realtime ADD TABLE orders;
ALTER publication supabase_realtime ADD TABLE riders;
ALTER publication supabase_realtime ADD TABLE tracking_points;
ALTER publication supabase_realtime ADD TABLE temperature_records;
ALTER publication supabase_realtime ADD TABLE exceptions;
ALTER publication supabase_realtime ADD TABLE notifications;
