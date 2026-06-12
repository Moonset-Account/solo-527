CREATE TABLE IF NOT EXISTS meters (
    id BIGSERIAL PRIMARY KEY,
    meter_code VARCHAR(64) NOT NULL UNIQUE,
    meter_name VARCHAR(128) NOT NULL,
    area VARCHAR(64) NOT NULL,
    location VARCHAR(255),
    rated_current DECIMAL(10,2),
    rated_voltage DECIMAL(10,2),
    status VARCHAR(32) NOT NULL DEFAULT 'NORMAL',
    install_date DATE,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meter_readings (
    id BIGSERIAL PRIMARY KEY,
    meter_id BIGINT NOT NULL REFERENCES meters(id),
    reading_time TIMESTAMP NOT NULL,
    active_power DECIMAL(14,4),
    reactive_power DECIMAL(14,4),
    voltage DECIMAL(10,4),
    current DECIMAL(10,4),
    power_factor DECIMAL(5,4),
    cumulative_energy DECIMAL(18,4),
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    validate_remark VARCHAR(255),
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meter_readings_meter_time ON meter_readings(meter_id, reading_time);
CREATE INDEX idx_meter_readings_time ON meter_readings(reading_time);

CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    alert_no VARCHAR(64) NOT NULL UNIQUE,
    meter_id BIGINT NOT NULL REFERENCES meters(id),
    alert_type VARCHAR(32) NOT NULL,
    alert_level VARCHAR(32) NOT NULL,
    alert_content TEXT NOT NULL,
    trigger_value DECIMAL(18,4),
    threshold_value DECIMAL(18,4),
    alert_time TIMESTAMP NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    assignee VARCHAR(64),
    assign_time TIMESTAMP,
    strategy_id BIGINT,
    strategy_version VARCHAR(32),
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_meter ON alerts(meter_id);
CREATE INDEX idx_alerts_time ON alerts(alert_time);

CREATE TABLE IF NOT EXISTS alert_handlings (
    id BIGSERIAL PRIMARY KEY,
    alert_id BIGINT NOT NULL REFERENCES alerts(id),
    handler VARCHAR(64) NOT NULL,
    handle_time TIMESTAMP NOT NULL,
    handle_result VARCHAR(32) NOT NULL,
    handle_remark TEXT,
    response_duration INTEGER,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alert_handlings_alert ON alert_handlings(alert_id);

CREATE TABLE IF NOT EXISTS strategies (
    id BIGSERIAL PRIMARY KEY,
    strategy_name VARCHAR(128) NOT NULL,
    strategy_code VARCHAR(64) NOT NULL UNIQUE,
    version VARCHAR(32) NOT NULL,
    strategy_type VARCHAR(32) NOT NULL,
    alert_type VARCHAR(32),
    threshold_value DECIMAL(18,4),
    duration_minutes INTEGER,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    effective_time TIMESTAMP,
    expire_time TIMESTAMP,
    failure_reason TEXT,
    create_by VARCHAR(64),
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_rules (
    id BIGSERIAL PRIMARY KEY,
    rule_name VARCHAR(128) NOT NULL,
    period_type VARCHAR(32) NOT NULL,
    peak_type VARCHAR(32) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    price DECIMAL(10,4) NOT NULL,
    effective_date DATE NOT NULL,
    expire_date DATE,
    area VARCHAR(64),
    description TEXT,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS peak_loads (
    id BIGSERIAL PRIMARY KEY,
    area VARCHAR(64) NOT NULL,
    peak_time TIMESTAMP NOT NULL,
    peak_value DECIMAL(18,4) NOT NULL,
    avg_value DECIMAL(18,4),
    meter_count INTEGER,
    related_strategy_id BIGINT,
    strategy_failure BOOLEAN DEFAULT FALSE,
    failure_reason TEXT,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_peak_loads_area_time ON peak_loads(area, peak_time);

CREATE TABLE IF NOT EXISTS export_histories (
    id BIGSERIAL PRIMARY KEY,
    export_no VARCHAR(64) NOT NULL UNIQUE,
    export_type VARCHAR(32) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    area VARCHAR(64),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    operator VARCHAR(64) NOT NULL,
    export_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    record_count INTEGER,
    status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS'
);

CREATE INDEX idx_export_histories_operator ON export_histories(operator);
CREATE INDEX idx_export_histories_time ON export_histories(export_time);
