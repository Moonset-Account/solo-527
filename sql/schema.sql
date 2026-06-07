-- 租赁公寓维修响应看板系统数据库 Schema
-- 依赖：PostgreSQL 14+、PostGIS 3.0+

CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 楼栋表
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    geom GEOMETRY(Point, 4326),
    lng NUMERIC(10, 6) NOT NULL,
    lat NUMERIC(10, 6) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buildings_geom ON buildings USING GIST(geom);

-- 供应商表
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(50),
    phone VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 工单主表
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_no VARCHAR(32) UNIQUE NOT NULL,
    building_id UUID NOT NULL REFERENCES buildings(id),
    room_no VARCHAR(20) NOT NULL,
    room_type VARCHAR(20),
    repair_type VARCHAR(50) NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    tenant_name VARCHAR(50),
    tenant_rating SMALLINT CHECK (tenant_rating BETWEEN 1 AND 5),
    tenant_feedback TEXT,
    parent_order_id UUID REFERENCES work_orders(id),
    is_repeat BOOLEAN NOT NULL DEFAULT FALSE,
    is_holiday BOOLEAN NOT NULL DEFAULT FALSE,
    response_time INTEGER,
    location GEOMETRY(Point, 4326),
    lng NUMERIC(10, 6),
    lat NUMERIC(10, 6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_orders_building_id ON work_orders(building_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_supplier_id ON work_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_created_at ON work_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_work_orders_parent_order_id ON work_orders(parent_order_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_is_repeat ON work_orders(is_repeat);
CREATE INDEX IF NOT EXISTS idx_work_orders_geom ON work_orders USING GIST(location);

-- 工单生命周期清洗表（清洗后的数据）
CREATE TABLE IF NOT EXISTS work_orders_cleaned (
    id UUID PRIMARY KEY REFERENCES work_orders(id),
    order_no VARCHAR(32) UNIQUE NOT NULL,
    building_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL,
    repair_type VARCHAR(50) NOT NULL,
    room_type VARCHAR(20),
    response_time INTEGER,
    is_repeat BOOLEAN NOT NULL DEFAULT FALSE,
    parent_order_id UUID,
    is_holiday BOOLEAN NOT NULL DEFAULT FALSE,
    tenant_rating SMALLINT,
    created_at TIMESTAMPTZ NOT NULL,
    responded_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cleaned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cleaning_version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_work_orders_cleaned_building_id ON work_orders_cleaned(building_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_cleaned_supplier_id ON work_orders_cleaned(supplier_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_cleaned_is_repeat ON work_orders_cleaned(is_repeat);
CREATE INDEX IF NOT EXISTS idx_work_orders_cleaned_created_at ON work_orders_cleaned(created_at);

-- 材料消耗表
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id),
    name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit VARCHAR(10),
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_work_order_id ON materials(work_order_id);

-- 申诉记录表
CREATE TABLE IF NOT EXISTS appeal_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id),
    reason TEXT NOT NULL,
    tenant_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appeal_records_work_order_id ON appeal_records(work_order_id);

-- 供应商维度缓存表
CREATE TABLE IF NOT EXISTS supplier_metrics_cache (
    supplier_id UUID PRIMARY KEY REFERENCES suppliers(id),
    total_orders INTEGER NOT NULL DEFAULT 0,
    repeat_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    avg_response_time INTEGER NOT NULL DEFAULT 0,
    timeout_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    avg_rating NUMERIC(3, 1) NOT NULL DEFAULT 0,
    holiday_orders INTEGER NOT NULL DEFAULT 0,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ttl_seconds INTEGER NOT NULL DEFAULT 3600
);

CREATE INDEX IF NOT EXISTS idx_supplier_metrics_cache_cached_at ON supplier_metrics_cache(cached_at);

-- 节假日表
CREATE TABLE IF NOT EXISTS work_holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    holiday_date DATE UNIQUE NOT NULL,
    name VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_holidays_date ON work_holidays(holiday_date);

-- 楼栋点位聚合视图（模拟 PostGIS 空间聚合）
CREATE OR REPLACE VIEW v_building_metrics AS
SELECT
    b.id AS building_id,
    b.name AS building_name,
    b.address,
    b.lng,
    b.lat,
    ST_AsGeoJSON(b.geom) AS geom_geojson,
    COUNT(w.id) AS total_orders,
    COUNT(CASE WHEN w.is_repeat AND w.parent_order_id IS NOT NULL THEN 1 END) AS repeat_count,
    COUNT(CASE WHEN w.response_time > 120 AND NOT w.is_holiday THEN 1 END) AS timeout_count,
    ROUND(
        CASE WHEN COUNT(w.id) > 0 
            THEN (COUNT(CASE WHEN w.is_repeat AND w.parent_order_id IS NOT NULL THEN 1 END)::NUMERIC / COUNT(w.id)) * 100 
            ELSE 0 
        END, 1
    ) AS repeat_rate,
    ROUND(
        CASE WHEN COUNT(CASE WHEN NOT w.is_holiday THEN 1 END) > 0 
            THEN (COUNT(CASE WHEN w.response_time > 120 AND NOT w.is_holiday THEN 1 END)::NUMERIC / COUNT(CASE WHEN NOT w.is_holiday THEN 1 END)) * 100 
            ELSE 0 
        END, 1
    ) AS timeout_rate
FROM buildings b
LEFT JOIN work_orders_cleaned w ON b.id = w.building_id
GROUP BY b.id, b.name, b.address, b.lng, b.lat, b.geom;

-- 工单清洗存储过程
CREATE OR REPLACE FUNCTION clean_work_order_lifecycle()
RETURNS VOID AS $$
DECLARE
    v_cleaning_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(cleaning_version), 0) + 1 INTO v_cleaning_version FROM work_orders_cleaned;

    INSERT INTO work_orders_cleaned (
        id, order_no, building_id, supplier_id, status, repair_type, room_type,
        response_time, is_repeat, parent_order_id, is_holiday, tenant_rating,
        created_at, responded_at, completed_at, cleaned_at, cleaning_version
    )
    SELECT
        w.id,
        w.order_no,
        w.building_id,
        w.supplier_id,
        w.status,
        w.repair_type,
        w.room_type,
        EXTRACT(EPOCH FROM (w.responded_at - w.created_at)) / 60 AS response_time,
        CASE WHEN w.parent_order_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM work_orders p WHERE p.id = w.parent_order_id
        ) THEN TRUE ELSE FALSE END AS is_repeat,
        CASE WHEN EXISTS (
            SELECT 1 FROM work_orders p WHERE p.id = w.parent_order_id
        ) THEN w.parent_order_id ELSE NULL END AS parent_order_id,
        EXISTS (
            SELECT 1 FROM work_holidays h WHERE h.holiday_date = w.created_at::DATE
        ) AS is_holiday,
        w.tenant_rating,
        w.created_at,
        w.responded_at,
        w.completed_at,
        NOW(),
        v_cleaning_version
    FROM work_orders w
    ON CONFLICT (id) DO UPDATE SET
        response_time = EXCLUDED.response_time,
        is_repeat = EXCLUDED.is_repeat,
        parent_order_id = EXCLUDED.parent_order_id,
        is_holiday = EXCLUDED.is_holiday,
        status = EXCLUDED.status,
        cleaned_at = NOW(),
        cleaning_version = v_cleaning_version;
END;
$$ LANGUAGE plpgsql;

-- 供应商指标计算存储过程
CREATE OR REPLACE FUNCTION refresh_supplier_metrics_cache()
RETURNS VOID AS $$
BEGIN
    INSERT INTO supplier_metrics_cache (
        supplier_id, total_orders, repeat_rate, avg_response_time,
        timeout_rate, avg_rating, holiday_orders, cached_at, ttl_seconds
    )
    SELECT
        w.supplier_id,
        COUNT(w.id) AS total_orders,
        ROUND(
            CASE WHEN COUNT(w.id) > 0 
                THEN (COUNT(CASE WHEN w.is_repeat AND w.parent_order_id IS NOT NULL THEN 1 END)::NUMERIC / COUNT(w.id)) * 100 
                ELSE 0 
            END, 1
        ) AS repeat_rate,
        ROUND(AVG(CASE WHEN NOT w.is_holiday AND w.response_time IS NOT NULL THEN w.response_time END)::NUMERIC, 0) AS avg_response_time,
        ROUND(
            CASE WHEN COUNT(CASE WHEN NOT w.is_holiday AND w.status IN ('completed', 'closed') THEN 1 END) > 0 
                THEN (COUNT(CASE WHEN w.response_time > 120 AND NOT w.is_holiday AND w.status IN ('completed', 'closed') THEN 1 END)::NUMERIC / COUNT(CASE WHEN NOT w.is_holiday AND w.status IN ('completed', 'closed') THEN 1 END)) * 100 
                ELSE 0 
            END, 1
        ) AS timeout_rate,
        ROUND(AVG(CASE WHEN w.tenant_rating IS NOT NULL THEN w.tenant_rating::NUMERIC END), 1) AS avg_rating,
        COUNT(CASE WHEN w.is_holiday THEN 1 END) AS holiday_orders,
        NOW(),
        3600
    FROM work_orders_cleaned w
    GROUP BY w.supplier_id
    ON CONFLICT (supplier_id) DO UPDATE SET
        total_orders = EXCLUDED.total_orders,
        repeat_rate = EXCLUDED.repeat_rate,
        avg_response_time = EXCLUDED.avg_response_time,
        timeout_rate = EXCLUDED.timeout_rate,
        avg_rating = EXCLUDED.avg_rating,
        holiday_orders = EXCLUDED.holiday_orders,
        cached_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 初始化数据
INSERT INTO buildings (id, name, address, lng, lat, geom) VALUES
('b1', '朝阳花园 1 号楼', '北京市朝阳区建国路 88 号', 116.4621, 39.9084, ST_SetSRID(ST_MakePoint(116.4621, 39.9084), 4326)),
('b2', '朝阳花园 2 号楼', '北京市朝阳区建国路 88 号', 116.4625, 39.9086, ST_SetSRID(ST_MakePoint(116.4625, 39.9086), 4326)),
('b3', '朝阳花园 3 号楼', '北京市朝阳区建国路 88 号', 116.4629, 39.9082, ST_SetSRID(ST_MakePoint(116.4629, 39.9082), 4326)),
('b4', '海淀苑 A 座', '北京市海淀区中关村大街 1 号', 116.3168, 39.9892, ST_SetSRID(ST_MakePoint(116.3168, 39.9892), 4326)),
('b5', '海淀苑 B 座', '北京市海淀区中关村大街 1 号', 116.3172, 39.9895, ST_SetSRID(ST_MakePoint(116.3172, 39.9895), 4326)),
('b6', '西城金茂府 1 栋', '北京市西城区金融街 15 号', 116.3595, 39.9142, ST_SetSRID(ST_MakePoint(116.3595, 39.9142), 4326)),
('b7', '西城金茂府 2 栋', '北京市西城区金融街 15 号', 116.3599, 39.9145, ST_SetSRID(ST_MakePoint(116.3599, 39.9145), 4326)),
('b8', '东城雅居', '北京市东城区东直门外大街 1 号', 116.4263, 39.9412, ST_SetSRID(ST_MakePoint(116.4263, 39.9412), 4326))
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id, name, contact, phone) VALUES
('s1', '速修达维修服务', '张经理', '13800138001'),
('s2', '安居工程维保', '李工', '13800138002'),
('s3', '快修侠家政服务', '王主管', '13800138003'),
('s4', '优居维修中心', '刘师傅', '13800138004'),
('s5', '家修通科技', '陈经理', '13800138005')
ON CONFLICT (id) DO NOTHING;

-- 初始化 2026 年法定节假日
INSERT INTO work_holidays (holiday_date, name) VALUES
('2026-01-01', '元旦'),
('2026-01-28', '春节'),
('2026-01-29', '春节'),
('2026-01-30', '春节'),
('2026-01-31', '春节'),
('2026-02-01', '春节'),
('2026-02-02', '春节'),
('2026-04-04', '清明节'),
('2026-05-01', '劳动节'),
('2026-05-02', '劳动节'),
('2026-05-03', '劳动节'),
('2026-06-19', '端午节'),
('2026-09-25', '中秋节'),
('2026-10-01', '国庆节'),
('2026-10-02', '国庆节'),
('2026-10-03', '国庆节'),
('2026-10-04', '国庆节'),
('2026-10-05', '国庆节'),
('2026-10-06', '国庆节'),
('2026-10-07', '国庆节')
ON CONFLICT (holiday_date) DO NOTHING;
