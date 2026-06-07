-- =============================================
-- 冷链疫苗温度合规分析 - TimescaleDB 初始化脚本
-- 执行方式: psql -U postgres -d cold_chain -f init_timescaledb.sql
-- =============================================

-- 1. 创建扩展
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- 2. 创建运输批次表
CREATE TABLE IF NOT EXISTS shipments (
    shipment_id SERIAL PRIMARY KEY,
    box_id TEXT UNIQUE NOT NULL,
    batch_no TEXT NOT NULL,
    route TEXT NOT NULL,
    from_station TEXT NOT NULL,
    to_station TEXT NOT NULL,
    signoff_time TIMESTAMPTZ,
    status TEXT DEFAULT 'completed',
    review_status TEXT DEFAULT 'none',
    review_note TEXT DEFAULT '',
    signoff_photo_url TEXT DEFAULT '',
    sample_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建温度采样时序表（转为 hypertable）
CREATE TABLE IF NOT EXISTS temperature_samples (
    sample_id BIGSERIAL,
    shipment_id INTEGER NOT NULL REFERENCES shipments(shipment_id),
    box_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    temperature DOUBLE PRECISION,
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_reason TEXT DEFAULT '',
    is_cleaned BOOLEAN DEFAULT FALSE,
    cleaned_reason TEXT DEFAULT ''
);

-- 4. 创建 hypertable（按天分块）
SELECT create_hypertable(
    'temperature_samples', 
    'timestamp',
    if_not_exists => TRUE,
    chunk_time_interval => INTERVAL '1 day'
);

-- 5. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_samples_shipment_time 
    ON temperature_samples(shipment_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_samples_box_time 
    ON temperature_samples(box_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_batch 
    ON shipments(batch_no);
CREATE INDEX IF NOT EXISTS idx_shipments_route 
    ON shipments(route);
CREATE INDEX IF NOT EXISTS idx_shipments_review 
    ON shipments(review_status);
CREATE INDEX IF NOT EXISTS idx_shipments_signoff 
    ON shipments(signoff_time DESC);

-- 6. 视图：合规批次（排除复核/申诉中）
CREATE OR REPLACE VIEW v_compliant_shipments AS
SELECT 
    s.*,
    COUNT(ts.sample_id) as actual_sample_count,
    AVG(ts.temperature) as avg_temp,
    MAX(ts.temperature) as max_temp,
    MIN(ts.temperature) as min_temp
FROM shipments s
LEFT JOIN temperature_samples ts ON s.shipment_id = ts.shipment_id
WHERE s.review_status NOT IN ('pending', 'appealed')
GROUP BY s.shipment_id;

-- 7. 视图：待复核批次
CREATE OR REPLACE VIEW v_pending_shipments AS
SELECT 
    s.*,
    COUNT(ts.sample_id) as actual_sample_count
FROM shipments s
LEFT JOIN temperature_samples ts ON s.shipment_id = ts.shipment_id
WHERE s.review_status IN ('pending', 'appealed')
GROUP BY s.shipment_id;

-- 8. 连续聚合视图：每日温度统计（TimescaleDB 特性）
-- CREATE MATERIALIZED VIEW daily_temp_stats
-- WITH (timescaledb.continuous) AS
-- SELECT
--     time_bucket('1 day', ts.timestamp) as bucket,
--     s.route,
--     s.from_station,
--     s.to_station,
--     COUNT(*) as sample_count,
--     AVG(ts.temperature) as avg_temp,
--     MAX(ts.temperature) as max_temp,
--     MIN(ts.temperature) as min_temp
-- FROM temperature_samples ts
-- JOIN shipments s ON ts.shipment_id = s.shipment_id
-- GROUP BY 1, 2, 3, 4;

-- 9. 示例查询：获取某批次温度曲线
-- SELECT timestamp, temperature, is_anomaly, cleaned_reason
-- FROM temperature_samples
-- WHERE box_id = 'BOX000001'
-- ORDER BY timestamp;

-- 10. 示例查询：获取各路线平均合规率
-- SELECT 
--     route,
--     COUNT(*) as shipment_count,
--     AVG(CASE WHEN max_temp <= 8 AND min_temp >= 2 THEN 100 ELSE 0 END) as compliance_rate
-- FROM v_compliant_shipments
-- GROUP BY route
-- ORDER BY compliance_rate DESC;

-- 完成提示
SELECT 'TimescaleDB 初始化完成！';
