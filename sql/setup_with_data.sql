-- ============================================================
-- 医院药房取药瓶颈分析 - PostGIS 数据库初始化 + 种子数据脚本
-- ============================================================
-- 使用方法：
--   psql -U postgres -d pharmacy_analytics -f sql/setup_with_data.sql
-- ============================================================

-- 启用 PostGIS 扩展
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- ============================================================
-- 创建表结构
-- ============================================================

-- 科室表
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dept_code VARCHAR(32) UNIQUE NOT NULL,
  dept_name VARCHAR(100) NOT NULL,
  dept_type VARCHAR(32) DEFAULT 'clinical',
  location GEOGRAPHY(Point, 4326),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 窗口表（带空间位置）
CREATE TABLE IF NOT EXISTS windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  window_no VARCHAR(16) UNIQUE NOT NULL,
  window_name VARCHAR(100) NOT NULL,
  window_type VARCHAR(32) DEFAULT 'general',
  location GEOGRAPHY(Point, 4326),
  capacity INTEGER DEFAULT 200,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 药师表
CREATE TABLE IF NOT EXISTS pharmacists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_no VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  title VARCHAR(32),
  phone VARCHAR(20),
  window_id UUID REFERENCES windows(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 处方主表（含空间信息和全流程时间戳）
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_no VARCHAR(64) UNIQUE NOT NULL,
  type VARCHAR(16) NOT NULL DEFAULT 'normal',
  department_id UUID REFERENCES departments(id),
  window_id UUID REFERENCES windows(id),
  pharmacist_id UUID REFERENCES pharmacists(id),
  patient_id VARCHAR(64),
  patient_category VARCHAR(32),
  amount DECIMAL(10, 2) DEFAULT 0,
  drug_count INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  created_at_date DATE GENERATED ALWAYS AS (DATE(created_at)) STORED,
  paid_at TIMESTAMP,
  dispensed_at TIMESTAMP,
  called_at TIMESTAMP,
  picked_at TIMESTAMP,
  refunded_at TIMESTAMP,
  wait_time_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (COALESCE(picked_at, CURRENT_TIMESTAMP) - created_at)) / 60
  ) STORED,
  dispense_time_minutes INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN dispensed_at IS NOT NULL AND paid_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (dispensed_at - paid_at)) / 60
      ELSE 0
    END
  ) STORED,
  hour INTEGER GENERATED ALWAYS AS (EXTRACT(HOUR FROM created_at)) STORED,
  time_period VARCHAR(16) GENERATED ALWAYS AS (
    CASE
      WHEN EXTRACT(HOUR FROM created_at) < 8 THEN 'early_morning'
      WHEN EXTRACT(HOUR FROM created_at) < 12 THEN 'morning'
      WHEN EXTRACT(HOUR FROM created_at) < 14 THEN 'noon'
      WHEN EXTRACT(HOUR FROM created_at) < 17 THEN 'afternoon'
      WHEN EXTRACT(HOUR FROM created_at) < 20 THEN 'evening'
      ELSE 'night'
    END
  ) STORED,
  patient_location GEOGRAPHY(Point, 4326),
  status VARCHAR(16) DEFAULT 'pending',
  created_at_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 流程节点明细表
CREATE TABLE IF NOT EXISTS process_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  node_type VARCHAR(32) NOT NULL,
  node_name VARCHAR(64) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  duration_seconds INTEGER,
  operator_id VARCHAR(64),
  remark TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 人工备注表
