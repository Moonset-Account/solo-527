-- ========================================
-- 仓库SKU周转与滞销分析 - ClickHouse DDL
-- ========================================

-- 数据库创建
CREATE DATABASE IF NOT EXISTS inventory_analysis COMMENT '仓库库存分析库';

USE inventory_analysis;

-- ========================================
-- 一、ODS层 - 原始数据层（从PostgreSQL同步）
-- ========================================

-- 1.1 库存明细表（每日快照）
CREATE TABLE IF NOT EXISTS ods_inventory_detail (
    snapshot_date       Date COMMENT '快照日期',
    sku_id              Int64 COMMENT 'SKU ID',
    sku_code            String COMMENT 'SKU编码',
    sku_name            String COMMENT 'SKU名称',
    category_l1         String COMMENT '一级分类',
    category_l2         String COMMENT '二级分类',
    category_l3         String COMMENT '三级分类',
    brand               String COMMENT '品牌',
    unit                String COMMENT '单位',
    shelf_life_days     Nullable(Int32) COMMENT '保质期天数',
    warehouse_id        Int64 COMMENT '仓库ID',
    warehouse_code      String COMMENT '仓库编码',
    warehouse_name      String COMMENT '仓库名称',
    location_id         Nullable(Int64) COMMENT '库位ID',
    location_code       Nullable(String) COMMENT '库位编码',
    location_name       Nullable(String) COMMENT '库位名称',
    batch_no            String COMMENT '批次号',
    production_date     Nullable(Date) COMMENT '生产日期',
    expiry_date         Nullable(Date) COMMENT '有效期至',
    opening_qty         Decimal(18,4) COMMENT '期初数量',
    inbound_qty         Decimal(18,4) COMMENT '入库数量',
    outbound_qty        Decimal(18,4) COMMENT '出库数量',
    return_in_qty       Decimal(18,4) COMMENT '退货入库数量',
    return_out_qty      Decimal(18,4) COMMENT '退货出库数量',
    closing_qty         Decimal(18,4) COMMENT '期末数量',
    unit_cost           Nullable(Decimal(18,4)) COMMENT '单位成本',
    closing_amount      Nullable(Decimal(18,4)) COMMENT '期末金额',
    inventory_age_days  Nullable(Int32) COMMENT '库龄天数',
    days_to_expiry      Nullable(Int32) COMMENT '距到期天数',
    created_at          DateTime COMMENT '创建时间'
)
ENGINE = ReplacingMergeTree(created_at)
PARTITION BY toYYYYMM(snapshot_date)
PRIMARY KEY (snapshot_date, sku_id, warehouse_id, batch_no)
ORDER BY (snapshot_date, sku_id, warehouse_id, batch_no, location_id)
TTL snapshot_date + INTERVAL 2 YEAR
SETTINGS index_granularity = 8192;

