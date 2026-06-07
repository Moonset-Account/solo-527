CREATE TABLE IF NOT EXISTS slots (
    slot_id VARCHAR(32) PRIMARY KEY,
    slot_name VARCHAR(64) NOT NULL,
    zone VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS shifts (
    shift_id VARCHAR(32) PRIMARY KEY,
    shift_name VARCHAR(64) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
    device_id VARCHAR(32) PRIMARY KEY,
    device_name VARCHAR(64) NOT NULL,
    device_type VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS routes (
    route_id VARCHAR(32) PRIMARY KEY,
    route_name VARCHAR(64) NOT NULL,
    destination VARCHAR(128)
);

CREATE TABLE IF NOT EXISTS device_alarms (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(32) REFERENCES devices(device_id),
    alarm_type VARCHAR(64) NOT NULL,
    alarm_start TIMESTAMP NOT NULL,
    alarm_end TIMESTAMP,
    severity VARCHAR(16) NOT NULL DEFAULT 'warning',
    duration_minutes INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS hourly_sort_stats (
    id BIGSERIAL PRIMARY KEY,
    stat_time TIMESTAMP NOT NULL,
    slot_id VARCHAR(32) REFERENCES slots(slot_id),
    shift_id VARCHAR(32) REFERENCES shifts(shift_id),
    device_id VARCHAR(32) REFERENCES devices(device_id),
    route_id VARCHAR(32) REFERENCES routes(route_id),
    total_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    review_failed INTEGER NOT NULL DEFAULT 0,
    alarm_active BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_stats_stat_time ON hourly_sort_stats(stat_time);
CREATE INDEX IF NOT EXISTS idx_stats_shift_id ON hourly_sort_stats(shift_id);
CREATE INDEX IF NOT EXISTS idx_stats_slot_id ON hourly_sort_stats(slot_id);
CREATE INDEX IF NOT EXISTS idx_stats_device_id ON hourly_sort_stats(device_id);
CREATE INDEX IF NOT EXISTS idx_stats_route_id ON hourly_sort_stats(route_id);
CREATE INDEX IF NOT EXISTS idx_stats_alarm_active ON hourly_sort_stats(alarm_active);
CREATE INDEX IF NOT EXISTS idx_alarms_alarm_start ON device_alarms(alarm_start);
CREATE INDEX IF NOT EXISTS idx_alarms_device_id ON device_alarms(device_id);
