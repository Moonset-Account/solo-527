-- ============================================
-- 电动车充电桩故障监控系统 - ClickHouse 建表脚本
-- 执行方式: clickhouse-client --multiquery < 01_create_tables.sql
-- ============================================

CREATE DATABASE IF NOT EXISTS charger_monitor
ENGINE = Atomic
COMMENT '充电桩故障监控数据库';

USE charger_monitor;

-- ============================================
-- 1. 站点维度表 (Dimension)
-- ============================================
CREATE TABLE IF NOT EXISTS dim_station (
    station_id      String,
    station_name    String,
    region          String,
    address         String,
    lat             Float64,
    lng             Float64,
    create_time     DateTime,
    update_time     DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(update_time)
PRIMARY KEY station_id
ORDER BY station_id
COMMENT '充电站站点维表';

-- ============================================
-- 2. 充电桩维度表
-- ============================================
CREATE TABLE IF NOT EXISTS dim_charger (
    charger_id      String,
    station_id      String,
    model           String,
    brand           String,
    rated_power     Float32,
    install_date    Date,
    status          LowCardinality(String),
    is_offline      UInt8,
    update_time     DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(update_time)
PRIMARY KEY charger_id
ORDER BY charger_id
COMMENT '充电桩维表';

-- ============================================
-- 3. 故障码维度表
-- ============================================
CREATE TABLE IF NOT EXISTS dim_fault_code (
    fault_code      String,
    fault_desc      String,
    severity        LowCardinality(String),
    avg_repair_hours Float32,
    update_time     DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(update_time)
PRIMARY KEY fault_code
ORDER BY fault_code
COMMENT '故障码维表';

-- ============================================
-- 4. 维修人员维度表
-- ============================================
CREATE TABLE IF NOT EXISTS dim_repair_person (
    person_id       String,
    person_name     String,
    team            LowCardinality(String),
    phone           String,
    update_time     DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(update_time)
PRIMARY KEY person_id
ORDER BY person_id
COMMENT '维修人员维表';

-- ============================================
-- 5. 充电会话事实表 (Fact)
-- ============================================
CREATE TABLE IF NOT EXISTS fact_charging_session (
    session_id      String,
    charger_id      String,
    station_id      String,
    start_time      DateTime CODEC(DoubleDelta),
    end_time        DateTime CODEC(DoubleDelta),
    duration_min    UInt16,
    total_kwh       Float32,
    avg_power       Float32,
    peak_power      Float32,
    car_model       LowCardinality(String),
    payment_amount  Decimal(10, 2),
    create_time     DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(start_time)
ORDER BY (station_id, charger_id, start_time)
TTL start_time + INTERVAL 1 YEAR
SETTINGS index_granularity = 8192
COMMENT '充电会话事实表';

-- ============================================
-- 6. 功率读数事实表 (高频率时序数据)
-- ============================================
CREATE TABLE IF NOT EXISTS fact_power_reading (
    reading_id      String,
    session_id      String,
    charger_id      String,
    timestamp       DateTime CODEC(DoubleDelta),
    power           Float32 CODEC(Gorilla),
    voltage         Float32 CODEC(Gorilla),
    current         Float32 CODEC(Gorilla),
    temp_c          Float32 CODEC(Gorilla),
    is_anomaly      UInt8,
    create_time     DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (charger_id, timestamp)
TTL timestamp + INTERVAL 30 DAY
SETTINGS index_granularity = 1024
COMMENT '功率时序读数表，5秒间隔';

-- ============================================
-- 7. 故障日志事实表
-- ============================================
CREATE TABLE IF NOT EXISTS fact_fault_log (
    fault_id        String,
    charger_id      String,
    station_id      String,
    fault_code      LowCardinality(String),
    severity        LowCardinality(String),
    occur_time      DateTime CODEC(DoubleDelta),
    resolve_time    DateTime CODEC(DoubleDelta),
    is_resolved     UInt8,
    source          LowCardinality(String),
    create_time     DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(occur_time)
ORDER BY (station_id, charger_id, occur_time)
TTL occur_time + INTERVAL 2 YEAR
SETTINGS index_granularity = 4096
COMMENT '故障日志事实表';

-- ============================================
-- 8. 维修工单事实表
-- ============================================
CREATE TABLE IF NOT EXISTS fact_repair_order (
    order_id        String,
    fault_id        String,
    charger_id      String,
    station_id      String,
    fault_code      LowCardinality(String),
    person_id       String,
    person_name     String,
    team            LowCardinality(String),
    create_time     DateTime CODEC(DoubleDelta),
    assign_time     DateTime CODEC(DoubleDelta),
    arrive_time     DateTime CODEC(DoubleDelta),
    complete_time   DateTime CODEC(DoubleDelta),
    repair_hours    Float32,
    status          LowCardinality(String),
    parts_used      Array(String),
    remark          String,
    create_time_sys DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(create_time)
ORDER BY (station_id, person_id, create_time)
TTL create_time + INTERVAL 3 YEAR
SETTINGS index_granularity = 4096
COMMENT '维修工单事实表';

-- ============================================
-- 9. 站点巡检表
-- ============================================
CREATE TABLE IF NOT EXISTS fact_inspection (
    inspection_id   String,
    station_id      String,
    inspector       String,
    inspect_time    DateTime,
    charger_count   UInt16,
    fault_found     UInt16,
    items_passed    Array(String),
    items_failed    Array(String),
    remark          String,
    create_time     DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(inspect_time)
ORDER BY (station_id, inspect_time)
TTL inspect_time + INTERVAL 1 YEAR
COMMENT '站点巡检记录表';

-- ============================================
-- 10. 实时状态物化视图 (用于快速查询当前状态)
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_charger_status_realtime
ENGINE = SummingMergeTree()
ORDER BY (station_id, charger_id)
AS
SELECT
    station_id,
    charger_id,
    maxState(status) as current_status,
    maxState(is_offline) as is_offline,
    max(occur_time) as last_fault_time,
    count() as total_faults
FROM fact_fault_log
GROUP BY station_id, charger_id;

-- ============================================
-- 11. 每日统计聚合表
-- ============================================
CREATE TABLE IF NOT EXISTS agg_daily_stats (
    stat_date       Date,
    station_id      String,
    total_sessions  UInt32,
    total_kwh       Float32,
    total_faults    UInt32,
    avg_repair_hours Float32,
    availability    Float32,
    update_time     DateTime DEFAULT now()
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(stat_date)
PRIMARY KEY (stat_date, station_id)
ORDER BY (stat_date, station_id)
COMMENT '站点每日统计聚合表';
