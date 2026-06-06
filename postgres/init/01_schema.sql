-- ========================================
-- 仓库SKU周转与滞销分析 - PostgreSQL 业务表结构
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ========================================
-- 一、主数据表
-- ========================================

-- 1.1 供应商表
CREATE TABLE IF NOT EXISTS dim_supplier (
    supplier_id     BIGSERIAL PRIMARY KEY,
    supplier_code   VARCHAR(50) NOT NULL UNIQUE,
    supplier_name   VARCHAR(200) NOT NULL,
    contact_person  VARCHAR(100),
    contact_phone   VARCHAR(50),
    address         TEXT,
    payment_terms   VARCHAR(100),
    lead_time_days  INT DEFAULT 7,
    status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 仓库/仓位表
CREATE TABLE IF NOT EXISTS dim_warehouse (
    warehouse_id    BIGSERIAL PRIMARY KEY,
    warehouse_code  VARCHAR(50) NOT NULL UNIQUE,
    warehouse_name  VARCHAR(200) NOT NULL,
    location_code   VARCHAR(50),
    location_name   VARCHAR(200),
    area            VARCHAR(100),
    zone            VARCHAR(100),
    aisle           VARCHAR(50),
    shelf           VARCHAR(50),
    layer           VARCHAR(50),
    bin             VARCHAR(50),
    is_temp_zone    BOOLEAN DEFAULT FALSE,
    is_return_zone  BOOLEAN DEFAULT FALSE,
    status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'locked')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.3 SKU主档表
CREATE TABLE IF NOT EXISTS dim_sku (
    sku_id          BIGSERIAL PRIMARY KEY,
    sku_code        VARCHAR(100) NOT NULL UNIQUE,
    sku_name        VARCHAR(500) NOT NULL,
    barcode         VARCHAR(100),
    category_l1     VARCHAR(100),
    category_l2     VARCHAR(100),
    category_l3     VARCHAR(100),
    brand           VARCHAR(100),
    unit            VARCHAR(20) DEFAULT '件',
    spec            VARCHAR(200),
    weight_kg       DECIMAL(10,4),
    volume_cbm      DECIMAL(10,4),
    shelf_life_days INT,
    is_cold_chain   BOOLEAN DEFAULT FALSE,
    is_hazardous    BOOLEAN DEFAULT FALSE,
    default_supplier_id BIGINT REFERENCES dim_supplier(supplier_id),
    status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'obsolete')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.4 安全库存配置表
CREATE TABLE IF NOT EXISTS fact_safety_stock (
    safety_stock_id BIGSERIAL PRIMARY KEY,
    sku_id          BIGINT NOT NULL REFERENCES dim_sku(sku_id),
    warehouse_id    BIGINT NOT NULL REFERENCES dim_warehouse(warehouse_id),
    min_stock_qty   DECIMAL(18,4) NOT NULL DEFAULT 0,
    max_stock_qty   DECIMAL(18,4),
    reorder_point   DECIMAL(18,4),
    reorder_qty     DECIMAL(18,4),
    lead_time_days  INT DEFAULT 7,
    review_period   VARCHAR(20) DEFAULT 'weekly' CHECK (review_period IN ('daily', 'weekly', 'biweekly', 'monthly')),
    effective_date  DATE NOT NULL,
    expiry_date     DATE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sku_id, warehouse_id, effective_date)
);

-- ========================================
-- 二、业务单据表
-- ========================================

