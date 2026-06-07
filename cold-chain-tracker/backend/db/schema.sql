CREATE DATABASE IF NOT EXISTS cold_chain;

CREATE TABLE IF NOT EXISTS cold_chain.vehicles (
    vehicle_id String,
    plate_number String,
    vehicle_type String,
    status String,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (vehicle_id);

CREATE TABLE IF NOT EXISTS cold_chain.routes (
    route_id String,
    vehicle_id String,
    origin String,
    destination String,
    distance_km Float64,
    planned_departure DateTime,
    planned_arrival DateTime,
    actual_departure Nullable(DateTime),
    actual_arrival Nullable(DateTime),
    status String,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (route_id, planned_departure);

CREATE TABLE IF NOT EXISTS cold_chain.batches (
    batch_id String,
    route_id String,
    product_name String,
    quantity Int32,
    required_temp_min Float64,
    required_temp_max Float64,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (batch_id);

CREATE TABLE IF NOT EXISTS cold_chain.temperature_boxes (
    box_id String,
    batch_id String,
    vehicle_id String,
    probe_id String,
    current_temp Float64,
    updated_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (box_id);

CREATE TABLE IF NOT EXISTS cold_chain.temperature_readings (
    reading_id String,
    box_id String,
    probe_id String,
    temperature Float64,
    recorded_at DateTime,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(recorded_at)
ORDER BY (box_id, recorded_at);

CREATE TABLE IF NOT EXISTS cold_chain.door_events (
    event_id String,
    vehicle_id String,
    box_id String,
    event_type String,
    occurred_at DateTime,
    location_lat Float64,
    location_lng Float64,
    duration_seconds Nullable(Int32),
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(occurred_at)
ORDER BY (vehicle_id, occurred_at);

CREATE TABLE IF NOT EXISTS cold_chain.exceptions (
    exception_id String,
    vehicle_id String,
    route_id String,
    batch_id String,
    box_id String,
    exception_type String,
    severity String,
    started_at DateTime,
    ended_at Nullable(DateTime),
    duration_minutes Nullable(Int32),
    description String,
    resolution Nullable(String),
    resolved_by Nullable(String),
    original_record_ids String,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(started_at)
ORDER BY (exception_type, severity, started_at);

CREATE TABLE IF NOT EXISTS cold_chain.probe_calibrations (
    calibration_id String,
    probe_id String,
    box_id String,
    calibrated_at DateTime,
    next_calibration_due DateTime,
    status String,
    deviation_celsius Float64,
    created_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(created_at)
ORDER BY (probe_id, calibrated_at);

CREATE TABLE IF NOT EXISTS cold_chain.customers (
    customer_id String,
    name String,
    contact String,
    region String,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (customer_id);

CREATE TABLE IF NOT EXISTS cold_chain.deliveries (
    delivery_id String,
    route_id String,
    batch_id String,
    customer_id String,
    arrival_time DateTime,
    condition_at_arrival String,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(arrival_time)
ORDER BY (delivery_id);

CREATE TABLE IF NOT EXISTS cold_chain.etl_status (
    run_id String,
    etl_name String,
    started_at DateTime,
    completed_at Nullable(DateTime),
    rows_processed Int64,
    status String,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (etl_name, started_at);
