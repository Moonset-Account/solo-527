-- ============================================
-- 医院药房取药瓶颈分析系统 - PostGIS 数据模型
-- ============================================

-- 启用 PostGIS 扩展
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- ============================================
-- 维度表
-- ============================================

-- 科室表
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dept_name VARCHAR(100) NOT NULL,
    dept_category VARCHAR(20) NOT NULL CHECK (dept_category IN ('outpatient', 'emergency', 'inpatient', 'specialist')),
    daily_prescription_avg INTEGER DEFAULT 0,
    location GEOGRAPHY(POINT, 4326),
    floor INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_departments_location ON departments USING GIST(location);
CREATE INDEX idx_departments_category ON departments(dept_category);

-- 取药窗口表
CREATE TABLE IF NOT EXISTS windows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    window_no VARCHAR(10) NOT NULL UNIQUE,
    window_name VARCHAR(100) NOT NULL,
    area VARCHAR(20) NOT NULL CHECK (area IN ('outpatient', 'emergency', 'inpatient')),
    capacity INTEGER DEFAULT 200,
    is_active BOOLEAN DEFAULT true,
    location GEOGRAPHY(POINT, 4326),
    counter_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_windows_location ON windows USING GIST(location);
CREATE INDEX idx_windows_area ON windows(area);

-- 药师表
CREATE TABLE IF NOT EXISTS pharmacists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    title VARCHAR(50),
    specialty VARCHAR(100),
    default_window_id UUID REFERENCES windows(id),
    employee_no VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pharmacists_window ON pharmacists(default_window_id);

-- ============================================
-- 处方主表
-- ============================================

CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_no VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('emergency', 'normal', 'specialist')),
    department_id UUID REFERENCES departments(id) NOT NULL,
    window_id UUID REFERENCES windows(id),
    pharmacist_id UUID REFERENCES pharmacists(id),
    patient_id VARCHAR(100),
    patient_category VARCHAR(20) CHECK (patient_category IN ('insurance', 'self_pay', 'retired', 'public')),
    amount DECIMAL(10, 2) DEFAULT 0,
    drug_count INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    paid_at TIMESTAMP,
    dispensed_at TIMESTAMP,
    called_at TIMESTAMP,
    picked_at TIMESTAMP,
    refunded_at TIMESTAMP,
    wait_time_minutes INTEGER,
    dispense_time_minutes INTEGER,
    hour INTEGER,
    time_period VARCHAR(20),
    created_at_date DATE GENERATED ALWAYS AS (DATE(created_at)) STORED,
    location GEOGRAPHY(POINT, 4326),
    geom GEOMETRY(Point, 4326) GENERATED ALWAYS AS (location::geometry) STORED
);

CREATE INDEX idx_prescriptions_created_at ON prescriptions(created_at);
CREATE INDEX idx_prescriptions_created_date ON prescriptions(created_at_date);
CREATE INDEX idx_prescriptions_type ON prescriptions(type);
CREATE INDEX idx_prescriptions_window ON prescriptions(window_id);
CREATE INDEX idx_prescriptions_department ON prescriptions(department_id);
CREATE INDEX idx_prescriptions_pharmacist ON prescriptions(pharmacist_id);
CREATE INDEX idx_prescriptions_hour ON prescriptions(hour);
CREATE INDEX idx_prescriptions_time_period ON prescriptions(time_period);
CREATE INDEX idx_prescriptions_location ON prescriptions USING GIST(location);
CREATE INDEX idx_prescriptions_geom ON prescriptions USING GIST(geom);
CREATE INDEX idx_prescriptions_composite ON prescriptions(created_at_date, type, window_id);

-- ============================================
-- 流程节点明细表
-- ============================================

