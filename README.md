# 工厂设备停机原因看板

面向生产主管的设备停机原因分析系统，支持从整体趋势下钻到设备、产线、班次、故障类型、维修人，用于日常复盘和团队周会。

## 功能特性

### 核心看板
- **KPI 概览**：突发停机次数/时长、平均 OEE、MTTR、维修成本、计划检修占比
- **停机 Pareto 分析**：按故障类别统计，80/20 法则定位主要问题，支持点击下钻
- **停机趋势分析**：按日期统计，区分计划检修与突发停机
- **产线停机对比**：各产线停机情况对比，支持按产线筛选
- **维修人员效率**：平均修复时间、响应时间对比
- **备件消耗 TOP 10**：按成本排序，关联停机时长
- **设备停机 TOP 10**：按突发停机时长排序，支持点击下钻

### 数据追溯
- 原始工单记录列表，支持分页
- 工单详情弹窗，包含备件使用、关联报警
- 点击图表可下钻筛选对应的原始记录

### 导出功能
- 导出工单数据 CSV
- 导出汇总数据 CSV（按类别+按产线）
- 截图功能（浏览器快捷键）

### 技术特性
- 计划检修与突发停机分开统计，避免考核误导
- 数据更新时间实时显示
- 5分钟查询缓存机制
- 响应式布局，支持多屏幕

## 技术栈

- **前端**：Vue 3 + Vite + Element Plus + D3.js
- **后端**：Node.js + Express
- **数据层**：JSON 文件存储 + ETL 清洗脚本（可平滑迁移至 ClickHouse + Redis）
- **缓存**：内存缓存（可接入 Redis）

## 项目结构

```
.
├── src/                      # 前端源码
│   ├── components/           # D3 图表组件
│   │   ├── ParetoChart.vue       # 帕累托图
│   │   ├── TrendChart.vue        # 趋势图
│   │   ├── LineCompareChart.vue  # 产线对比
│   │   ├── TechnicianChart.vue   # 维修人效率
│   │   ├── SparePartsChart.vue   # 备件消耗
│   │   └── EquipmentChart.vue    # 设备停机
│   ├── views/
│   │   └── Dashboard.vue         # 主看板页面
│   ├── router/
│   ├── styles/
│   ├── App.vue
│   └── main.js
├── server/                   # 后端 API
│   └── index.js
├── data/                     # 数据层
│   ├── config/
│   │   └── metrics_config.js     # 口径配置
│   ├── generator/
│   │   └── generateData.js       # 模拟数据生成
│   ├── etl/
│   │   └── run_etl.js            # ETL 清洗聚合
│   ├── raw/                      # 原始数据
│   └── processed/                # 聚合后数据
├── package.json
├── vite.config.js
└── index.html
```

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 生成模拟数据（可选，首次启动会自动生成）
```bash
npm run generate-data
npm run etl
```

### 3. 启动开发服务
```bash
npm run dev
```

- 前端地址: http://localhost:3000
- 后端 API: http://localhost:3001

### 4. 单独启动服务
```bash
# 仅启动后端
npm run server

# 仅启动前端
npm run client
```

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/config` | GET | 系统配置（产线、班次等） |
| `/api/kpi` | GET | KPI 汇总 |
| `/api/downtime/category` | GET | 按故障类别停机统计 |
| `/api/downtime/line` | GET | 按产线停机统计 |
| `/api/downtime/equipment` | GET | 按设备停机统计 |
| `/api/downtime/technician` | GET | 按维修人效率统计 |
| `/api/spare-parts` | GET | 备件消耗统计 |
| `/api/trend` | GET | 趋势数据 |
| `/api/workorders` | GET | 工单列表（分页+筛选） |
| `/api/workorders/:id` | GET | 工单详情（含关联报警） |
| `/api/alarms` | GET | 报警列表 |
| `/api/dashboard/all` | GET | 看板全量数据 |
| `/api/export/csv/workorders` | GET | 导出色工单 CSV |
| `/api/export/csv/downtime-summary` | GET | 导出汇总 CSV |
| `/api/refresh` | POST | 刷新数据缓存 |

## 数据口径说明

### 停机类型
- **计划检修 (planned)**：预防性维护、预测性维护、大修、定期检查
- **突发停机 (unplanned)**：设备故障导致的非计划停机

### 故障类别
- 机械故障、电气故障、控制系统、液压系统、气动系统、润滑问题、正常磨损、操作失误

### 核心指标
- **MTTR (平均修复时间)**：仅统计突发停机
- **OEE (设备综合效率)**：排除计划停机时间
- **停机时长**：小于5分钟按5分钟计，向上取整至15分钟

## 生产部署建议

### 数据存储升级
当前使用 JSON 文件存储，生产环境建议：
1. **ClickHouse**：列式存储，适合时序数据聚合查询
2. **Redis**：查询缓存 + 实时KPI缓存
3. **MySQL/PostgreSQL**：存储原始工单、报警记录

### 数据接入
- 通过 MQTT/OPC UA 接入设备实时数据
- 对接 SCADA/MES 系统获取工单、产量数据
- 定时 ETL 任务（每小时/每天）聚合数据

### 权限控制
- 对接企业 SSO 或 LDAP
- 基于角色的数据权限（厂长/主管/维修组长）
- 操作审计日志
