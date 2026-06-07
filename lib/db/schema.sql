CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

CREATE TABLE IF NOT EXISTS transfer_stations (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  province VARCHAR(50) NOT NULL,
  city VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL CHECK (level IN ('hub', 'regional', 'local')),
  location GEOGRAPHY(Point, 4326) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transfer_stations_location ON transfer_stations USING GIST(location);
CREATE INDEX idx_transfer_stations_city ON transfer_stations(city);

CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(32) PRIMARY KEY,
  plate_number VARCHAR(20) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  capacity INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'maintenance', 'idle')),
  team_id VARCHAR(32),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_team ON vehicles(team_id);

CREATE TABLE IF NOT EXISTS loading_teams (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  station_id VARCHAR(32) NOT NULL REFERENCES transfer_stations(id),
  shift VARCHAR(20) NOT NULL CHECK (shift IN ('day', 'night', 'all')),
  size INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loading_teams_station ON loading_teams(station_id);

CREATE TABLE IF NOT EXISTS weather_records (
  id VARCHAR(32) PRIMARY KEY,
  station_id VARCHAR(32) NOT NULL REFERENCES transfer_stations(id),
  timestamp TIMESTAMPTZ NOT NULL,
  condition VARCHAR(20) NOT NULL CHECK (condition IN ('sunny', 'cloudy', 'rain', 'snow', 'fog', 'storm')),
  temperature DECIMAL(5,2),
  wind_speed DECIMAL(5,2),
  visibility DECIMAL(8,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weather_records_station_time ON weather_records(station_id, timestamp);

CREATE TABLE IF NOT EXISTS waybills (
  id VARCHAR(32) PRIMARY KEY,
  waybill_number VARCHAR(50) NOT NULL UNIQUE,
  origin_station_id VARCHAR(32) NOT NULL REFERENCES transfer_stations(id),
  dest_station_id VARCHAR(32) NOT NULL REFERENCES transfer_stations(id),
  vehicle_id VARCHAR(32) NOT NULL REFERENCES vehicles(id),
  created_time TIMESTAMPTZ NOT NULL,
  estimated_arrival TIMESTAMPTZ NOT NULL,
  actual_arrival TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL CHECK (status IN ('in_transit', 'delivered', 'delayed', 'exception')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('normal', 'urgent', 'vip')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_waybills_origin ON waybills(origin_station_id);
CREATE INDEX idx_waybills_dest ON waybills(dest_station_id);
CREATE INDEX idx_waybills_vehicle ON waybills(vehicle_id);
CREATE INDEX idx_waybills_status ON waybills(status);
CREATE INDEX idx_waybills_created ON waybills(created_time);

CREATE TABLE IF NOT EXISTS scan_records (
  id VARCHAR(32) PRIMARY KEY,
  waybill_id VARCHAR(32) NOT NULL REFERENCES waybills(id),
  vehicle_id VARCHAR(32) NOT NULL REFERENCES vehicles(id),
  station_id VARCHAR(32) NOT NULL REFERENCES transfer_stations(id),
  scan_type VARCHAR(20) NOT NULL CHECK (scan_type IN ('arrival', 'departure', 'loading', 'unloading')),
  timestamp TIMESTAMPTZ NOT NULL,
  operator_id VARCHAR(32),
  location GEOGRAPHY(Point, 4326) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scan_records_waybill ON scan_records(waybill_id);
CREATE INDEX idx_scan_records_vehicle ON scan_records(vehicle_id);
CREATE INDEX idx_scan_records_station ON scan_records(station_id);
CREATE INDEX idx_scan_records_timestamp ON scan_records(timestamp);
CREATE INDEX idx_scan_records_location ON scan_records USING GIST(location);

CREATE TABLE IF NOT EXISTS delay_records (
  id VARCHAR(32) PRIMARY KEY,
  waybill_id VARCHAR(32) NOT NULL REFERENCES waybills(id),
  station_id VARCHAR(32) NOT NULL REFERENCES transfer_stations(id),
  vehicle_id VARCHAR(32) NOT NULL REFERENCES vehicles(id),
  arrival_scan_id VARCHAR(32) NOT NULL REFERENCES scan_records(id),
  departure_scan_id VARCHAR(32) REFERENCES scan_records(id),
  arrival_time TIMESTAMPTZ NOT NULL,
  departure_time TIMESTAMPTZ,
  business_day VARCHAR(10) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  is_overnight BOOLEAN NOT NULL DEFAULT FALSE,
  is_delayed BOOLEAN NOT NULL DEFAULT FALSE,
  delay_category VARCHAR(20) CHECK (delay_category IN ('loading', 'weather', 'vehicle', 'traffic', 'other')),
  loading_team_id VARCHAR(32) REFERENCES loading_teams(id),
  attributed_to_team BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_delay_records_station ON delay_records(station_id);
CREATE INDEX idx_delay_records_vehicle ON delay_records(vehicle_id);
CREATE INDEX idx_delay_records_business_day ON delay_records(business_day);
CREATE INDEX idx_delay_records_delayed ON delay_records(is_delayed);
CREATE INDEX idx_delay_records_category ON delay_records(delay_category);

CREATE TABLE IF NOT EXISTS exception_records (
  id VARCHAR(32) PRIMARY KEY,
  waybill_id VARCHAR(32) NOT NULL REFERENCES waybills(id),
  station_id VARCHAR(32) NOT NULL REFERENCES transfer_stations(id),
  timestamp TIMESTAMPTZ NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('vehicle_breakdown', 'weather_delay', 'loading_delay', 'package_damage', 'traffic_jam', 'other')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  handling_status VARCHAR(20) NOT NULL CHECK (handling_status IN ('pending', 'processing', 'resolved')),
  handler_id VARCHAR(32),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exception_records_station ON exception_records(station_id);
CREATE INDEX idx_exception_records_type ON exception_records(type);
CREATE INDEX idx_exception_records_severity ON exception_records(severity);
CREATE INDEX idx_exception_records_timestamp ON exception_records(timestamp);

CREATE VIEW station_daily_summary AS
SELECT
  dr.station_id,
  ts.name as station_name,
  ts.location,
  dr.business_day,
  COUNT(DISTINCT dr.waybill_id) as total_waybills,
  SUM(CASE WHEN dr.is_delayed THEN 1 ELSE 0 END) as delayed_waybills,
  AVG(dr.duration_minutes) as avg_duration_minutes,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY dr.duration_minutes) as median_duration_minutes,
  COUNT(DISTINCT er.id) as exception_count
FROM delay_records dr
JOIN transfer_stations ts ON ts.id = dr.station_id
LEFT JOIN exception_records er ON er.station_id = dr.station_id AND er.waybill_id = dr.waybill_id
GROUP BY dr.station_id, ts.name, ts.location, dr.business_day;

CREATE VIEW path_delay_summary AS
SELECT
  w.origin_station_id,
  w.dest_station_id,
  os.name as origin_name,
  ds.name as dest_name,
  COUNT(w.id) as waybill_count,
  SUM(CASE WHEN w.status = 'delayed' THEN 1 ELSE 0 END) as delay_count,
  AVG(dr.duration_minutes) as avg_stay_minutes,
  AVG(EXTRACT(EPOCH FROM (w.actual_arrival - w.estimated_arrival))/60) as avg_delay_minutes,
  ST_MakeLine(os.location::geometry, ds.location::geometry) as path_geom
FROM waybills w
JOIN transfer_stations os ON os.id = w.origin_station_id
JOIN transfer_stations ds ON ds.id = w.dest_station_id
JOIN delay_records dr ON dr.waybill_id = w.id AND dr.station_id = w.origin_station_id
WHERE w.actual_arrival IS NOT NULL
GROUP BY w.origin_station_id, w.dest_station_id, os.name, ds.name, os.location, ds.location;