CREATE TABLE IF NOT EXISTS process_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE NOT NULL,
    node_type VARCHAR(20) NOT NULL CHECK (node_type IN ('create', 'pay', 'dispense', 'call', 'pick', 'refund')),
    occurred_at TIMESTAMP NOT NULL,
    duration_seconds DECIMAL(10, 2),
    operator_id UUID REFERENCES pharmacists(id),
    operator_name VARCHAR(50),
    window_id UUID REFERENCES windows(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_process_nodes_prescription ON process_nodes(prescription_id);
CREATE INDEX idx_process_nodes_type ON process_nodes(node_type);
CREATE INDEX idx_process_nodes_occurred ON process_nodes(occurred_at);

-- ============================================
-- 人工备注表
-- ============================================

CREATE TABLE IF NOT EXISTS remarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('prescription', 'window', 'period', 'metric')),
    target_value VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (severity IN ('normal', 'warning', 'critical')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_remarks_target ON remarks(target_type, target_value);
CREATE INDEX idx_remarks_severity ON remarks(severity);
CREATE INDEX idx_remarks_created ON remarks(created_at);

-- ============================================
-- 空间视图：药房窗口热力图
-- ============================================

CREATE OR REPLACE VIEW v_window_heatmap AS
SELECT
    w.id AS window_id,
    w.window_no,
    w.window_name,
    w.area,
    w.location,
    COUNT(p.id) AS prescription_count,
    ROUND(AVG(p.wait_time_minutes)::numeric, 1) AS avg_wait_time,
    ROUND((COUNT(p.id)::numeric / (w.capacity * 30)) * 100, 1) AS utilization_rate,
    CASE
        WHEN (COUNT(p.id)::numeric / (w.capacity * 30)) * 100 > 80 THEN 'critical'
        WHEN (COUNT(p.id)::numeric / (w.capacity * 30)) * 100 > 50 THEN 'warning'
        ELSE 'normal'
    END AS status
FROM windows w
LEFT JOIN prescriptions p ON p.window_id = w.id
    AND p.created_at_date >= CURRENT_DATE - INTERVAL '30 days'
WHERE w.is_active = true
GROUP BY w.id, w.window_no, w.window_name, w.area, w.location, w.capacity;

-- ============================================
-- 空间视图：科室处方分布
-- ============================================

CREATE OR REPLACE VIEW v_dept_prescription_distribution AS
SELECT
    d.id AS department_id,
    d.dept_name,
    d.dept_category,
    d.location,
    COUNT(p.id) AS total_prescriptions,
    COUNT(CASE WHEN p.type = 'emergency' THEN 1 END) AS emergency_count,
    COUNT(CASE WHEN p.type = 'normal' THEN 1 END) AS normal_count,
    ROUND(AVG(p.wait_time_minutes)::numeric, 1) AS avg_wait_time,
    d.floor
FROM departments d
LEFT JOIN prescriptions p ON p.department_id = d.id
    AND p.created_at_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY d.id, d.dept_name, d.dept_category, d.location, d.floor;

-- ============================================
-- 函数：按空间范围查询处方
-- ============================================

CREATE OR REPLACE FUNCTION get_prescriptions_in_polygon(
    poly_geom GEOMETRY(Polygon, 4326),
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    prescription_id UUID,
    prescription_no VARCHAR(50),
    type VARCHAR(20),
    department_name VARCHAR(100),
    window_no VARCHAR(10),
    pharmacist_name VARCHAR(50),
    wait_time_minutes INTEGER,
    created_at TIMESTAMP,
    location GEOGRAPHY(Point, 4326)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.prescription_no,
        p.type,
        d.dept_name,
        w.window_no,
        ph.name,
        p.wait_time_minutes,
        p.created_at,
        p.location
    FROM prescriptions p
    JOIN departments d ON p.department_id = d.id
    JOIN windows w ON p.window_id = w.id
    LEFT JOIN pharmacists ph ON p.pharmacist_id = ph.id
    WHERE ST_Contains(poly_geom, p.geom)
      AND p.created_at_date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 函数：计算窗口邻域密度
-- ============================================

CREATE OR REPLACE FUNCTION calculate_window_density(
    window_id UUID,
    radius_meters INTEGER DEFAULT 50,
    lookback_days INTEGER DEFAULT 7
)
RETURNS NUMERIC AS $$
DECLARE
    window_loc GEOGRAPHY;
    density NUMERIC;
BEGIN
    SELECT location INTO window_loc FROM windows WHERE id = window_id;

    SELECT COUNT(*)::NUMERIC INTO density
    FROM prescriptions p
    WHERE ST_DWithin(p.location, window_loc, radius_meters)
      AND p.created_at >= CURRENT_TIMESTAMP - (lookback_days || ' days')::INTERVAL;

    RETURN density;
END;
$$ LANGUAGE plpgsql STABLE;
