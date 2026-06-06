# 仓库SKU周转与滞销分析工作台

基于 Apache Superset + ClickHouse + PostgreSQL 搭建的供应链分析工作台，面向供应链分析师日常复盘使用。

## 📋 功能特性

- **库存漏斗分析**：期初 → 入库 → 出库 → 期末 全链路追踪
- **库龄分布**：0-7天 / 8-30天 / 31-90天 / 91-180天 / 180天+ 五档分布
- **周转排行**：SKU周转率TOP/BOTTOM榜单，A-F六级评级
- **补货建议**：智能计算缺货/超储SKU，给出建议补货量
- **近效期预警**：临期(7天内)/近效期(30天内)红色高亮提醒
- **滞销分析**：自动识别滞销/慢销SKU
- **7级下钻**：整体趋势 → 分类 → SKU → 仓位 → 供应商 → 批次 → 原始单据
- **异常注释**：点击异常点可添加备注，跟踪处理进度
- **多格式导出**：截图(PNG) / PDF报告 / CSV数据导出
- **定时报表**：支持日/周/月订阅，邮件自动推送

## 🏗️ 技术架构

```
┌─────────────┐     SQL      ┌──────────────┐   CDC/ETL    ┌─────────────┐
│  Superset   │◄─────────────│  ClickHouse  │◄─────────────│  PostgreSQL │
│  (BI仪表盘)  │   查询分析    │ (OLAP分析引擎)│   增量同步    │  (业务数据库)│
└─────────────┘              └──────────────┘              └─────────────┘
       ▲
       │  导出/订阅
       ▼
┌─────────────┐
│  PDF/CSV/   │
│  邮件推送   │
└─────────────┘
```

**详细架构文档**：[ARCHITECTURE.md](ARCHITECTURE.md)

## 📁 目录结构

```
.
├── docker-compose.yml          # 容器编排
├── ARCHITECTURE.md             # 架构设计文档
├── postgres/
│   └── init/
│       ├── 01_schema.sql       # 业务表结构
│       ├── 02_master_data.sql  # 主数据初始化
│       └── 03_permissions.sql  # 权限配置
├── clickhouse/
│   └── init/
│       └── 01_ddl.sql          # ODS/DWS/ADS三层表结构
├── superset/
│   ├── config/
│   │   └── superset_config.py  # Superset配置
│   └── dashboards/
│       ├── inventory_analysis_dashboard.json  # 仪表盘模板
│       └── drill_down_config.md               # 下钻配置
├── etl/
│   ├── dag/
│   │   └── daily_inventory.py  # Airflow DAG
│   └── scripts/
│       └── full_load.py        # 数据同步脚本
├── metrics/
│   └── metrics_definition.md   # 指标口径定义
└── tests/
    ├── data_quality_check.py   # 数据质量检查
    └── acceptance_checklist.md # 验收清单
```

## 🚀 快速开始

### 前置要求
- Docker 20.10+
- Docker Compose 2.0+
- 至少 8GB 内存

### 1. 启动服务

```bash
# 克隆项目
cd question-104

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 2. 初始化数据

```bash
# 1. 等待所有服务启动完成（约2-3分钟）
docker-compose logs -f superset

# 2. 执行全量数据同步
docker-compose exec etl-runner bash
cd scripts
pip install -r requirements.txt
python full_load.py
```

### 3. 访问Superset

打开浏览器访问：http://localhost:8088

默认账号：
- 用户名：`admin`
- 密码：`admin`

### 4. 添加ClickHouse数据源

1. 登录后进入 **Data → Databases → + Database**
2. 选择 **ClickHouse**
3. 填写连接信息：
   - Host: `clickhouse`
   - Port: `8123`
   - Database: `inventory_analysis`
   - Username: `default`
   - Password: (空)
4. 测试连接并保存

### 5. 导入仪表盘

```bash
# 导入仪表盘配置（需要先安装superset-cli）
docker-compose exec superset superset import-dashboards \
  -p /app/dashboards/inventory_analysis_dashboard.json
