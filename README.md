# 青禾库存追溯台

生鲜仓批次追溯系统 - 仓库主管使用的生鲜批次追溯与库存管理平台。

## 技术栈

- **前端**: Remix 2 + React 18 + Ant Design 5 + TypeScript
- **后端**: Express 4 + TypeScript
- **数据库**: MongoDB (Mongoose 8)
- **缓存**: Redis
- **架构**: Monorepo (npm workspaces)

## 功能模块

| 模块 | 说明 |
|------|------|
| 首页看板 | 库存总览、效期预警、安全库存异常、快速入口 |
| 扫码入库 | 扫描批次+库位入库，自动更新批次/库存/库位状态 |
| 扫码出库 | FIFO/FEFO 出库，扣减库存并记录流水 |
| 批次追溯 | 批次全生命周期管理，状态变更留痕 |
| 库存管理 | 当前库存查询 + 出入库流水 |
| 库位管理 | 库位档案、温区、容量、状态管理 |
| 安全库存 | 库存预警线配置，下钻到明细（批次/库位/调拨/延误分析） |
| 调拨申请 | 采购/库位调拨流程，支持延误登记与处理效率追踪 |
| 签收差异 | 差异登记、审批、根因分析、纠正措施，关联安全库存 |
| 报表中心 | 出入库流水/批次/安全库存 Excel 报表导出 |
| 状态历史 | 全系统所有对象的状态变更审计记录 |

## 设计亮点

1. **状态变更留痕**: 所有状态变化都必须填写原因，保留 `from → to + reason + operator + time`，可审计可追溯
2. **安全库存下钻**: 从 SKU 级别可下钻到在库明细、在途调拨、缺货历史、交期延误分析（含原因分类、处理人、处理耗时）
3. **温区校验**: 入库时校验批次与库位温区是否匹配
4. **效期预警**: 1/3/7 天多级预警（CRITICAL / DANGER / WARNING）
5. **差异关联安全库存**: 签收差异自动评估对安全库存的影响
6. **调拨延误追踪**: 记录延误原因分类、处理人、处理效率

## 项目结构

```
.
├── packages/
│   ├── shared/         # 共享类型定义 & Zod 校验 schema
│   │   └── src/types/
│   ├── server/         # Express 后端
│   │   └── src/
│   │       ├── db/         # MongoDB + Redis 连接
│   │       ├── middleware/ # 错误处理、校验中间件
│   │       ├── models/     # Mongoose 数据模型 (7 个)
│   │       └── routes/     # API 路由 (8 组)
│   └── client/         # Remix 前端
│       └── app/
│           ├── lib/        # API 客户端、常量映射
│           └── routes/     # 页面路由 (11 个)
├── package.json
├── tsconfig.base.json
└── .env
```

## 快速开始

### 前置依赖

- Node.js >= 18
- MongoDB >= 5 (本地或远程，默认 `mongodb://localhost:27017/qinghe-inventory`)
- Redis >= 6 (本地或远程，可选，未启动时降级为无缓存模式)

### 1. 安装依赖

```bash
npm install
```

### 2. 启动 MongoDB & Redis

```bash
# 使用 Docker 快速启动
docker run -d -p 27017:27017 --name qinghe-mongo mongo:6
docker run -d -p 6379:6379 --name qinghe-redis redis:7-alpine
```

### 3. 配置环境变量

根目录 `.env` 已内置默认值，可按需修改：

```
MONGODB_URI=mongodb://localhost:27017/qinghe-inventory
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
CLIENT_URL=http://localhost:3000
```

### 4. 启动开发环境

同时启动前后端：

```bash
npm run dev
```

或分别启动：

```bash
# 后端 (Express, 端口 3001)
npm run dev:server

# 前端 (Remix, 端口 3000)
npm run dev:client
```

### 5. 访问系统

- 前端页面: http://localhost:3000
- 后端 API: http://localhost:3001/api/health

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/batches` | 批次列表 / 创建批次 |
| GET | `/api/batches/:batchNo` | 批次详情 |
| PATCH | `/api/batches/:batchNo/status` | 变更批次状态（需原因） |
| GET | `/api/batches/alerts/expiry` | 效期预警 |
| GET | `/api/inventory` | 当前库存列表 |
| POST | `/api/inventory/inbound` | 扫码入库 |
| POST | `/api/inventory/outbound` | 扫码出库 |
| GET | `/api/inventory/transactions` | 出入库流水 |
| GET/POST | `/api/locations` | 库位列表 / 创建库位 |
| GET | `/api/safety-stock` | 安全库存列表 |
| GET | `/api/safety-stock/:id/drilldown` | 安全库存下钻明细 |
| GET/POST | `/api/transfers` | 调拨列表 / 创建调拨 |
| PATCH | `/api/transfers/:id/status` | 调拨审批/完成（需原因） |
| PATCH | `/api/transfers/:id/delay` | 登记调拨延误 |
| GET/POST | `/api/receipt-diffs` | 签收差异列表 / 登记差异 |
| PATCH | `/api/receipt-diffs/:id/resolve` | 处理差异（根因+纠正措施） |
| GET | `/api/reports/dashboard` | 首页看板统计 |
| GET | `/api/reports/transactions` | 流水报表导出 (Excel) |
| GET | `/api/reports/batches` | 批次报表导出 (Excel) |
| GET | `/api/reports/safety-stock` | 安全库存报表导出 (Excel) |
| GET | `/api/status-history/:entityType/:entityId` | 单个对象状态历史 |

## 核心数据模型

- **Batch (批次)**: `batchNo, sku, supplier, productionDate, expiryDate, quantity, receivedQuantity, temperatureZone, status`
- **Inventory (库存)**: `batchId, sku, locationCode, quantity, availableQuantity, reservedQuantity, expiryDate, status`
- **Location (库位)**: `code, zone, aisle, shelf, layer, position, type, temperatureZone, maxCapacity, currentCapacity, status`
- **SafetyStock (安全库存)**: `sku, minQuantity, reorderPoint, reorderQuantity, leadTimeDays, status, currentStock, responsiblePerson`
- **Transfer (调拨)**: `transferNo, type, sku, quantity, from→to, plannedDate, expectedDate, actualDate, status, delayReason, delayReasonCategory, applicant, approver, handler, handlingStartTime, handlingEndTime`
- **ReceiptDiff (签收差异)**: `diffNo, inboundOrderNo, batchNo, diffType, expectedQuantity, actualQuantity, rootCause, correctiveAction, status, impactOnSafetyStock`
- **StatusHistory (状态历史)**: `entityType, entityId, fromStatus, toStatus, reason, operator, operationTime, extraData`

## 生产部署

```bash
# 编译
npm run build

# 启动后端 (前端构建产物由后端或独立服务托管)
npm run start
```

前端建议部署到 Vercel / Netlify，后端部署到 Node.js 运行时。
