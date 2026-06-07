#!/usr/bin/env bash
# ============================================
# ClickHouse 数据导入脚本
#
# 用法:
#   bash clickhouse/scripts/import_data.sh
#
# 前置条件:
#   1. 已执行 clickhouse/ddl/01_create_tables.sql 建表
#   2. 已执行 node clickhouse/scripts/generate_csv.js 生成数据
#   3. clickhouse-client 在 PATH 中可用
#
# 环境变量（可选）:
#   CH_HOST       ClickHouse 主机 (默认: localhost)
#   CH_PORT       ClickHouse 端口 (默认: 8123)
#   CH_USER       用户名 (默认: default)
#   CH_PASSWORD   密码 (默认: 空)
#   CH_DATABASE   数据库名 (默认: charger_monitor)
# ============================================

set -euo pipefail

# 配置
CH_HOST="${CH_HOST:-localhost}"
CH_PORT="${CH_PORT:-9000}"
CH_USER="${CH_USER:-default}"
CH_PASSWORD="${CH_PASSWORD:-}"
CH_DATABASE="${CH_DATABASE:-charger_monitor}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DATA_DIR="${PROJECT_ROOT}/clickhouse/data"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         ClickHouse 充电桩监控数据导入工具                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

info "配置信息:"
echo "  主机: ${CH_HOST}:${CH_PORT}"
echo "  用户: ${CH_USER}"
echo "  数据库: ${CH_DATABASE}"
echo "  数据目录: ${DATA_DIR}"
echo ""

# 检查 clickhouse-client
if ! command -v clickhouse-client &> /dev/null; then
  error "未找到 clickhouse-client，请先安装 ClickHouse"
fi

# 检查数据目录
if [ ! -d "${DATA_DIR}" ]; then
  error "数据目录不存在: ${DATA_DIR}，请先运行: node clickhouse/scripts/generate_csv.js"
fi

# 构建 clickhouse-client 参数
CH_ARGS=(
  --host="${CH_HOST}"
  --port="${CH_PORT}"
  --user="${CH_USER}"
  --database="${CH_DATABASE}"
  --format_csv_delimiter=","
  --input_format_csv_skip_first_lines=1
)
if [ -n "${CH_PASSWORD}" ]; then
  CH_ARGS+=(--password="${CH_PASSWORD}")
fi

# 测试连接
info "测试 ClickHouse 连接..."
if ! clickhouse-client "${CH_ARGS[@]}" --query="SELECT 1" > /dev/null 2>&1; then
  error "无法连接到 ClickHouse，请检查服务是否运行"
fi
info "连接成功！"

echo ""
info "开始导入数据 (按 Ctrl+C 可中断)..."
echo ""

import_table() {
  local table_name="$1"
  local csv_file="$2"
  local columns="$3"
  
  if [ ! -f "${csv_file}" ]; then
    warn "跳过 ${table_name}: 文件不存在 ${csv_file}"
    return 1
  fi
  
  local line_count
  line_count=$(wc -l < "${csv_file}" | tr -d ' ')
  local data_count=$((line_count - 1))  # 减去表头
  
  info "导入 ${table_name} (${data_count} 条记录)..."
  
  if clickhouse-client "${CH_ARGS[@]}" \
      --query="INSERT INTO ${table_name} (${columns}) FORMAT CSV" \
      < "${csv_file}"; then
    info "  ✓ ${table_name} 导入完成"
    return 0
  else
    error "  ✗ ${table_name} 导入失败"
    return 1
  fi
}

# ========== 维表 ==========
import_table "dim_station" \
  "${DATA_DIR}/dim_station.csv" \
  "station_id, station_name, region, address, lat, lng, create_time, update_time"

import_table "dim_charger" \
  "${DATA_DIR}/dim_charger.csv" \
  "charger_id, station_id, model, brand, rated_power, install_date, status, is_offline, update_time"

import_table "dim_fault_code" \
  "${DATA_DIR}/dim_fault_code.csv" \
  "fault_code, fault_desc, severity, avg_repair_hours, update_time"

import_table "dim_repair_person" \
  "${DATA_DIR}/dim_repair_person.csv" \
  "person_id, person_name, team, phone, update_time"

# ========== 事实表 ==========
import_table "fact_charging_session" \
  "${DATA_DIR}/fact_charging_session.csv" \
  "session_id, charger_id, station_id, start_time, end_time, duration_min, total_kwh, avg_power, peak_power, car_model, payment_amount, create_time"

import_table "fact_power_reading" \
  "${DATA_DIR}/fact_power_reading.csv" \
  "reading_id, session_id, charger_id, timestamp, power, voltage, current, temp_c, is_anomaly, create_time"

import_table "fact_fault_log" \
  "${DATA_DIR}/fact_fault_log.csv" \
  "fault_id, charger_id, station_id, fault_code, severity, occur_time, resolve_time, is_resolved, source, create_time"

import_table "fact_repair_order" \
  "${DATA_DIR}/fact_repair_order.csv" \
  "order_id, fault_id, charger_id, station_id, fault_code, person_id, person_name, team, create_time, assign_time, arrive_time, complete_time, repair_hours, status, parts_used, remark, create_time_sys"

import_table "fact_inspection" \
  "${DATA_DIR}/fact_inspection.csv" \
  "inspection_id, station_id, inspector, inspect_time, charger_count, fault_found, items_passed, items_failed, remark, create_time"

# ========== 优化表 ==========
echo ""
info "优化 ReplacingMergeTree 表..."
clickhouse-client "${CH_ARGS[@]}" --query="OPTIMIZE TABLE dim_station FINAL" 2>/dev/null || true
clickhouse-client "${CH_ARGS[@]}" --query="OPTIMIZE TABLE dim_charger FINAL" 2>/dev/null || true
clickhouse-client "${CH_ARGS[@]}" --query="OPTIMIZE TABLE dim_fault_code FINAL" 2>/dev/null || true
clickhouse-client "${CH_ARGS[@]}" --query="OPTIMIZE TABLE dim_repair_person FINAL" 2>/dev/null || true
info "优化完成"

# ========== 验证数据量 ==========
echo ""
echo "══════════════════════════════════════════════════════════════"
info "数据导入完成！各表数据量统计:"
echo ""
clickhouse-client "${CH_ARGS[@]}" --query="
SELECT
    table,
    formatReadableQuantity(rows) as rows
FROM (
    SELECT 'dim_station' as table, count() as rows FROM dim_station UNION ALL
    SELECT 'dim_charger', count() FROM dim_charger UNION ALL
    SELECT 'dim_fault_code', count() FROM dim_fault_code UNION ALL
    SELECT 'dim_repair_person', count() FROM dim_repair_person UNION ALL
    SELECT 'fact_charging_session', count() FROM fact_charging_session UNION ALL
    SELECT 'fact_power_reading', count() FROM fact_power_reading UNION ALL
    SELECT 'fact_fault_log', count() FROM fact_fault_log UNION ALL
    SELECT 'fact_repair_order', count() FROM fact_repair_order UNION ALL
    SELECT 'fact_inspection', count() FROM fact_inspection
)
ORDER BY table
FORMAT PrettyCompact
"
echo ""
echo "══════════════════════════════════════════════════════════════"
info "🎉 导入全部完成！"
echo ""
echo "前端使用方式:"
echo "  1. cp .env.example .env"
echo "  2. 配置 VITE_CH_ENDPOINT=http://${CH_HOST}:8123"
echo "  3. npm run dev 启动前端"
echo "══════════════════════════════════════════════════════════════"