```

## 📊 核心仪表盘说明

### 1. 库存总览
- **库存漏斗图**：期初→入库→出库→期末 流转
- **库存趋势**：近30天库存变化曲线
- **核心指标卡**：总库存金额、SKU数、周转天数、滞销占比

### 2. 库龄与周转
- **库龄分布图**：五档库龄占比（堆叠柱状图）
- **周转排行榜**：按周转天数排序，A-F等级标识
- **周转分布散点图**：出库量 vs 库存量

### 3. 补货与预警
- **补货建议表**：严重缺货/建议补货/超储 SKU清单
- **近效期预警**：临期/近效期批次 红色高亮
- **滞销SKU明细**：库龄>180天且近30天无出库

### 4. 供应商与退货
- **供应商供货分析**：供货量、准时率、退货率
- **退货原因分布**：按原因统计退货占比
- **退货率趋势**：近30天退货率变化

## 🔍 下钻操作指南

### 下钻路径
```
整体趋势 → 分类分析 → SKU分析 → 仓位分布 → 供应商分析 → 批次明细 → 原始单据
  L0         L1         L2         L3          L4           L5          L6
```

### 操作方式
1. **全局筛选**：顶部筛选器（日期、仓库、分类、SKU）
2. **交叉筛选**：点击图表数据点自动过滤其他图表
3. **下钻**：表格行右键 → "钻取到..."
4. **异常详情**：点击红色/橙色异常行 → 弹出详情面板 → 添加注释

## 📤 导出功能

- **单图导出**：图表右上角 → 下载 → PNG/JPEG
- **数据导出**：图表右上角 → 下载 → CSV/Excel
- **仪表盘导出**：仪表盘右上角 → 导出为PDF
- **定时订阅**：仪表盘右上角 → 设置定时邮件报告

## ✅ 验收检查

运行数据质量检查：

```bash
docker-compose exec etl-runner bash
cd scripts
python data_quality_check.py
```

**完整验收清单**：[tests/acceptance_checklist.md](tests/acceptance_checklist.md)

验收范围包括：
- ✅ 数据模型（20项）
- ✅ 指标口径（24项）
- ✅ 数据质量（16项）- 缺失值、异常点、样本量
- ✅ 图表功能（30项）
- ✅ 下钻功能（13项）
- ✅ 异常与注释（15项）
- ✅ 导出功能（14项）
- ✅ 权限与安全（13项）
- ✅ 性能（5项）

## 📐 指标口径

详细的指标定义和计算公式：[metrics/metrics_definition.md](metrics/metrics_definition.md)

核心指标包括：
- 库存类：期初/期末库存、周转天数、周转率
- 库龄类：库龄天数、库龄分布、平均库龄
- 效期类：距到期天数、近效期占比、过期库存金额
- 滞销类：滞销SKU数、滞销金额占比
- 补货类：可供应天数、缺货/超储数、建议补货量

## 🔒 权限配置

| 角色 | 数据范围 | 导出权限 | 注释权限 |
|------|---------|---------|---------|
| 供应链分析师 | 全仓库 | PDF/CSV/PNG | ✓ |
| 仓库经理 | 本仓库 | CSV | ✓ |
| 采购专员 | 补货相关 | CSV | ✓ |
| 部门总监 | 全仓库（聚合） | PDF | - |
| 只读访客 | 脱敏数据 | - | - |

## 📞 常见问题

### 1. Superset启动慢？
首次启动需要初始化数据库，等待2-3分钟即可。

### 2. ClickHouse连接失败？
检查clickhouse容器是否健康：`docker-compose ps clickhouse`

### 3. 如何修改默认密码？
复制 `.env.example` 为 `.env`，修改其中的密码配置。

### 4. 如何接入真实业务数据？
- 修改 `etl/scripts/full_load.py` 中的数据源配置
- 或配置 Debezium CDC 进行实时增量同步

## 📄 License

内部项目，仅供供应链团队使用。
