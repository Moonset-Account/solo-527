-- =====================================================
-- 工厂设备停机原因看板 - TimescaleDB Schema
-- =====================================================
-- 初始化步骤：
-- 1. 创建数据库: CREATE DATABASE downtime_analysis;
-- 2. 切换数据库: \c downtime_analysis
-- 3. 启用 TimescaleDB 扩展: CREATE EXTENSION IF NOT EXISTS timescaledb;
-- 4. 执行本脚本

-- =====================================================
-- 1. 启用扩展
-- =====================================================
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- =====================================================
-- 2. 维度表
-- =====================================================

-- 产线表
CREATE TABLE IF NOT EXISTS production_lines (
    line_id INTEGER PRIMARY KEY,
    line_name VARCHAR(50) NOT NULL,
    line_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 设备表
CREATE TABLE IF NOT EXISTS equipment (
    equipment_id INTEGER PRIMARY KEY,
    equipment_name VARCHAR(100) NOT NULL,
    line_id INTEGER REFERENCES production_lines(line_id),
    equipment_model VARCHAR(100),
    install_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 班次表
CREATE TABLE IF NOT EXISTS shifts (
    shift_id INTEGER PRIMARY KEY,
    shift_name VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 故障类型表
CREATE TABLE IF NOT EXISTS fault_types (
    fault_code VARCHAR(20) PRIMARY KEY,
    fault_name VARCHAR(50) NOT NULL,
    fault_category VARCHAR(50),
    fault_description TEXT,
    fault_suggestion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 维修人员表
CREATE TABLE IF NOT EXISTS repair_persons (
    person_id SERIAL PRIMARY KEY,
    person_name VARCHAR(50) NOT NULL UNIQUE,
    skill_level VARCHAR(20),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 备件表
CREATE TABLE IF NOT EXISTS spare_parts (
    part_id INTEGER PRIMARY KEY,
    part_name VARCHAR(100) NOT NULL,
    part_category VARCHAR(50),
    unit_price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. 时序主表 - 停机事件 (使用 TimescaleDB 超表)
-- =====================================================
CREATE TABLE IF NOT EXISTS downtime_events (
    event_id BIGSERIAL,
    event_time TIMESTAMP NOT NULL,
    equipment_id INTEGER REFERENCES equipment(equipment_id),
    line_id INTEGER REFERENCES production_lines(line_id),
    shift_id INTEGER REFERENCES shifts(shift_id),
    fault_code VARCHAR(20) REFERENCES fault_types(fault_code),
    breakdown_type VARCHAR(20) NOT NULL CHECK (breakdown_type IN ('planned', 'unplanned')),
    description TEXT,
    duration_minutes DECIMAL(10, 2) NOT NULL,
    severity VARCHAR(20),
    reported_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, event_time)
);

-- 转换为超表
SELECT create_hypertable('downtime_events', 'event_time', 
    if_not_exists => TRUE,
    chunk_time_interval => INTERVAL '1 day'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_downtime_line_id ON downtime_events(line_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_downtime_equipment_id ON downtime_events(equipment_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_downtime_fault_code ON downtime_events(fault_code, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_downtime_breakdown_type ON downtime_events(breakdown_type, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_downtime_shift_id ON downtime_events(shift_id, event_time DESC);

-- =====================================================
-- 4. 维修工单表
-- =====================================================
CREATE TABLE IF NOT EXISTS maintenance_work_orders (
    order_id BIGSERIAL PRIMARY KEY,
    event_id BIGINT,
    event_time TIMESTAMP NOT NULL,
    equipment_id INTEGER REFERENCES equipment(equipment_id),
    fault_code VARCHAR(20) REFERENCES fault_types(fault_code),
    report_time TIMESTAMP NOT NULL,
    start_time TIMESTAMP,
    complete_time TIMESTAMP,
    repair_duration_minutes DECIMAL(10, 2),
    repair_person VARCHAR(50),
    repair_action TEXT,
    root_cause TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 转换为超表
SELECT create_hypertable('maintenance_work_orders', 'event_time',
    if_not_exists => TRUE,
    chunk_time_interval => INTERVAL '1 day'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_work_order_equipment ON maintenance_work_orders(equipment_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_work_order_person ON maintenance_work_orders(repair_person, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_work_order_status ON maintenance_work_orders(status, event_time DESC);

-- =====================================================
-- 5. 备件使用记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS spare_part_usages (
    usage_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT,
    event_time TIMESTAMP NOT NULL,
    event_id BIGINT,
    equipment_id INTEGER REFERENCES equipment(equipment_id),
    fault_code VARCHAR(20) REFERENCES fault_types(fault_code),
    part_id INTEGER REFERENCES spare_parts(part_id),
    part_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 转换为超表
SELECT create_hypertable('spare_part_usages', 'event_time',
    if_not_exists => TRUE,
    chunk_time_interval => INTERVAL '1 day'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_usage_fault_code ON spare_part_usages(fault_code, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_usage_part_id ON spare_part_usages(part_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_usage_equipment ON spare_part_usages(equipment_id, event_time DESC);

-- =====================================================
-- 6. 数据质量检查视图
-- =====================================================
CREATE OR REPLACE VIEW v_data_quality_check AS
SELECT 
    'downtime_events' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE breakdown_type = 'planned') as planned_count,
    COUNT(*) FILTER (WHERE breakdown_type = 'unplanned') as unplanned_count,
    MIN(event_time) as min_date,
    MAX(event_time) as max_date
FROM downtime_events
UNION ALL
SELECT 
    'maintenance_work_orders' as table_name,
    COUNT(*) as total_records,
    NULL as planned_count,
    NULL as unplanned_count,
    MIN(event_time) as min_date,
    MAX(event_time) as max_date
FROM maintenance_work_orders
UNION ALL
SELECT 
    'spare_part_usages' as table_name,
    COUNT(*) as total_records,
    NULL as planned_count,
    NULL as unplanned_count,
    MIN(event_time) as min_date,
    MAX(event_time) as max_date
FROM spare_part_usages;

-- =====================================================
-- 7. 常用查询视图 - KPI 日汇总
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_kpi
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', event_time) as bucket_day,
    line_id,
    breakdown_type,
    COUNT(*) as event_count,
    SUM(duration_minutes) as total_duration,
    AVG(duration_minutes) as avg_duration
FROM downtime_events
GROUP BY bucket_day, line_id, breakdown_type
WITH DATA;

-- 启用实时聚合
ALTER MATERIALIZED VIEW mv_daily_kpi SET (timescaledb.materialized_only = false);

-- =====================================================
-- 8. 示例数据插入（可选，用于测试）
-- =====================================================
-- 注意：如果需要导入 Mock 数据到数据库，可以使用脚本
-- python database/import_mock_to_db.py

COMMIT;