-- 1.2 入库明细表
CREATE TABLE IF NOT EXISTS ods_inbound_detail (
    inbound_no          String COMMENT '入库单号',
    inbound_type        String COMMENT '入库类型',
    order_date          Date COMMENT '单据日期',
    reference_no        Nullable(String) COMMENT '参考单号',
    sku_id              Int64 COMMENT 'SKU ID',
    sku_code            String COMMENT 'SKU编码',
    sku_name            String COMMENT 'SKU名称',
    category_l1         String COMMENT '一级分类',
    category_l2         String COMMENT '二级分类',
    brand               String COMMENT '品牌',
    batch_no            Nullable(String) COMMENT '批次号',
    production_date     Nullable(Date) COMMENT '生产日期',
    expiry_date         Nullable(Date) COMMENT '有效期至',
    actual_qty          Decimal(18,4) COMMENT '实收数量',
    unit_price          Nullable(Decimal(18,4)) COMMENT '单价',
    total_amount        Nullable(Decimal(18,4)) COMMENT '金额',
    warehouse_id        Int64 COMMENT '仓库ID',
    warehouse_code      String COMMENT '仓库编码',
    warehouse_name      String COMMENT '仓库名称',
    location_id         Nullable(Int64) COMMENT '库位ID',
    location_code       Nullable(String) COMMENT '库位编码',
    supplier_id         Nullable(Int64) COMMENT '供应商ID',
    supplier_code       Nullable(String) COMMENT '供应商编码',
    supplier_name       Nullable(String) COMMENT '供应商名称',
    created_by          Nullable(String) COMMENT '创建人',
    received_at         Nullable(DateTime) COMMENT '收货时间',
    remark              Nullable(String) COMMENT '备注'
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(order_date)
PRIMARY KEY (order_date, inbound_no, sku_id)
ORDER BY (order_date, inbound_no, sku_id, batch_no)
TTL order_date + INTERVAL 5 YEAR
SETTINGS index_granularity = 8192;

-- 1.3 出库明细表
CREATE TABLE IF NOT EXISTS ods_outbound_detail (
    outbound_no         String COMMENT '出库单号',
    outbound_type       String COMMENT '出库类型',
    order_date          Date COMMENT '单据日期',
    reference_no        Nullable(String) COMMENT '参考单号',
    customer_name       Nullable(String) COMMENT '客户名称',
    sku_id              Int64 COMMENT 'SKU ID',
    sku_code            String COMMENT 'SKU编码',
    sku_name            String COMMENT 'SKU名称',
    category_l1         String COMMENT '一级分类',
    category_l2         String COMMENT '二级分类',
    brand               String COMMENT '品牌',
    batch_no            Nullable(String) COMMENT '批次号',
    actual_qty          Decimal(18,4) COMMENT '实发数量',
    unit_price          Nullable(Decimal(18,4)) COMMENT '单价',
    total_amount        Nullable(Decimal(18,4)) COMMENT '金额',
    warehouse_id        Int64 COMMENT '仓库ID',
    warehouse_code      String COMMENT '仓库编码',
    warehouse_name      String COMMENT '仓库名称',
    location_id         Nullable(Int64) COMMENT '库位ID',
    location_code       Nullable(String) COMMENT '库位编码',
    created_by          Nullable(String) COMMENT '创建人',
    shipped_at          Nullable(DateTime) COMMENT '发货时间',
    remark              Nullable(String) COMMENT '备注'
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(order_date)
PRIMARY KEY (order_date, outbound_no, sku_id)
ORDER BY (order_date, outbound_no, sku_id, batch_no)
TTL order_date + INTERVAL 5 YEAR
SETTINGS index_granularity = 8192;

-- 1.4 退货明细表
CREATE TABLE IF NOT EXISTS ods_return_detail (
    return_no           String COMMENT '退货单号',
    return_type         String COMMENT '退货类型',
    return_date         Date COMMENT '退货日期',
    reference_no        Nullable(String) COMMENT '参考单号',
    customer_name       Nullable(String) COMMENT '客户名称',
    original_outbound_no Nullable(String) COMMENT '原出库单号',
    return_reason       Nullable(String) COMMENT '退货原因',
    sku_id              Int64 COMMENT 'SKU ID',
    sku_code            String COMMENT 'SKU编码',
    sku_name            String COMMENT 'SKU名称',
    category_l1         String COMMENT '一级分类',
    category_l2         String COMMENT '二级分类',
    brand               String COMMENT '品牌',
    batch_no            Nullable(String) COMMENT '批次号',
    return_qty          Decimal(18,4) COMMENT '退货数量',
    unit_price          Nullable(Decimal(18,4)) COMMENT '单价',
    total_amount        Nullable(Decimal(18,4)) COMMENT '金额',
    warehouse_id        Int64 COMMENT '仓库ID',
    warehouse_code      String COMMENT '仓库编码',
    warehouse_name      String COMMENT '仓库名称',
    supplier_id         Nullable(Int64) COMMENT '供应商ID',
    supplier_code       Nullable(String) COMMENT '供应商编码',
    supplier_name       Nullable(String) COMMENT '供应商名称',
    is_resellable       Bool COMMENT '是否可二次销售',
    processed_at        Nullable(DateTime) COMMENT '处理时间',
    remark              Nullable(String) COMMENT '备注'
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(return_date)
PRIMARY KEY (return_date, return_no, sku_id)
ORDER BY (return_date, return_no, sku_id, batch_no)
TTL return_date + INTERVAL 5 YEAR
SETTINGS index_granularity = 8192;

-- 1.5 安全库存表
CREATE TABLE IF NOT EXISTS ods_safety_stock (
    sku_id              Int64 COMMENT 'SKU ID',
    sku_code            String COMMENT 'SKU编码',
    sku_name            String COMMENT 'SKU名称',
    category_l1         String COMMENT '一级分类',
    category_l2         String COMMENT '二级分类',
    warehouse_id        Int64 COMMENT '仓库ID',
    warehouse_code      String COMMENT '仓库编码',
    warehouse_name      String COMMENT '仓库名称',
    min_stock_qty       Decimal(18,4) COMMENT '最低安全库存',
    max_stock_qty       Nullable(Decimal(18,4)) COMMENT '最高库存',
    reorder_point       Nullable(Decimal(18,4)) COMMENT '再订货点',
    reorder_qty         Nullable(Decimal(18,4)) COMMENT '再订货量',
    lead_time_days      Int32 COMMENT '提前期天数',
    effective_date      Date COMMENT '生效日期',
    expiry_date         Nullable(Date) COMMENT '失效日期',
    created_at          DateTime COMMENT '创建时间'
)
ENGINE = ReplacingMergeTree(created_at)
ORDER BY (sku_id, warehouse_id, effective_date)
SETTINGS index_granularity = 8192;

-- ========================================
-- 二、DWS层 - 汇总宽表层（物化视图）
-- ========================================

-- 2.1 SKU维度库存汇总（每日）
CREATE TABLE IF NOT EXISTS dws_sku_inventory_daily
(
    stat_date           Date COMMENT '统计日期',
    sku_id              Int64 COMMENT 'SKU ID',
    sku_code            String COMMENT 'SKU编码',
    sku_name            String COMMENT 'SKU名称',
    category_l1         String COMMENT '一级分类',
    category_l2         String COMMENT '二级分类',
    category_l3         String COMMENT '三级分类',
    brand               String COMMENT '品牌',
    unit                String COMMENT '单位',
    warehouse_id        Int64 COMMENT '仓库ID',
    warehouse_code      String COMMENT '仓库编码',
    warehouse_name      String COMMENT '仓库名称',
    total_opening_qty   AggregateFunction(sum, Decimal(18,4)) COMMENT '期初总量',
    total_inbound_qty   AggregateFunction(sum, Decimal(18,4)) COMMENT '入库总量',
    total_outbound_qty  AggregateFunction(sum, Decimal(18,4)) COMMENT '出库总量',
    total_return_in_qty AggregateFunction(sum, Decimal(18,4)) COMMENT '退货入库总量',
    total_return_out_qty AggregateFunction(sum, Decimal(18,4)) COMMENT '退货出库总量',
    total_closing_qty   AggregateFunction(sum, Decimal(18,4)) COMMENT '期末总量',
    total_closing_amount AggregateFunction(sum, Nullable(Decimal(18,4))) COMMENT '期末总金额',
    batch_count         AggregateFunction(uniq, String) COMMENT '批次数量',
    avg_inventory_age   AggregateFunction(avg, Nullable(Int32)) COMMENT '平均库龄'
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(stat_date)
PRIMARY KEY (stat_date, sku_id, warehouse_id)
ORDER BY (stat_date, sku_id, warehouse_id)
TTL stat_date + INTERVAL 3 YEAR
SETTINGS index_granularity = 8192;

-- 2.2 库龄分布汇总
CREATE TABLE IF NOT EXISTS dws_inventory_age_summary
(
    stat_date           Date COMMENT '统计日期',
    category_l1         String COMMENT '一级分类',
    category_l2         String COMMENT '二级分类',
    sku_id              Int64 COMMENT 'SKU ID',
    sku_code            String COMMENT 'SKU编码',
    sku_name            String COMMENT 'SKU名称',
    warehouse_id        Int64 COMMENT '仓库ID',
    warehouse_code      String COMMENT '仓库编码',
    age_bucket          String COMMENT '库龄区间: 0-7/8-30/31-90/91-180/180+',
    total_qty           AggregateFunction(sum, Decimal(18,4)) COMMENT '库存数量',
    total_amount        AggregateFunction(sum, Nullable(Decimal(18,4))) COMMENT '库存金额',
    sku_count           AggregateFunction(uniq, Int64) COMMENT 'SKU数量',
    batch_count         AggregateFunction(uniq, String) COMMENT '批次数量'
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(stat_date)
PRIMARY KEY (stat_date, category_l1, warehouse_id, age_bucket)
ORDER BY (stat_date, category_l1, category_l2, sku_id, warehouse_id, age_bucket)
TTL stat_date + INTERVAL 3 YEAR
SETTINGS index_granularity = 8192;

-- 2.3 批次维度库存汇总
CREATE TABLE IF NOT EXISTS dws_batch_inventory_daily
(
    stat_date           Date COMMENT '统计日期',
    sku_id              Int64 COMMENT 'SKU ID',
    sku_code            String COMMENT 'SKU编码',
    sku_name            String COMMENT 'SKU名称',
    batch_no            String COMMENT '批次号',
    production_date     Nullable(Date) COMMENT '生产日期',
    expiry_date         Nullable(Date) COMMENT '有效期至',
    warehouse_id        Int64 COMMENT '仓库ID',
    warehouse_code      String COMMENT '仓库编码',
    warehouse_name      String COMMENT '仓库名称',
    supplier_id         Nullable(Int64) COMMENT '供应商ID',
    supplier_code       Nullable(String) COMMENT '供应商编码',
    supplier_name       Nullable(String) COMMENT '供应商名称',
    closing_qty         AggregateFunction(sum, Decimal(18,4)) COMMENT '期末库存',
    closing_amount      AggregateFunction(sum, Nullable(Decimal(18,4))) COMMENT '期末金额',
    inventory_age_days  AggregateFunction(max, Nullable(Int32)) COMMENT '库龄天数',
    days_to_expiry      AggregateFunction(min, Nullable(Int32)) COMMENT '距到期天数',
    is_near_expiry      AggregateFunction(max, UInt8) COMMENT '是否近效期(<=30天)',
    is_expired          AggregateFunction(max, UInt8) COMMENT '是否已过期'
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(stat_date)
PRIMARY KEY (stat_date, sku_id, batch_no, warehouse_id)
ORDER BY (stat_date, sku_id, batch_no, warehouse_id)
TTL stat_date + INTERVAL 3 YEAR
SETTINGS index_granularity = 8192;

-- 2.4 周转汇总表（按月）
CREATE TABLE IF NOT EXISTS dws_sku_turnover_monthly
(
    stat_month          Date COMMENT '统计月份',
    sku_id              Int64 COMMENT 'SKU ID',
    sku_code            String COMMENT 'SKU编码',
    sku_name            String COMMENT 'SKU名称',
    category_l1         String COMMENT '一级分类',
    category_l2         String COMMENT '二级分类',
    warehouse_id        Int64 COMMENT '仓库ID',
    warehouse_code      String COMMENT '仓库编码',
    warehouse_name      String COMMENT '仓库名称',
    monthly_outbound_qty AggregateFunction(sum, Decimal(18,4)) COMMENT '月出库总量',
    avg_inventory_qty   AggregateFunction(avg, Decimal(18,4)) COMMENT '月均库存量',
    turnover_rate       AggregateFunction(sum, Decimal(18,4)) COMMENT '周转率',
    turnover_days       AggregateFunction(avg, Decimal(18,4)) COMMENT '周转天数'
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(stat_month)
PRIMARY KEY (stat_month, sku_id, warehouse_id)
ORDER BY (stat_month, sku_id, warehouse_id)
TTL stat_month + INTERVAL 5 YEAR
SETTINGS index_granularity = 8192;

-- ========================================
-- 三、ADS层 - 应用层（供Superset直接查询）
-- ========================================

-- 3.1 库存漏斗视图（每日）
CREATE VIEW IF NOT EXISTS ads_inventory_funnel AS
SELECT
    snapshot_date,
    '期初库存' AS stage,
    sum(opening_qty) AS qty,
    sum(closing_amount) AS amount
FROM ods_inventory_detail
GROUP BY snapshot_date
UNION ALL
SELECT
    snapshot_date,
    '入库' AS stage,
    sum(inbound_qty) AS qty,
    0 AS amount
FROM ods_inventory_detail
GROUP BY snapshot_date
UNION ALL
SELECT
    snapshot_date,
    '出库' AS stage,
    -sum(outbound_qty) AS qty,
    0 AS amount
FROM ods_inventory_detail
GROUP BY snapshot_date
UNION ALL
SELECT
    snapshot_date,
    '退货净量' AS stage,
    sum(return_in_qty - return_out_qty) AS qty,
    0 AS amount
FROM ods_inventory_detail
GROUP BY snapshot_date
UNION ALL
SELECT
    snapshot_date,
    '期末库存' AS stage,
    sum(closing_qty) AS qty,
    sum(closing_amount) AS amount
FROM ods_inventory_detail
GROUP BY snapshot_date;

-- 3.2 库龄分布视图
CREATE VIEW IF NOT EXISTS ads_inventory_age_distribution AS
SELECT
    snapshot_date,
    category_l1,
    category_l2,
    warehouse_code,
    warehouse_name,
    CASE
        WHEN inventory_age_days <= 7 THEN '0-7天'
        WHEN inventory_age_days <= 30 THEN '8-30天'
        WHEN inventory_age_days <= 90 THEN '31-90天'
        WHEN inventory_age_days <= 180 THEN '91-180天'
        ELSE '180天+'
    END AS age_bucket,
    count(DISTINCT sku_id) AS sku_count,
    sum(closing_qty) AS total_qty,
    sum(closing_amount) AS total_amount
FROM ods_inventory_detail
WHERE closing_qty > 0
GROUP BY snapshot_date, category_l1, category_l2, warehouse_code, warehouse_name, age_bucket;

-- 3.3 周转排行视图（近30天）
CREATE VIEW IF NOT EXISTS ads_turnover_ranking AS
SELECT
    today() AS stat_date,
    sku_id,
    sku_code,
    sku_name,
    category_l1,
    category_l2,
    warehouse_code,
    warehouse_name,
    sum(outbound_qty) AS last_30d_outbound_qty,
    avg(closing_qty) AS avg_inventory_qty,
    CASE
        WHEN avg(closing_qty) > 0 THEN sum(outbound_qty) / avg(closing_qty)
        ELSE 0
    END AS turnover_rate,
    CASE
        WHEN sum(outbound_qty) > 0 THEN 30 * avg(closing_qty) / sum(outbound_qty)
        ELSE 999
    END AS turnover_days
FROM ods_inventory_detail
WHERE snapshot_date >= today() - 30
GROUP BY sku_id, sku_code, sku_name, category_l1, category_l2, warehouse_code, warehouse_name;

-- 3.4 补货建议视图
CREATE VIEW IF NOT EXISTS ads_replenishment_suggestion AS
WITH current_inventory AS (
    SELECT
        sku_id,
        sku_code,
        sku_name,
        category_l1,
        category_l2,
        warehouse_id,
        warehouse_code,
        warehouse_name,
        sum(closing_qty) AS current_stock_qty
    FROM ods_inventory_detail
    WHERE snapshot_date = today() - 1
    GROUP BY sku_id, sku_code, sku_name, category_l1, category_l2, warehouse_id, warehouse_code, warehouse_name
),
avg_demand AS (
    SELECT
        sku_id,
        warehouse_id,
        avg(daily_outbound) AS avg_daily_demand
    FROM (
        SELECT
            snapshot_date,
            sku_id,
            warehouse_id,
            sum(outbound_qty) AS daily_outbound
        FROM ods_inventory_detail
        WHERE snapshot_date >= today() - 30
        GROUP BY snapshot_date, sku_id, warehouse_id
    )
    GROUP BY sku_id, warehouse_id
)
SELECT
    ci.sku_id,
    ci.sku_code,
    ci.sku_name,
    ci.category_l1,
    ci.category_l2,
    ci.warehouse_code,
    ci.warehouse_name,
    ci.current_stock_qty,
    ss.min_stock_qty,
    ss.reorder_point,
    ss.reorder_qty,
    ss.lead_time_days,
    ad.avg_daily_demand,
    CASE
        WHEN ad.avg_daily_demand > 0 THEN ci.current_stock_qty / ad.avg_daily_demand
        ELSE 999
    END AS days_of_supply,
    CASE
        WHEN ci.current_stock_qty < ss.min_stock_qty THEN '严重缺货'
        WHEN ci.current_stock_qty < ss.reorder_point THEN '建议补货'
        WHEN ci.current_stock_qty > ss.max_stock_qty THEN '库存过高'
        ELSE '正常'
    END AS stock_status,
    CASE
        WHEN ci.current_stock_qty < ss.reorder_point AND ss.reorder_qty > 0
        THEN ss.reorder_qty
        WHEN ci.current_stock_qty < ss.reorder_point AND ad.avg_daily_demand > 0
        THEN ceil(ad.avg_daily_demand * ss.lead_time_days * 1.5)
        ELSE 0
    END AS suggested_replenish_qty
FROM current_inventory ci
LEFT JOIN ods_safety_stock ss
    ON ci.sku_id = ss.sku_id AND ci.warehouse_id = ss.warehouse_id
    AND ss.effective_date <= today()
    AND (ss.expiry_date IS NULL OR ss.expiry_date >= today())
LEFT JOIN avg_demand ad ON ci.sku_id = ad.sku_id AND ci.warehouse_id = ad.warehouse_id
WHERE ci.current_stock_qty < ss.reorder_point OR ci.current_stock_qty > ss.max_stock_qty;

-- 3.5 近效期和滞销预警视图
CREATE VIEW IF NOT EXISTS ads_inventory_alerts AS
SELECT
    snapshot_date,
    sku_id,
    sku_code,
    sku_name,
    category_l1,
    category_l2,
    batch_no,
    production_date,
    expiry_date,
    warehouse_code,
    warehouse_name,
    location_code,
    closing_qty,
    inventory_age_days,
    days_to_expiry,
    CASE
        WHEN days_to_expiry <= 0 THEN '已过期'
        WHEN days_to_expiry <= 7 THEN '临期(7天内)'
        WHEN days_to_expiry <= 30 THEN '近效期(30天内)'
        WHEN days_to_expiry <= 90 THEN '关注(90天内)'
        ELSE '正常'
    END AS expiry_status,
    CASE
        WHEN inventory_age_days > 180 AND last_30d_outbound = 0 THEN '滞销(180天+无出库)'
        WHEN inventory_age_days > 90 AND last_30d_outbound = 0 THEN '慢销(90天+无出库)'
        WHEN inventory_age_days > 180 THEN '库龄过长(180天+)'
        ELSE '正常'
    END AS slow_moving_status,
    last_30d_outbound,
    supplier_code,
    supplier_name
FROM (
    SELECT
        inv.snapshot_date,
        inv.sku_id,
        inv.sku_code,
        inv.sku_name,
        inv.category_l1,
        inv.category_l2,
        inv.batch_no,
        inv.production_date,
        inv.expiry_date,
        inv.warehouse_code,
        inv.warehouse_name,
        inv.location_code,
        inv.closing_qty,
        inv.inventory_age_days,
        inv.days_to_expiry,
        COALESCE(ob.last_30d_outbound, 0) AS last_30d_outbound,
        ib.supplier_code,
        ib.supplier_name
    FROM ods_inventory_detail inv
    LEFT JOIN (
        SELECT sku_id, batch_no, sum(actual_qty) AS last_30d_outbound
        FROM ods_outbound_detail
        WHERE order_date >= today() - 30
        GROUP BY sku_id, batch_no
    ) ob ON inv.sku_id = ob.sku_id AND inv.batch_no = ob.batch_no
    LEFT JOIN (
        SELECT sku_id, batch_no, supplier_code, supplier_name
        FROM ods_inbound_detail
        WHERE (sku_id, batch_no, order_date) IN (
            SELECT sku_id, batch_no, max(order_date)
            FROM ods_inbound_detail
            GROUP BY sku_id, batch_no
        )
    ) ib ON inv.sku_id = ib.sku_id AND inv.batch_no = ib.batch_no
    WHERE inv.snapshot_date = today() - 1
    AND inv.closing_qty > 0
)
WHERE expiry_status != '正常' OR slow_moving_status != '正常';

-- ========================================
-- 四、自定义函数
-- ========================================

-- 计算库龄区间
CREATE FUNCTION IF NOT EXISTS get_age_bucket(age_days Int32)
RETURNS String
LANGUAGE SQL
DETERMINISTIC
AS $$
CASE
    WHEN age_days <= 7 THEN '0-7天'
    WHEN age_days <= 30 THEN '8-30天'
    WHEN age_days <= 90 THEN '31-90天'
    WHEN age_days <= 180 THEN '91-180天'
    ELSE '180天+'
END
$$;

-- 计算周转等级
CREATE FUNCTION IF NOT EXISTS get_turnover_grade(turnover_days Float64)
RETURNS String
LANGUAGE SQL
DETERMINISTIC
AS $$
CASE
    WHEN turnover_days <= 7 THEN 'A(极快)'
    WHEN turnover_days <= 15 THEN 'B(较快)'
    WHEN turnover_days <= 30 THEN 'C(正常)'
    WHEN turnover_days <= 60 THEN 'D(较慢)'
    WHEN turnover_days <= 90 THEN 'E(慢)'
    ELSE 'F(滞销)'
END
$$;
