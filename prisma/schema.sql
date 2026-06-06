-- 公交站点拥挤度仪表盘 - PostGIS 数据库 Schema
-- 支持空间查询、线路分析、拥挤度热力图等功能

-- 启用 PostGIS 扩展
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- 公交线路表
CREATE TABLE routes (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    direction VARCHAR(10) CHECK (direction IN ('up', 'down')),
    total_stops INTEGER DEFAULT 0,
    operating_start_time TIME,
    operating_end_time TIME,
    geom GEOMETRY(LINESTRING, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 公交站点表（带空间索引）
CREATE TABLE stations (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(POINT, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 线路-站点关联表（带站点顺序）
CREATE TABLE route_stations (
    id SERIAL PRIMARY KEY,
    route_id VARCHAR(32) REFERENCES routes(id),
    station_id VARCHAR(32) REFERENCES stations(id),
    sequence INTEGER NOT NULL,
    direction VARCHAR(10) CHECK (direction IN ('up', 'down')),
    distance_from_start DOUBLE PRECISION,
    UNIQUE(route_id, station_id, direction, sequence)
);

-- 班次表
CREATE TABLE trips (
    id VARCHAR(32) PRIMARY KEY,
    route_id VARCHAR(32) REFERENCES routes(id),
    direction VARCHAR(10) CHECK (direction IN ('up', 'down')),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    vehicle_id VARCHAR(50),
    driver_name VARCHAR(100),
    is_detour BOOLEAN DEFAULT FALSE,
    detour_reason TEXT,
    peak_period VARCHAR(20) CHECK (peak_period IN ('morning', 'evening', 'off-peak')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GPS到站记录表
CREATE TABLE arrival_records (
    id VARCHAR(32) PRIMARY KEY,
    trip_id VARCHAR(32) REFERENCES trips(id),
    route_id VARCHAR(32) REFERENCES routes(id),
    station_id VARCHAR(32) REFERENCES stations(id),
    scheduled_time TIMESTAMP NOT NULL,
    actual_time TIMESTAMP NOT NULL,
    delay_seconds INTEGER DEFAULT 0,
    load_factor DECIMAL(5,4) DEFAULT 0.0,
    passenger_count INTEGER DEFAULT 0,
    crowding_level VARCHAR(20) CHECK (crowding_level IN ('low', 'medium', 'high', 'extreme')),
    is_detour BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    geom GEOMETRY(POINT, 4326)
);

-- 刷卡记录表
CREATE TABLE card_records (
    id VARCHAR(32) PRIMARY KEY,
    card_id VARCHAR(50) NOT NULL,
    route_id VARCHAR(32) REFERENCES routes(id),
    station_id VARCHAR(32) REFERENCES stations(id),
    trip_id VARCHAR(32) REFERENCES trips(id),
    tap_type VARCHAR(10) CHECK (tap_type IN ('on', 'off')),
    timestamp TIMESTAMP NOT NULL,
    fare DECIMAL(10,2),
    passenger_type VARCHAR(20) CHECK (passenger_type IN ('adult', 'student', 'senior', 'child')),
    geom GEOMETRY(POINT, 4326)
);

-- 投诉表
CREATE TABLE complaints (
    id VARCHAR(32) PRIMARY KEY,
    route_id VARCHAR(32) REFERENCES routes(id),
    station_id VARCHAR(32) REFERENCES stations(id),
    trip_id VARCHAR(32) REFERENCES trips(id),
    category VARCHAR(50) CHECK (category IN ('crowding', 'delay', 'driver', 'vehicle', 'other')),
    description TEXT,
    timestamp TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
    reporter_contact VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 天气表
CREATE TABLE weather_records (
    id VARCHAR(32) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    date DATE NOT NULL,
    hour INTEGER NOT NULL,
    condition VARCHAR(20) CHECK (condition IN ('sunny', 'cloudy', 'rainy', 'stormy', 'snowy')),
    temperature DECIMAL(5,2),
    precipitation DECIMAL(8,2),
    wind_speed DECIMAL(8,2),
    visibility DECIMAL(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 临时绕行表
CREATE TABLE detour_records (
    id VARCHAR(32) PRIMARY KEY,
    trip_id VARCHAR(32) REFERENCES trips(id),
    route_id VARCHAR(32) REFERENCES routes(id),
    original_route TEXT,
    detour_route TEXT,
    reason TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    affected_stations TEXT[],
    geom GEOMETRY(LINESTRING, 4326)
);

-- 异常事件表
CREATE TABLE anomalies (
    id VARCHAR(32) PRIMARY KEY,
    type VARCHAR(50) CHECK (type IN ('delay', 'crowding', 'complaint_spike', 'detour')),
    route_id VARCHAR(32) REFERENCES routes(id),
    station_id VARCHAR(32) REFERENCES stations(id),
    trip_id VARCHAR(32) REFERENCES trips(id),
    timestamp TIMESTAMP NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high')),
    description TEXT,
    notes TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建空间索引
CREATE INDEX idx_stations_geom ON stations USING GIST(geom);
CREATE INDEX idx_arrival_records_geom ON arrival_records USING GIST(geom);
CREATE INDEX idx_routes_geom ON routes USING GIST(geom);
CREATE INDEX idx_detour_records_geom ON detour_records USING GIST(geom);

-- 创建普通索引
CREATE INDEX idx_arrival_records_route ON arrival_records(route_id);
CREATE INDEX idx_arrival_records_station ON arrival_records(station_id);
CREATE INDEX idx_arrival_records_trip ON arrival_records(trip_id);
CREATE INDEX idx_arrival_records_time ON arrival_records(timestamp);
CREATE INDEX idx_card_records_route ON card_records(route_id);
CREATE INDEX idx_card_records_station ON card_records(station_id);
CREATE INDEX idx_card_records_time ON card_records(timestamp);
CREATE INDEX idx_complaints_route ON complaints(route_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_time ON complaints(timestamp);
CREATE INDEX idx_trips_route ON trips(route_id);
CREATE INDEX idx_trips_detour ON trips(is_detour);
CREATE INDEX idx_route_stations_route ON route_stations(route_id);
CREATE INDEX idx_route_stations_station ON route_stations(station_id);
CREATE INDEX idx_weather_time ON weather_records(timestamp);