-- 2.1 入库单主表
CREATE TABLE IF NOT EXISTS fact_inbound_order (
    inbound_id      BIGSERIAL PRIMARY KEY,
    inbound_no      VARCHAR(50) NOT NULL UNIQUE,
    inbound_type    VARCHAR(50) NOT NULL CHECK (inbound_type IN ('purchase', 'return', 'transfer', 'production', 'other')),
    warehouse_id    BIGINT NOT NULL REFERENCES dim_warehouse(warehouse_id),
    supplier_id     BIGINT REFERENCES dim_supplier(supplier_id),
    reference_no    VARCHAR(100),
    order_date      DATE NOT NULL,
    total_qty       DECIMAL(18,4) NOT NULL DEFAULT 0,
    total_amount    DECIMAL(18,4) DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed', 'cancelled')),
    remark          TEXT,
    created_by      VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.2 入库单明细表
CREATE TABLE IF NOT EXISTS fact_inbound_item (
    inbound_item_id BIGSERIAL PRIMARY KEY,
    inbound_id      BIGINT NOT NULL REFERENCES fact_inbound_order(inbound_id) ON DELETE CASCADE,
    sku_id          BIGINT NOT NULL REFERENCES dim_sku(sku_id),
    batch_no        VARCHAR(100),
    production_date DATE,
    expiry_date     DATE,
    plan_qty        DECIMAL(18,4) NOT NULL,
    actual_qty      DECIMAL(18,4) NOT NULL DEFAULT 0,
    unit_price      DECIMAL(18,4),
    total_amount    DECIMAL(18,4),
    warehouse_id    BIGINT NOT NULL REFERENCES dim_warehouse(warehouse_id),
    location_id     BIGINT REFERENCES dim_warehouse(warehouse_id),
    received_at     TIMESTAMP,
    remark          TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_inbound_item_sku ON fact_inbound_item(sku_id);
CREATE INDEX IF NOT EXISTS idx_inbound_item_batch ON fact_inbound_item(batch_no);
CREATE INDEX IF NOT EXISTS idx_inbound_item_inbound ON fact_inbound_item(inbound_id);

-- 2.3 出库单主表
CREATE TABLE IF NOT EXISTS fact_outbound_order (
    outbound_id     BIGSERIAL PRIMARY KEY,
    outbound_no     VARCHAR(50) NOT NULL UNIQUE,
    outbound_type   VARCHAR(50) NOT NULL CHECK (outbound_type IN ('sales', 'transfer', 'scrap', 'sample', 'other')),
    warehouse_id    BIGINT NOT NULL REFERENCES dim_warehouse(warehouse_id),
    customer_name   VARCHAR(200),
    reference_no    VARCHAR(100),
    order_date      DATE NOT NULL,
    total_qty       DECIMAL(18,4) NOT NULL DEFAULT 0,
    total_amount    DECIMAL(18,4) DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed', 'cancelled')),
    remark          TEXT,
    created_by      VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.4 出库单明细表
CREATE TABLE IF NOT EXISTS fact_outbound_item (
    outbound_item_id BIGSERIAL PRIMARY KEY,
    outbound_id     BIGINT NOT NULL REFERENCES fact_outbound_order(outbound_id) ON DELETE CASCADE,
    sku_id          BIGINT NOT NULL REFERENCES dim_sku(sku_id),
    batch_no        VARCHAR(100),
    plan_qty        DECIMAL(18,4) NOT NULL,
    actual_qty      DECIMAL(18,4) NOT NULL DEFAULT 0,
    unit_price      DECIMAL(18,4),
    total_amount    DECIMAL(18,4),
    warehouse_id    BIGINT NOT NULL REFERENCES dim_warehouse(warehouse_id),
    location_id     BIGINT REFERENCES dim_warehouse(warehouse_id),
    shipped_at      TIMESTAMP,
    remark          TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_outbound_item_sku ON fact_outbound_item(sku_id);
CREATE INDEX IF NOT EXISTS idx_outbound_item_batch ON fact_outbound_item(batch_no);
CREATE INDEX IF NOT EXISTS idx_outbound_item_outbound ON fact_outbound_item(outbound_id);

-- 2.5 退货单主表
CREATE TABLE IF NOT EXISTS fact_return_order (
    return_id       BIGSERIAL PRIMARY KEY,
    return_no       VARCHAR(50) NOT NULL UNIQUE,
    return_type     VARCHAR(50) NOT NULL CHECK (return_type IN ('customer_return', 'supplier_return', 'other')),
    warehouse_id    BIGINT NOT NULL REFERENCES dim_warehouse(warehouse_id),
    supplier_id     BIGINT REFERENCES dim_supplier(supplier_id),
    customer_name   VARCHAR(200),
    reference_no    VARCHAR(100),
    original_outbound_no VARCHAR(50),
    return_date     DATE NOT NULL,
    total_qty       DECIMAL(18,4) NOT NULL DEFAULT 0,
    total_amount    DECIMAL(18,4) DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed', 'cancelled')),
    return_reason   TEXT,
    remark          TEXT,
    created_by      VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.6 退货单明细表
CREATE TABLE IF NOT EXISTS fact_return_item (
    return_item_id  BIGSERIAL PRIMARY KEY,
    return_id       BIGINT NOT NULL REFERENCES fact_return_order(return_id) ON DELETE CASCADE,
    sku_id          BIGINT NOT NULL REFERENCES dim_sku(sku_id),
    batch_no        VARCHAR(100),
    return_qty      DECIMAL(18,4) NOT NULL,
    unit_price      DECIMAL(18,4),
    total_amount    DECIMAL(18,4),
    warehouse_id    BIGINT NOT NULL REFERENCES dim_warehouse(warehouse_id),
    is_resellable   BOOLEAN DEFAULT TRUE,
    processed_at    TIMESTAMP,
    remark          TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_return_item_sku ON fact_return_item(sku_id);
CREATE INDEX IF NOT EXISTS idx_return_item_batch ON fact_return_item(batch_no);

-- ========================================
-- 三、库存快照表（每日日结）
-- ========================================

CREATE TABLE IF NOT EXISTS fact_inventory_snapshot (
    snapshot_id     BIGSERIAL PRIMARY KEY,
    snapshot_date   DATE NOT NULL,
    sku_id          BIGINT NOT NULL REFERENCES dim_sku(sku_id),
    warehouse_id    BIGINT NOT NULL REFERENCES dim_warehouse(warehouse_id),
    location_id     BIGINT REFERENCES dim_warehouse(warehouse_id),
    batch_no        VARCHAR(100) NOT NULL,
    production_date DATE,
    expiry_date     DATE,
    opening_qty     DECIMAL(18,4) NOT NULL DEFAULT 0,
    inbound_qty     DECIMAL(18,4) NOT NULL DEFAULT 0,
    outbound_qty    DECIMAL(18,4) NOT NULL DEFAULT 0,
    return_in_qty   DECIMAL(18,4) NOT NULL DEFAULT 0,
    return_out_qty  DECIMAL(18,4) NOT NULL DEFAULT 0,
    closing_qty     DECIMAL(18,4) NOT NULL DEFAULT 0,
    unit_cost       DECIMAL(18,4),
    closing_amount  DECIMAL(18,4),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(snapshot_date, sku_id, warehouse_id, location_id, batch_no)
);
CREATE INDEX IF NOT EXISTS idx_inv_snap_date ON fact_inventory_snapshot(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_inv_snap_sku ON fact_inventory_snapshot(sku_id);
CREATE INDEX IF NOT EXISTS idx_inv_snap_batch ON fact_inventory_snapshot(batch_no);

-- ========================================
-- 四、分析辅助表
-- ========================================

-- 4.1 异常注释表（用户对异常点的备注）
CREATE TABLE IF NOT EXISTS fact_anomaly_comment (
    comment_id      BIGSERIAL PRIMARY KEY,
    comment_type    VARCHAR(50) NOT NULL CHECK (comment_type IN ('sku', 'batch', 'supplier', 'warehouse', 'metric')),
    ref_sku_id      BIGINT REFERENCES dim_sku(sku_id),
    ref_batch_no    VARCHAR(100),
    ref_supplier_id BIGINT REFERENCES dim_supplier(supplier_id),
    ref_warehouse_id BIGINT REFERENCES dim_warehouse(warehouse_id),
    metric_name     VARCHAR(100),
    metric_value    DECIMAL(18,4),
    data_date       DATE,
    comment_text    TEXT NOT NULL,
    severity        VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    action_items    TEXT,
    assignee        VARCHAR(100),
    due_date        DATE,
    status          VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_by      VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4.2 报表订阅表
CREATE TABLE IF NOT EXISTS dim_report_subscription (
    subscription_id BIGSERIAL PRIMARY KEY,
    report_name     VARCHAR(200) NOT NULL,
    dashboard_id    VARCHAR(100),
    schedule_type   VARCHAR(20) NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'custom')),
    schedule_cron   VARCHAR(100),
    export_format   VARCHAR(20) DEFAULT 'pdf' CHECK (export_format IN ('pdf', 'csv', 'excel', 'png')),
    recipients      TEXT NOT NULL,
    channels        VARCHAR(100) DEFAULT 'email' CHECK (channels IN ('email', 'wecom', 'dingtalk', 'all')),
    filters         JSONB,
    is_enabled      BOOLEAN DEFAULT TRUE,
    created_by      VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 五、视图 - 供ETL同步到ClickHouse使用
-- ========================================

-- 库存明细视图
CREATE OR REPLACE VIEW vw_inventory_detail AS
SELECT
    s.snapshot_date,
    s.sku_id,
    sk.sku_code,
    sk.sku_name,
    sk.category_l1,
    sk.category_l2,
    sk.category_l3,
    sk.brand,
    sk.unit,
    sk.shelf_life_days,
    s.warehouse_id,
    w.warehouse_code,
    w.warehouse_name,
    s.location_id,
    l.warehouse_code AS location_code,
    l.warehouse_name AS location_name,
    s.batch_no,
    s.production_date,
    s.expiry_date,
    s.opening_qty,
    s.inbound_qty,
    s.outbound_qty,
    s.return_in_qty,
    s.return_out_qty,
    s.closing_qty,
    s.unit_cost,
    s.closing_amount,
    CURRENT_DATE - s.production_date AS inventory_age_days,
    CASE
        WHEN s.expiry_date IS NOT NULL THEN s.expiry_date - CURRENT_DATE
        ELSE NULL
    END AS days_to_expiry,
    s.created_at
FROM fact_inventory_snapshot s
JOIN dim_sku sk ON s.sku_id = sk.sku_id
JOIN dim_warehouse w ON s.warehouse_id = w.warehouse_id
LEFT JOIN dim_warehouse l ON s.location_id = l.warehouse_id;

-- 入库明细视图
CREATE OR REPLACE VIEW vw_inbound_detail AS
SELECT
    io.inbound_no,
    io.inbound_type,
    io.order_date,
    io.reference_no,
    ii.sku_id,
    sk.sku_code,
    sk.sku_name,
    sk.category_l1,
    sk.category_l2,
    sk.brand,
    ii.batch_no,
    ii.production_date,
    ii.expiry_date,
    ii.actual_qty,
    ii.unit_price,
    ii.total_amount,
    io.warehouse_id,
    w.warehouse_code,
    w.warehouse_name,
    ii.location_id,
    l.warehouse_code AS location_code,
    io.supplier_id,
    sp.supplier_code,
    sp.supplier_name,
    io.created_by,
    ii.received_at,
    ii.remark
FROM fact_inbound_item ii
JOIN fact_inbound_order io ON ii.inbound_id = io.inbound_id
JOIN dim_sku sk ON ii.sku_id = sk.sku_id
JOIN dim_warehouse w ON io.warehouse_id = w.warehouse_id
LEFT JOIN dim_warehouse l ON ii.location_id = l.warehouse_id
LEFT JOIN dim_supplier sp ON io.supplier_id = sp.supplier_id
WHERE io.status = 'completed';

-- 出库明细视图
CREATE OR REPLACE VIEW vw_outbound_detail AS
SELECT
    oo.outbound_no,
    oo.outbound_type,
    oo.order_date,
    oo.reference_no,
    oo.customer_name,
    oi.sku_id,
    sk.sku_code,
    sk.sku_name,
    sk.category_l1,
    sk.category_l2,
    sk.brand,
    oi.batch_no,
    oi.actual_qty,
    oi.unit_price,
    oi.total_amount,
    oo.warehouse_id,
    w.warehouse_code,
    w.warehouse_name,
    oi.location_id,
    l.warehouse_code AS location_code,
    oo.created_by,
    oi.shipped_at,
    oi.remark
FROM fact_outbound_item oi
JOIN fact_outbound_order oo ON oi.outbound_id = oo.outbound_id
JOIN dim_sku sk ON oi.sku_id = sk.sku_id
JOIN dim_warehouse w ON oo.warehouse_id = w.warehouse_id
LEFT JOIN dim_warehouse l ON oi.location_id = l.warehouse_id
WHERE oo.status = 'completed';

-- 退货明细视图
CREATE OR REPLACE VIEW vw_return_detail AS
SELECT
    ro.return_no,
    ro.return_type,
    ro.return_date,
    ro.reference_no,
    ro.customer_name,
    ro.original_outbound_no,
    ro.return_reason,
    ri.sku_id,
    sk.sku_code,
    sk.sku_name,
    sk.category_l1,
    sk.category_l2,
    sk.brand,
    ri.batch_no,
    ri.return_qty,
    ri.unit_price,
    ri.total_amount,
    ro.warehouse_id,
    w.warehouse_code,
    w.warehouse_name,
    ro.supplier_id,
    sp.supplier_code,
    sp.supplier_name,
    ri.is_resellable,
    ri.processed_at,
    ri.remark
FROM fact_return_item ri
JOIN fact_return_order ro ON ri.return_id = ro.return_id
JOIN dim_sku sk ON ri.sku_id = sk.sku_id
JOIN dim_warehouse w ON ro.warehouse_id = w.warehouse_id
LEFT JOIN dim_supplier sp ON ro.supplier_id = sp.supplier_id
WHERE ro.status = 'completed';

-- 安全库存视图
CREATE OR REPLACE VIEW vw_safety_stock AS
SELECT
    ss.sku_id,
    sk.sku_code,
    sk.sku_name,
    sk.category_l1,
    sk.category_l2,
    ss.warehouse_id,
    w.warehouse_code,
    w.warehouse_name,
    ss.min_stock_qty,
    ss.max_stock_qty,
    ss.reorder_point,
    ss.reorder_qty,
    ss.lead_time_days,
    ss.effective_date,
    ss.expiry_date,
    ss.created_at
FROM fact_safety_stock ss
JOIN dim_sku sk ON ss.sku_id = sk.sku_id
JOIN dim_warehouse w ON ss.warehouse_id = w.warehouse_id
WHERE (ss.expiry_date IS NULL OR ss.expiry_date >= CURRENT_DATE);
