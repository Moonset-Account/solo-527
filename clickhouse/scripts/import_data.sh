#!/bin/bash
# ============================================
# ClickHouse 数据导入脚本
# 用法: ./import_data.sh [clickhouse-client 参数]
# ============================================

set -e

CLICKHOUSE_CLIENT=${CLICKHOUSE_CLIENT:-clickhouse-client}
DB="charger_monitor"
DATA_DIR="./clickhouse/data"

echo "=== 开始导入数据到 ClickHouse ==="

# 创建数据目录
mkdir -p ${DATA_DIR}

echo "[1/8] 导入站点数据..."
${CLICKHOUSE_CLIENT} -d ${DB} --query="
INSERT INTO dim_station FORMAT CSVWithNames
" < ${DATA_DIR}/stations.csv 2>/dev/null || echo "  跳过: stations.csv 不存在"

echo "[2/8] 导入充电桩数据..."
${CLICKHOUSE_CLIENT} -d ${DB} --query="
INSERT INTO dim_charger FORMAT CSVWithNames
" < ${DATA_DIR}/chargers.csv 2>/dev/null || echo "  跳过: chargers.csv 不存在"

echo "[3/8] 导入故障码数据..."
${CLICKHOUSE_CLIENT} -d ${DB} --query="
INSERT INTO dim_fault_code FORMAT CSVWithNames
" < ${DATA_DIR}/fault_codes.csv 2>/dev/null || echo "  跳过: fault_codes.csv 不存在"

echo "[4/8] 导入维修人员数据..."
${CLICKHOUSE_CLIENT} -d ${DB} --query="
INSERT INTO dim_repair_person FORMAT CSVWithNames
" < ${DATA_DIR}/repair_persons.csv 2>/dev/null || echo "  跳过: repair_persons.csv 不存在"

echo "[5/8] 导入充电会话数据..."
${CLICKHOUSE_CLIENT} -d ${DB} --query="
INSERT INTO fact_charging_session FORMAT CSVWithNames
" < ${DATA_DIR}/sessions.csv 2>/dev/null || echo "  跳过: sessions.csv 不存在"

echo "[6/8] 导入功率读数数据..."
${CLICKHOUSE_CLIENT} -d ${DB} --query="
INSERT INTO fact_power_reading FORMAT CSVWithNames
" < ${DATA_DIR}/power_readings.csv 2>/dev/null || echo "  跳过: power_readings.csv 不存在"

echo "[7/8] 导入故障日志数据..."
${CLICKHOUSE_CLIENT} -d ${DB} --query="
INSERT INTO fact_fault_log FORMAT CSVWithNames
" < ${DATA_DIR}/fault_logs.csv 2>/dev/null || echo "  跳过: fault_logs.csv 不存在"

echo "[8/8] 导入维修工单数据..."
${CLICKHOUSE_CLIENT} -d ${DB} --query="
INSERT INTO fact_repair_order FORMAT CSVWithNames
" < ${DATA_DIR}/repair_orders.csv 2>/dev/null || echo "  跳过: repair_orders.csv 不存在"

echo ""
echo "=== 导入完成，验证数据量 ==="
${CLICKHOUSE_CLIENT} -d ${DB} --query="
SELECT
    'dim_station' as table, count() as rows FROM dim_station
UNION ALL
SELECT 'dim_charger', count() FROM dim_charger
UNION ALL
SELECT 'fact_fault_log', count() FROM fact_fault_log
UNION ALL
SELECT 'fact_repair_order', count() FROM fact_repair_order
UNION ALL
SELECT 'fact_power_reading', count() FROM fact_power_reading
FORMAT PrettyCompact
"

echo ""
echo "=== 优化表 (OPTIMIZE) ==="
${CLICKHOUSE_CLIENT} -d ${DB} --query="OPTIMIZE TABLE dim_station FINAL" 2>/dev/null
${CLICKHOUSE_CLIENT} -d ${DB} --query="OPTIMIZE TABLE dim_charger FINAL" 2>/dev/null
echo "完成!"
