# 电动车充电桩故障可视化工作台 - ClickHouse 数据层

## 快速开始

### 1. 初始化 ClickHouse 数据库
```bash
# 执行建表脚本
clickhouse-client --multiquery < clickhouse/ddl/01_create_tables.sql
```

### 2. 生成示例数据并导入
```bash
# 生成 CSV 示例数据
node clickhouse/scripts/generate_csv.js

# 导入数据
chmod +x clickhouse/scripts/import_data.sh
./clickhouse/scripts/import_data.sh
```

### 3. 配置前端连接
```bash
# 复制环境变量配置
cp .env.example .env

# 编辑 .env，填入 ClickHouse 连接信息
# 不配置时默认使用前端 Mock 数据
```

## 目录结构

```
clickhouse/
├── ddl/
│   └── 01_create_tables.sql    # 建表 DDL（维表+事实表+物化视图）
├── scripts/
│   ├── generate_csv.js         # CSV 示例数据生成器
│   └── import_data.sh          # 一键导入脚本
├── queries/
│   └── core_queries.sql        # 核心业务查询 SQL
└── data/                       # CSV 数据输出目录（git 忽略）
```

## 表设计说明

| 表名 | 类型 | 说明 | 存储周期 |
|------|------|------|----------|
| dim_station | 维表 | 充电站站点 | 永久 |
| dim_charger | 维表 | 充电桩 | 永久 |
| dim_fault_code | 维表 | 故障码字典 | 永久 |
| dim_repair_person | 维表 | 维修人员 | 永久 |
| fact_charging_session | 事实表 | 充电会话 | 1年 |
| fact_power_reading | 事实表 | 功率时序（5秒） | 30天 |
| fact_fault_log | 事实表 | 故障日志 | 2年 |
| fact_repair_order | 事实表 | 维修工单 | 3年 |
| fact_inspection | 事实表 | 站点巡检 | 1年 |
| mv_charger_status_realtime | 物化视图 | 实时状态汇总 | - |
| agg_daily_stats | 聚合表 | 站点每日统计 | 永久 |

## 前端对接

前端通过 `src/utils/clickhouse.js` 封装了查询接口：

```javascript
import chApi from '@/utils/clickhouse.js'

// 查询可用率
const result = await chApi.getAvailability([startTime, endTime])

// 查询故障按站点分布
const stations = await chApi.getFaultsByStation([startTime, endTime])
```

未配置 `VITE_CH_ENDPOINT` 时自动使用 Mock 数据，便于本地开发。