CREATE TABLE IF NOT EXISTS remarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type VARCHAR(32) NOT NULL,
  target_value VARCHAR(128) NOT NULL,
  target_title VARCHAR(256),
  content TEXT NOT NULL,
  author VARCHAR(64) DEFAULT '系统',
  severity VARCHAR(16) DEFAULT 'info',
  prescription_id UUID REFERENCES prescriptions(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 创建索引
-- ============================================================

-- 空间索引（PostGIS GIST 索引）
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_location ON prescriptions USING GIST (patient_location);
CREATE INDEX IF NOT EXISTS idx_windows_location ON windows USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_departments_location ON departments USING GIST (location);

-- 复合索引 - 用于日期范围 + 维度筛选
CREATE INDEX IF NOT EXISTS idx_prescriptions_composite ON prescriptions (created_at_date, type, window_id, department_id, status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_created_at ON prescriptions (created_at);
CREATE INDEX IF NOT EXISTS idx_prescriptions_type ON prescriptions (type);
CREATE INDEX IF NOT EXISTS idx_prescriptions_window_id ON prescriptions (window_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_hour ON prescriptions (hour);
CREATE INDEX IF NOT EXISTS idx_prescriptions_time_period ON prescriptions (time_period);

-- 外键索引
CREATE INDEX IF NOT EXISTS idx_prescriptions_department_id ON prescriptions (department_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_pharmacist_id ON prescriptions (pharmacist_id);
CREATE INDEX IF NOT EXISTS idx_process_nodes_prescription_id ON process_nodes (prescription_id);
CREATE INDEX IF NOT EXISTS idx_remarks_prescription_id ON remarks (prescription_id);

-- ============================================================
-- 插入种子数据 - 科室
-- ============================================================
INSERT INTO departments (id, dept_code, dept_name, dept_type, location, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'EMG', '急诊科', 'emergency', ST_SetSRID(ST_MakePoint(116.3970, 39.9075), 4326), 1),
  ('00000000-0000-0000-0000-000000000002', 'INT', '内科', 'clinical', ST_SetSRID(ST_MakePoint(116.3968, 39.9073), 4326), 2),
  ('00000000-0000-0000-0000-000000000003', 'SUR', '外科', 'clinical', ST_SetSRID(ST_MakePoint(116.3972, 39.9073), 4326), 3),
  ('00000000-0000-0000-0000-000000000004', 'PED', '儿科', 'clinical', ST_SetSRID(ST_MakePoint(116.3969, 39.9071), 4326), 4),
  ('00000000-0000-0000-0000-000000000005', 'GYN', '妇产科', 'clinical', ST_SetSRID(ST_MakePoint(116.3971, 39.9071), 4326), 5),
  ('00000000-0000-0000-0000-000000000006', 'ONC', '肿瘤科', 'specialist', ST_SetSRID(ST_MakePoint(116.3967, 39.9069), 4326), 6),
  ('00000000-0000-0000-0000-000000000007', 'CAR', '心内科', 'specialist', ST_SetSRID(ST_MakePoint(116.3973, 39.9069), 4326), 7),
  ('00000000-0000-0000-0000-000000000008', 'NEU', '神经内科', 'specialist', ST_SetSRID(ST_MakePoint(116.3969, 39.9067), 4326), 8),
  ('00000000-0000-0000-0000-000000000009', 'DER', '皮肤科', 'clinical', ST_SetSRID(ST_MakePoint(116.3971, 39.9067), 4326), 9),
  ('00000000-0000-0000-0000-000000000010', 'OPH', '眼科', 'clinical', ST_SetSRID(ST_MakePoint(116.3970, 39.9065), 4326), 10)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 插入种子数据 - 窗口
-- ============================================================
INSERT INTO windows (id, window_no, window_name, window_type, location, capacity, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000101', '1', '1号窗口', 'general', ST_SetSRID(ST_MakePoint(116.39680, 39.90720), 4326), 200, 1),
  ('00000000-0000-0000-0000-000000000102', '2', '2号窗口', 'general', ST_SetSRID(ST_MakePoint(116.39690, 39.90720), 4326), 200, 2),
  ('00000000-0000-0000-0000-000000000103', '3', '3号窗口', 'general', ST_SetSRID(ST_MakePoint(116.39700, 39.90720), 4326), 200, 3),
  ('00000000-0000-0000-0000-000000000104', '4', '4号窗口', 'emergency', ST_SetSRID(ST_MakePoint(116.39710, 39.90720), 4326), 180, 4),
  ('00000000-0000-0000-0000-000000000105', '5', '5号窗口', 'specialist', ST_SetSRID(ST_MakePoint(116.39695, 39.90700), 4326), 150, 5),
  ('00000000-0000-0000-0000-000000000106', '6', '6号窗口', 'specialist', ST_SetSRID(ST_MakePoint(116.39705, 39.90700), 4326), 150, 6)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 插入种子数据 - 药师
-- ============================================================
INSERT INTO pharmacists (id, employee_no, name, title, window_id) VALUES
  ('00000000-0000-0000-0000-000000000201', 'PH001', '张药师', '主管药师', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000202', 'PH002', '李药师', '药师', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000203', 'PH003', '王药师', '副主任药师', '00000000-0000-0000-0000-000000000103'),
  ('00000000-0000-0000-0000-000000000204', 'PH004', '赵药师', '主管药师', '00000000-0000-0000-0000-000000000104'),
  ('00000000-0000-0000-0000-000000000205', 'PH005', '刘药师', '药师', '00000000-0000-0000-0000-000000000105'),
  ('00000000-0000-0000-0000-000000000206', 'PH006', '陈药师', '药师', '00000000-0000-0000-0000-000000000106'),
  ('00000000-0000-0000-0000-000000000207', 'PH007', '杨药师', '主管药师', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000208', 'PH008', '黄药师', '药师', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000209', 'PH009', '周药师', '药师', '00000000-0000-0000-0000-000000000103'),
  ('00000000-0000-0000-0000-000000000210', 'PH010', '吴药师', '副主任药师', '00000000-0000-0000-0000-000000000104')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 创建生成处方数据的函数
-- ============================================================
CREATE OR REPLACE FUNCTION generate_sample_prescriptions(days_back INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  total_inserted INTEGER;
BEGIN
  -- 清空现有处方数据
  TRUNCATE TABLE prescriptions CASCADE;

  -- 生成 30 天的处方数据，每天约 200-300 张
  WITH date_series AS (
    SELECT
      d::date as dt,
      CASE WHEN EXTRACT(DOW FROM d) IN (0, 6) THEN 0.6 ELSE 1.0 END as weekday_factor
    FROM generate_series(CURRENT_DATE - days_back, CURRENT_DATE - 1, '1 day'::interval) d
  ),
  hour_weights AS (
    SELECT h, w FROM (VALUES
      (6, 0.2), (7, 0.5), (8, 1.2), (9, 1.8), (10, 2.0), (11, 1.5),
      (12, 0.8), (13, 0.9), (14, 1.4), (15, 1.7), (16, 1.6), (17, 1.2),
      (18, 0.7), (19, 0.4), (20, 0.3), (21, 0.2), (22, 0.1)
    ) as t(h, w)
  ),
  raw_prescriptions AS (
    SELECT
      'RX' || to_char(dt, 'YYYYMMDD') || '_' || lpad((row_number() OVER (ORDER BY dt, h))::text, 5, '0') as prescription_no,
      CASE
        WHEN random() < 0.15 THEN 'emergency'
        WHEN random() < 0.75 THEN 'normal'
        ELSE 'specialist'
      END as type,
      (ARRAY['00000000-0000-0000-0000-000000000001',
             '00000000-0000-0000-0000-000000000002',
             '00000000-0000-0000-0000-000000000003',
             '00000000-0000-0000-0000-000000000004',
             '00000000-0000-0000-0000-000000000005',
             '00000000-0000-0000-0000-000000000006',
             '00000000-0000-0000-0000-000000000007',
             '00000000-0000-0000-0000-000000000008',
             '00000000-0000-0000-0000-000000000009',
             '00000000-0000-0000-0000-000000000010'])[floor(random() * 10) + 1]::uuid as department_id,
      (ARRAY['00000000-0000-0000-0000-000000000101',
             '00000000-0000-0000-0000-000000000102',
             '00000000-0000-0000-0000-000000000103',
             '00000000-0000-0000-0000-000000000104',
             '00000000-0000-0000-0000-000000000105',
             '00000000-0000-0000-0000-000000000106'])[floor(random() * 6) + 1]::uuid as window_id,
      (ARRAY['00000000-0000-0000-0000-000000000201',
             '00000000-0000-0000-0000-000000000202',
             '00000000-0000-0000-0000-000000000203',
             '00000000-0000-0000-0000-000000000204',
             '00000000-0000-0000-0000-000000000205',
             '00000000-0000-0000-0000-000000000206',
             '00000000-0000-0000-0000-000000000207',
             '00000000-0000-0000-0000-000000000208',
             '00000000-0000-0000-0000-000000000209',
             '00000000-0000-0000-0000-000000000210'])[floor(random() * 10) + 1]::uuid as pharmacist_id,
      dt + (h || ' hours')::interval + (floor(random() * 60) || ' minutes')::interval as created_at,
      NULL::timestamp as paid_at,
      NULL::timestamp as dispensed_at,
      NULL::timestamp as called_at,
      NULL::timestamp as picked_at,
      NULL::timestamp as refunded_at,
      CASE WHEN random() < 0.1 THEN 'vip' ELSE 'normal' END as patient_category,
      round((random() * 300 + 20)::numeric, 2) as amount,
      floor(random() * 8 + 1) as drug_count,
      ST_SetSRID(ST_MakePoint(116.3968 + random() * 0.0006, 39.9068 + random() * 0.0006), 4326) as patient_location,
      CASE WHEN random() < 0.03 THEN 'refunded' ELSE 'completed' END as status
    FROM date_series ds
    CROSS JOIN hour_weights hw
    CROSS JOIN generate_series(1, (10 * weekday_factor * w)::int)
  )
  INSERT INTO prescriptions (
    prescription_no, type, department_id, window_id, pharmacist_id,
    created_at, patient_category, amount, drug_count, patient_location, status
  )
  SELECT
    prescription_no,
    type,
    department_id,
    window_id,
    pharmacist_id,
    created_at,
    patient_category,
    amount,
    drug_count,
    patient_location,
    status
  FROM raw_prescriptions;

  GET DIAGNOSTICS total_inserted = ROW_COUNT;

  -- 回填流程时间戳
  UPDATE prescriptions SET
    paid_at = created_at + (floor(random() * 10 + 1) || ' minutes')::interval,
    dispensed_at = created_at + (floor(random() * 25 + 8) || ' minutes')::interval,
    called_at = created_at + (floor(random() * 30 + 12) || ' minutes')::interval,
    picked_at = CASE
      WHEN status = 'refunded' THEN NULL
      ELSE created_at + (floor(random() * 40 + 15) || ' minutes')::interval
    END,
    refunded_at = CASE
      WHEN status = 'refunded' THEN created_at + (floor(random() * 60 + 20) || ' minutes')::interval
      ELSE NULL
    END;

  -- 急诊处方等待时长更短
  UPDATE prescriptions SET
    dispensed_at = created_at + (floor(random() * 12 + 3) || ' minutes')::interval,
    picked_at = created_at + (floor(random() * 20 + 8) || ' minutes')::interval
  WHERE type = 'emergency' AND status = 'completed';

  -- 专科处方等待时长更长
  UPDATE prescriptions SET
    dispensed_at = created_at + (floor(random() * 35 + 15) || ' minutes')::interval,
    picked_at = created_at + (floor(random() * 50 + 25) || ' minutes')::interval
  WHERE type = 'specialist' AND status = 'completed';

  RETURN total_inserted;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 创建空间视图
-- ============================================================
CREATE OR REPLACE VIEW v_window_heatmap AS
SELECT
  w.id as window_id,
  w.window_no,
  w.window_name,
  w.location,
  ST_X(w.location::geometry) as lng,
  ST_Y(w.location::geometry) as lat,
  COUNT(p.id) as prescription_count,
  ROUND(AVG(p.wait_time_minutes)::numeric, 1) as avg_wait_time,
  ROUND(COUNT(p.id)::numeric / (w.capacity * 30) * 100, 1) as utilization_rate,
  CASE
    WHEN COUNT(p.id)::numeric / (w.capacity * 30) > 0.8 THEN 'critical'
    WHEN COUNT(p.id)::numeric / (w.capacity * 30) > 0.5 THEN 'warning'
    ELSE 'normal'
  END as status
FROM windows w
LEFT JOIN prescriptions p ON p.window_id = w.id
  AND p.created_at_date >= CURRENT_DATE - 30
WHERE w.is_active = true
GROUP BY w.id, w.window_no, w.window_name, w.location, w.capacity;

CREATE OR REPLACE VIEW v_dept_prescription_distribution AS
SELECT
  d.id as department_id,
  d.dept_code,
  d.dept_name,
  d.location,
  ST_X(d.location::geometry) as lng,
  ST_Y(d.location::geometry) as lat,
  COUNT(p.id) as total_count,
  COUNT(CASE WHEN p.type = 'emergency' THEN 1 END) as emergency_count,
  ROUND(AVG(p.wait_time_minutes)::numeric, 1) as avg_wait_time,
  ROUND(AVG(p.amount)::numeric, 2) as avg_amount
FROM departments d
LEFT JOIN prescriptions p ON p.department_id = d.id
  AND p.created_at_date >= CURRENT_DATE - 30
WHERE d.is_active = true
GROUP BY d.id, d.dept_code, d.dept_name, d.location;

-- ============================================================
-- 执行数据生成
-- ============================================================
SELECT generate_sample_prescriptions(30);

-- ============================================================
-- 插入示例备注
-- ============================================================
INSERT INTO remarks (target_type, target_value, target_title, content, author, severity) VALUES
  ('window', '3', '3号窗口', '上午9-11点3号窗口排队严重，建议增加临时药师支援', '张主任', 'warning'),
  ('metric', '平均等待时长', '平均等待时长', '本周平均等待时长较上周下降8.3%，配药效率提升明显', '系统', 'info'),
  ('period', '09:00', '时段 09:00', '早高峰时段患者集中到达，建议提前开窗', '李药师', 'warning')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 验证数据
-- ============================================================
SELECT '数据库初始化完成！' as status;
SELECT COUNT(*) as total_prescriptions FROM prescriptions;
SELECT COUNT(*) as total_windows FROM windows;
SELECT COUNT(*) as total_departments FROM departments;
SELECT COUNT(*) as total_pharmacists FROM pharmacists;
