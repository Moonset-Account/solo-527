CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS monitoring_stations (
    station_id SERIAL PRIMARY KEY,
    station_name VARCHAR(100) NOT NULL,
    district VARCHAR(50) NOT NULL,
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    station_type VARCHAR(50) DEFAULT 'standard',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS air_quality_raw (
    record_id BIGSERIAL,
    timestamp TIMESTAMPTZ NOT NULL,
    station_id INTEGER NOT NULL REFERENCES monitoring_stations(station_id),
    pm25 DECIMAL(8, 2),
    pm10 DECIMAL(8, 2),
    o3 DECIMAL(8, 2),
    no2 DECIMAL(8, 2),
    so2 DECIMAL(8, 2),
    co DECIMAL(8, 2),
    temperature DECIMAL(5, 2),
    humidity DECIMAL(5, 2),
    wind_direction DECIMAL(5, 2),
    wind_speed DECIMAL(5, 2),
    is_anomaly BOOLEAN DEFAULT false,
    anomaly_reason VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (record_id, timestamp)
);

SELECT create_hypertable('air_quality_raw', 'timestamp',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

CREATE INDEX IF NOT EXISTS idx_air_quality_station_time ON air_quality_raw(station_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_air_quality_anomaly ON air_quality_raw(is_anomaly) WHERE is_anomaly = true;

CREATE TABLE IF NOT EXISTS traffic_flow (
    record_id BIGSERIAL,
    timestamp TIMESTAMPTZ NOT NULL,
    station_id INTEGER NOT NULL REFERENCES monitoring_stations(station_id),
    vehicle_count INTEGER,
    average_speed DECIMAL(5, 2),
    congestion_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (record_id, timestamp)
);

SELECT create_hypertable('traffic_flow', 'timestamp',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

CREATE TABLE IF NOT EXISTS construction_sites (
    site_id SERIAL PRIMARY KEY,
    site_name VARCHAR(100) NOT NULL,
    district VARCHAR(50) NOT NULL,
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    construction_type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaint_records (
    complaint_id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    district VARCHAR(50) NOT NULL,
    complaint_type VARCHAR(50) NOT NULL,
    description TEXT,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    reporter_name VARCHAR(100),
    reporter_contact VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_complaints_time_district ON complaint_records(timestamp DESC, district);
CREATE INDEX IF NOT EXISTS idx_complaints_verified ON complaint_records(is_verified);

CREATE TABLE IF NOT EXISTS event_annotations (
    event_id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    event_title VARCHAR(200) NOT NULL,
    event_description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    district VARCHAR(50),
    station_id INTEGER REFERENCES monitoring_stations(station_id),
    related_pollutant VARCHAR(20),
    created_by VARCHAR(50) DEFAULT 'system',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_update_log (
    log_id SERIAL PRIMARY KEY,
    data_type VARCHAR(50) NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    record_count INTEGER DEFAULT 0,
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE MATERIALIZED VIEW IF NOT EXISTS air_quality_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', timestamp) AS hour_bucket,
    station_id,
    AVG(pm25) AS pm25_avg,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pm25) AS pm25_median,
    MAX(pm25) AS pm25_max,
    MIN(pm25) AS pm25_min,
    COUNT(*) FILTER (WHERE pm25 IS NOT NULL) AS pm25_count,
    AVG(o3) AS o3_avg,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o3) AS o3_median,
    MAX(o3) AS o3_max,
    MIN(o3) AS o3_min,
    COUNT(*) FILTER (WHERE o3 IS NOT NULL) AS o3_count,
    AVG(pm10) AS pm10_avg,
    AVG(no2) AS no2_avg,
    AVG(so2) AS so2_avg,
    AVG(co) AS co_avg,
    AVG(temperature) AS temperature_avg,
    AVG(humidity) AS humidity_avg,
    AVG(wind_direction) AS wind_direction_avg,
    AVG(wind_speed) AS wind_speed_avg,
    COUNT(*) AS record_count,
    COUNT(*) FILTER (WHERE is_anomaly = true) AS anomaly_count
FROM air_quality_raw
GROUP BY hour_bucket, station_id
WITH NO DATA;

CREATE MATERIALIZED VIEW IF NOT EXISTS air_quality_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', timestamp) AS day_bucket,
    station_id,
    AVG(pm25) AS pm25_avg,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pm25) AS pm25_median,
    MAX(pm25) AS pm25_max,
    MIN(pm25) AS pm25_min,
    COUNT(*) FILTER (WHERE pm25 IS NOT NULL) AS pm25_count,
    AVG(o3) AS o3_avg,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o3) AS o3_median,
    MAX(o3) AS o3_max,
    MIN(o3) AS o3_min,
    COUNT(*) FILTER (WHERE o3 IS NOT NULL) AS o3_count,
    AVG(pm10) AS pm10_avg,
    AVG(no2) AS no2_avg,
    AVG(so2) AS so2_avg,
    AVG(co) AS co_avg,
    COUNT(*) AS record_count,
    COUNT(*) FILTER (WHERE is_anomaly = true) AS anomaly_count
FROM air_quality_raw
GROUP BY day_bucket, station_id
WITH NO DATA;

INSERT INTO monitoring_stations (station_name, district, latitude, longitude, station_type) VALUES
('朝阳区监测站', '朝阳区', 39.9219, 116.4438, 'standard'),
('海淀区监测站', '海淀区', 39.9599, 116.2985, 'standard'),
('东城区监测站', '东城区', 39.9289, 116.4165, 'standard'),
('西城区监测站', '西城区', 39.9155, 116.3643, 'standard'),
('丰台区监测站', '丰台区', 39.8586, 116.2869, 'standard'),
('石景山区监测站', '石景山区', 39.9058, 116.2228, 'standard'),
('通州区监测站', '通州区', 39.9088, 116.6568, 'standard'),
('顺义区监测站', '顺义区', 40.1291, 116.6546, 'standard'),
('昌平区监测站', '昌平区', 40.2205, 116.2313, 'standard'),
('大兴区监测站', '大兴区', 39.7289, 116.3381, 'traffic');

INSERT INTO construction_sites (site_name, district, latitude, longitude, construction_type, start_date, end_date) VALUES
('CBD核心区改造', '朝阳区', 39.9189, 116.4567, 'commercial', '2024-01-15', '2025-06-30'),
('中关村科技园扩建', '海淀区', 39.9789, 116.3123, 'technology', '2024-03-01', '2025-12-31'),
('丽泽商务区建设', '丰台区', 39.8623, 116.3156, 'commercial', '2024-02-01', '2026-03-31'),
('通州副中心建设', '通州区', 39.9045, 116.6623, 'government', '2023-06-01', '2025-12-31');

INSERT INTO data_update_log (data_type, last_updated, record_count, source) VALUES
('air_quality', NOW(), 0, 'city_monitoring_network'),
('traffic', NOW(), 0, 'traffic_management_bureau'),
('complaints', NOW(), 0, 'public_reporting_system');
