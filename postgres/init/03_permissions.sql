-- ========================================
-- 仓库SKU周转与滞销分析 - 权限配置
-- PostgreSQL 行级安全策略 + Superset角色权限
-- ========================================

-- ========================================
-- 一、PostgreSQL 数据库角色
-- ========================================

-- 1.1 创建角色
CREATE ROLE sc_analyst;        -- 供应链分析师
CREATE ROLE warehouse_manager;  -- 仓库经理
CREATE ROLE purchasing;         -- 采购
CREATE ROLE viewer;             -- 只读查看
CREATE ROLE etl_user;           -- ETL同步账号
CREATE ROLE superset_user;      -- Superset查询账号

-- 1.2 权限配置

-- ETL账号：业务库读写
GRANT CONNECT ON DATABASE inventory TO etl_user;
GRANT USAGE ON SCHEMA public TO etl_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO etl_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO etl_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO etl_user;

-- Superset账号：视图只读
GRANT CONNECT ON DATABASE inventory TO superset_user;
GRANT USAGE ON SCHEMA public TO superset_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO superset_user;

-- 仓库经理：本仓库数据访问
GRANT CONNECT ON DATABASE inventory TO warehouse_manager;
GRANT USAGE ON SCHEMA public TO warehouse_manager;

-- 启用行级安全
ALTER TABLE fact_inventory_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_inbound_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_outbound_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_return_order ENABLE ROW LEVEL SECURITY;

-- 仓库经理行级策略：只能看自己仓库的数据
CREATE POLICY warehouse_manager_inventory ON fact_inventory_snapshot
    FOR SELECT TO warehouse_manager
    USING (warehouse_id IN (
        SELECT warehouse_id FROM dim_warehouse
        WHERE warehouse_code = current_setting('app.current_warehouse', true)
    ));

CREATE POLICY warehouse_manager_inbound ON fact_inbound_order
    FOR SELECT TO warehouse_manager
    USING (warehouse_id IN (
        SELECT warehouse_id FROM dim_warehouse
        WHERE warehouse_code = current_setting('app.current_warehouse', true)
    ));

-- ========================================
-- 二、Superset 角色权限配置
-- ========================================

-- 以下为Superset角色说明，实际在Superset UI中配置

/*
角色1: 供应链分析师 (Supply Chain Analyst)
权限:
  - 所有仪表盘查看权限
  - 所有数据集查询权限
  - 导出权限（PDF/CSV/PNG）
  - 注释添加权限
  - 下钻到明细权限
  - 报表订阅权限
数据范围: 全仓库

角色2: 仓库经理 (Warehouse Manager)
权限:
  - 库存分析仪表盘查看权限
  - 本仓库数据访问（行级过滤）
  - 导出权限（CSV）
  - 注释添加权限
数据范围: 仅本仓库

角色3: 采购专员 (Purchasing)
权限:
  - 补货建议仪表盘查看权限
  - 供应商分析查看权限
  - 导出权限
数据范围: 全仓库（补货相关）

角色4: 部门总监 (Department Director)
权限:
  - 所有仪表盘查看权限
  - 导出权限（PDF）
  - 报表订阅权限
数据范围: 全仓库（聚合数据，无明细）

角色5: 只读访客 (Viewer)
权限:
  - 公开仪表盘查看权限
  - 无导出权限
数据范围: 脱敏聚合数据
*/

-- ========================================
-- 三、ClickHouse 用户权限
-- ========================================

/*
-- 在ClickHouse中执行
CREATE USER superset_user IDENTIFIED BY 'superset_password';
CREATE USER etl_user IDENTIFIED BY 'etl_password';

-- Superset用户：所有视图只读
GRANT SELECT ON inventory_analysis.ads_* TO superset_user;
GRANT SELECT ON inventory_analysis.dws_* TO superset_user;

-- ETL用户：ODS层读写
GRANT SELECT, INSERT, ALTER ON inventory_analysis.ods_* TO etl_user;
GRANT SELECT, ALTER ON inventory_analysis.dws_* TO etl_user;

-- 仓库经理角色（ClickHouse侧行级过滤通过视图实现）
CREATE VIEW inventory_analysis.ads_inventory_warehouse_wh001
AS SELECT * FROM inventory_analysis.ads_inventory_detail
WHERE warehouse_code = 'WH001';

GRANT SELECT ON inventory_analysis.ads_inventory_warehouse_wh001 TO warehouse_manager_wh001;
*/
