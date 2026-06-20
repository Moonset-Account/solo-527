CREATE TABLE IF NOT EXISTS sys_permission (
    id BIGSERIAL PRIMARY KEY,
    permission_code VARCHAR(100) UNIQUE NOT NULL,
    permission_name VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sys_role (
    id BIGSERIAL PRIMARY KEY,
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sys_user (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    real_name VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sys_role_permission (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES sys_role(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES sys_permission(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sys_user_role (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES sys_role(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS anomaly_record (
    id BIGSERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    dimension VARCHAR(50),
    dimension_value VARCHAR(100),
    current_value DECIMAL(20,4),
    expected_value DECIMAL(20,4),
    deviation_rate DECIMAL(10,4),
    severity VARCHAR(20) NOT NULL,
    anomaly_reason VARCHAR(1000),
    suggestion VARCHAR(1000),
    status VARCHAR(20),
    anomaly_time TIMESTAMP,
    handled_by VARCHAR(50),
    handled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approval_request (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    request_type VARCHAR(50) NOT NULL,
    target_id BIGINT NOT NULL,
    target_name VARCHAR(50),
    reason VARCHAR(500),
    status VARCHAR(20) NOT NULL,
    approver_id BIGINT,
    approval_comment VARCHAR(500),
    approved_at TIMESTAMP,
    data_level VARCHAR(50),
    valid_from TIMESTAMP,
    valid_to TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alert_rule (
    id BIGSERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    dimension VARCHAR(50),
    alert_type VARCHAR(20) NOT NULL,
    threshold DECIMAL(10,4),
    operator VARCHAR(20),
    severity VARCHAR(20),
    effective_condition VARCHAR(500),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    notification_channels VARCHAR(500),
    notify_users VARCHAR(200),
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dimension_config (
    id BIGSERIAL PRIMARY KEY,
    dimension_code VARCHAR(50) NOT NULL,
    dimension_name VARCHAR(100) NOT NULL,
    dimension_type VARCHAR(50),
    dimension_values VARCHAR(1000),
    effective_condition VARCHAR(500),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(500),
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dataset_permission (
    id BIGSERIAL PRIMARY KEY,
    dataset_code VARCHAR(100) NOT NULL,
    dataset_name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    data_level VARCHAR(50),
    role_id BIGINT NOT NULL,
    permission_type VARCHAR(50),
    row_filter_condition VARCHAR(1000),
    column_mask_config VARCHAR(1000),
    effective_condition VARCHAR(500),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_delay_monitor (
    id BIGSERIAL PRIMARY KEY,
    dataset_code VARCHAR(100) NOT NULL,
    dataset_name VARCHAR(200) NOT NULL,
    last_update_time TIMESTAMP,
    expected_update_time TIMESTAMP,
    delay_minutes INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    notify_users VARCHAR(500),
    notified BOOLEAN DEFAULT FALSE,
    notified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_efficiency (
    id BIGSERIAL PRIMARY KEY,
    report_code VARCHAR(100) NOT NULL,
    report_name VARCHAR(200) NOT NULL,
    stat_date DATE NOT NULL,
    generation_count INTEGER NOT NULL,
    avg_generation_time_ms BIGINT NOT NULL,
    max_generation_time_ms BIGINT,
    min_generation_time_ms BIGINT,
    total_time_ms BIGINT,
    success_count INTEGER,
    fail_count INTEGER,
    success_rate DECIMAL(10,4),
    remark VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (report_code, stat_date)
);

CREATE TABLE IF NOT EXISTS filter_template (
    id BIGSERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    page_code VARCHAR(50) NOT NULL,
    page_name VARCHAR(200) NOT NULL,
    user_id BIGINT NOT NULL,
    username VARCHAR(50),
    filter_conditions TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    shared_roles VARCHAR(1000),
    description VARCHAR(500),
    use_count INTEGER DEFAULT 0,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS desensitization_config (
    id BIGSERIAL PRIMARY KEY,
    dataset_code VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    column_name VARCHAR(100) NOT NULL,
    column_alias VARCHAR(100),
    desensitization_type VARCHAR(50) NOT NULL,
    desensitization_rule VARCHAR(500),
    data_level VARCHAR(50),
    effective_condition VARCHAR(500),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(500),
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_anomaly_record_metric ON anomaly_record(metric_name, anomaly_time);
CREATE INDEX IF NOT EXISTS idx_anomaly_record_severity ON anomaly_record(severity);
CREATE INDEX IF NOT EXISTS idx_approval_request_user ON approval_request(user_id, status);
CREATE INDEX IF NOT EXISTS idx_alert_rule_metric ON alert_rule(metric_name, enabled);
CREATE INDEX IF NOT EXISTS idx_dataset_permission_role ON dataset_permission(role_id, dataset_code);
CREATE INDEX IF NOT EXISTS idx_data_delay_monitor_status ON data_delay_monitor(status);
CREATE INDEX IF NOT EXISTS idx_report_efficiency_date ON report_efficiency(stat_date, report_code);
CREATE INDEX IF NOT EXISTS idx_filter_template_user ON filter_template(user_id, page_code);
