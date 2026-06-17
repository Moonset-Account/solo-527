CREATE DATABASE city_tour_inventory;

\c city_tour_inventory;

CREATE TABLE IF NOT EXISTS tour_route (
    id BIGSERIAL PRIMARY KEY,
    route_code VARCHAR(50) UNIQUE NOT NULL,
    route_name VARCHAR(100) NOT NULL,
    description VARCHAR(1000),
    city VARCHAR(50),
    duration_days INTEGER,
    base_price DECIMAL(10,2),
    max_capacity INTEGER,
    status VARCHAR(20),
    version INTEGER DEFAULT 1,
    cover_image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS room_inventory (
    id BIGSERIAL PRIMARY KEY,
    route_id BIGINT NOT NULL,
    hotel_code VARCHAR(50) NOT NULL,
    hotel_name VARCHAR(100),
    room_type VARCHAR(50) NOT NULL,
    inventory_date DATE NOT NULL,
    total_quantity INTEGER DEFAULT 0,
    booked_quantity INTEGER DEFAULT 0,
    blocked_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER DEFAULT 0,
    room_status VARCHAR(20),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    UNIQUE(route_id, hotel_code, room_type, inventory_date)
);

CREATE INDEX idx_room_inventory_date ON room_inventory(inventory_date);
CREATE INDEX idx_room_inventory_route ON room_inventory(route_id);

CREATE TABLE IF NOT EXISTS inventory_detail (
    id BIGSERIAL PRIMARY KEY,
    room_inventory_id BIGINT NOT NULL,
    route_id BIGINT,
    hotel_code VARCHAR(50),
    room_type VARCHAR(50),
    inventory_date DATE,
    room_number VARCHAR(50),
    order_no VARCHAR(50),
    guest_name VARCHAR(100),
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    room_status VARCHAR(20),
    clean_status VARCHAR(20),
    source_type VARCHAR(20),
    remark VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

CREATE INDEX idx_inventory_detail_date ON inventory_detail(inventory_date);
CREATE INDEX idx_inventory_detail_room_inv ON inventory_detail(room_inventory_id);
CREATE INDEX idx_inventory_detail_hotel ON inventory_detail(hotel_code, room_number);

CREATE TABLE IF NOT EXISTS cleaning_task (
    id BIGSERIAL PRIMARY KEY,
    task_no VARCHAR(50) UNIQUE,
    hotel_code VARCHAR(50),
    hotel_name VARCHAR(100),
    room_number VARCHAR(50),
    room_type VARCHAR(50),
    task_date DATE,
    task_type VARCHAR(20),
    task_status VARCHAR(20),
    priority VARCHAR(20),
    assignee VARCHAR(50),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    remark VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

CREATE INDEX idx_cleaning_task_date ON cleaning_task(task_date);
CREATE INDEX idx_cleaning_task_status ON cleaning_task(task_status);

CREATE TABLE IF NOT EXISTS tour_order (
    id BIGSERIAL PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    route_id BIGINT,
    route_name VARCHAR(100),
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    travel_date DATE,
    guest_count INTEGER,
    room_count INTEGER,
    total_amount DECIMAL(10,2),
    paid_amount DECIMAL(10,2),
    order_status VARCHAR(20),
    payment_status VARCHAR(20),
    refund_status VARCHAR(20),
    refund_amount DECIMAL(10,2),
    hotel_code VARCHAR(50),
    room_type VARCHAR(50),
    version INTEGER DEFAULT 1,
    remark VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

CREATE INDEX idx_tour_order_no ON tour_order(order_no);
CREATE INDEX idx_tour_order_route ON tour_order(route_id);

CREATE TABLE IF NOT EXISTS refund_record (
    id BIGSERIAL PRIMARY KEY,
    refund_no VARCHAR(50) UNIQUE NOT NULL,
    order_no VARCHAR(50),
    route_id BIGINT,
    refund_amount DECIMAL(10,2),
    refund_reason VARCHAR(200),
    refund_type VARCHAR(20),
    refund_status VARCHAR(20),
    approver VARCHAR(50),
    approve_time TIMESTAMP,
    refund_time TIMESTAMP,
    remark VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

CREATE INDEX idx_refund_record_order ON refund_record(order_no);

CREATE TABLE IF NOT EXISTS config_version (
    id BIGSERIAL PRIMARY KEY,
    config_type VARCHAR(50) NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_name VARCHAR(100),
    version_no INTEGER NOT NULL,
    config_value TEXT,
    status VARCHAR(20),
    effect_start_time TIMESTAMP,
    effect_end_time TIMESTAMP,
    remark VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

CREATE INDEX idx_config_version_type ON config_version(config_type);
CREATE INDEX idx_config_version_key ON config_version(config_key);

CREATE TABLE IF NOT EXISTS reminder_rule (
    id BIGSERIAL PRIMARY KEY,
    rule_code VARCHAR(50) UNIQUE NOT NULL,
    rule_name VARCHAR(100),
    rule_type VARCHAR(30),
    trigger_condition TEXT,
    reminder_level VARCHAR(20),
    reminder_way VARCHAR(50),
    reminder_template TEXT,
    upgrade_condition TEXT,
    upgrade_rule_code VARCHAR(50),
    enabled BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    remark VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

CREATE INDEX idx_reminder_rule_type ON reminder_rule(rule_type);

CREATE TABLE IF NOT EXISTS export_log (
    id BIGSERIAL PRIMARY KEY,
    export_no VARCHAR(50) UNIQUE NOT NULL,
    export_type VARCHAR(50),
    export_name VARCHAR(100),
    export_by VARCHAR(50) NOT NULL,
    export_time TIMESTAMP,
    query_criteria TEXT,
    file_name VARCHAR(200),
    file_path VARCHAR(500),
    record_count INTEGER,
    file_size BIGINT,
    status VARCHAR(20),
    remark VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

CREATE INDEX idx_export_log_time ON export_log(export_time);
CREATE INDEX idx_export_log_by ON export_log(export_by);
