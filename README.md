# 售后备件借用审批系统

## 系统概述

面向区域维修主管的售后备件借用审批系统，核心是把客户机器、备件批次、借用人、预计归还和逾期责任串起来。

## 技术栈

- **前端**: Remix (React) + TypeScript
- **后端**: Express + TypeScript
- **数据库**: PostgreSQL
- **缓存/队列**: Redis
- **任务队列**: BullMQ
- **邮件**: Nodemailer
- **Excel导出**: ExcelJS

## 角色权限

| 角色 | 权限 |
|------|------|
| **工程师** | 申请借用、查看自己的借用单、申请延期 |
| **区域主管** | 审批借用单、审批延期、归还验收、查看所有单据、查看审计日志 |
| **仓库管理员** | 扫码出入库、库存管理、归还验收 |
| **财务** | 查看押金状态、导出对账、查看审计日志 |

## 核心功能模块

### 1. 借用单管理
- 列表默认显示**当天待归还**和**超期未确认**
- 详情页展示：备件照片、工单编号、借用原因、押金状态、归还验收记录
- 支持借用、延期、损坏赔付、归还入库全流程

### 2. 库存锁定机制
- 使用 Redis 分布式锁防止超卖
- 审批通过时锁定库存（`available_quantity -= qty`, `locked_quantity += qty`）
- 出库时扣减总库存和锁定量（`quantity -= qty`, `locked_quantity -= qty`）
- 归还时回库（`quantity += qty`, `available_quantity += qty`）

### 3. 通知系统
- 基于 BullMQ 的异步队列
- 支持站内通知 + 邮件通知
- 自动重试机制（最多3次，指数退避）
- 失败记录持久化到数据库

### 4. 押金管理
- 按备件价格 × 押金比例 × 数量自动计算
- 状态流转：未冻结 → 已冻结 → 已扣除/已退还
- 损坏/丢失自动计算赔付金额

### 5. 导出对账
- 财务可导出 Excel 对账明细
- 包含：单号、借用人、备件、数量、押金、状态等字段

### 6. 审计日志
- 记录所有关键操作：登录、创建、审批、出库、归还、导出等
- 记录 IP、User Agent、操作前后数据快照

## 数据库表结构

```
users              - 用户表
spare_parts        - 备件表
inventory          - 库存表（按批次管理）
borrow_orders      - 借用单主表
return_records     - 归还验收记录
extension_records  - 延期申请记录
deposit_transactions - 押金流水
audit_logs         - 审计日志
notifications      - 站内通知
notification_queue - 通知发送队列
session            - 会话表（connect-pg-simple）
```

## 快速开始

### 环境要求
- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6

### 安装依赖
```bash
npm install
```

### 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等
```

### 数据库迁移
```bash
npm run db:migrate
```

### 初始化种子数据
```bash
npm run db:seed
```

### 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

### 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 区域主管 | supervisor01 | 123456 |
| 工程师 | engineer01 | 123456 |
| 工程师 | engineer02 | 123456 |
| 仓库管理员 | warehouse01 | 123456 |
| 财务 | finance01 | 123456 |

## 业务流程

### 完整借用流程
```
工程师创建申请 → 主管审批（锁定库存+冻结押金）→ 仓库出库（扣减库存）
→ [可申请延期] → 归还验收（完好回库/损坏赔付）→ 押金结算
```

### 状态流转
```
pending(待审批) → approved(已批准) → picked(已领取) → extended(已延期)
                                                          ↓
returned(已归还) / damaged(有损坏) / lost(已丢失) ← 归还验收
         ↓                        ↓
   押金解冻退还              扣除赔付
```

## API 端点

### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/me` - 获取当前用户

### 借用单
- `GET /api/borrow-orders` - 列表（支持 status, view=today/overdue 筛选）
- `GET /api/borrow-orders/:id` - 详情（含归还/延期/押金记录）
- `POST /api/borrow-orders` - 创建申请
- `POST /api/borrow-orders/:id/approve` - 批准
- `POST /api/borrow-orders/:id/reject` - 拒绝
- `POST /api/borrow-orders/:id/pickup` - 出库领取
- `POST /api/borrow-orders/:id/extend` - 申请延期
- `POST /api/borrow-orders/:id/return` - 归还验收

### 备件/库存
- `GET /api/parts` - 备件列表
- `GET /api/inventory` - 库存列表
- `GET /api/inventory/scan/:batchNo` - 扫码查询批次

### 财务
- `GET /api/finance/deposits` - 押金列表
- `GET /api/finance/transactions` - 交易流水
- `GET /api/finance/export` - 导出Excel

### 其他
- `GET /api/audit` - 审计日志
- `GET /api/notifications` - 通知列表
- `POST /api/notifications/:id/read` - 标记已读
- `POST /api/notifications/read-all` - 全部已读

## 运行集成测试

```bash
# 确保数据库和Redis运行中
npx tsx tests/integration.test.ts
```

测试覆盖：
- ✅ 借用申请创建
- ✅ 主管审批 + 库存锁定 + 押金冻结
- ✅ 仓库出库 + 库存扣减
- ✅ 延期申请 + 审批
- ✅ 归还验收 + 损坏赔付 + 押金扣除 + 库存回库
- ✅ 审计日志完整记录
- ✅ 押金流水完整记录

## 项目结构

```
.
├── app/                    # Remix 前端
│   ├── components/         # 通用组件
│   ├── routes/             # 页面路由
│   ├── types/              # TypeScript 类型
│   ├── utils/              # 工具函数
│   ├── root.tsx            # 根布局
│   ├── entry.client.tsx    # 客户端入口
│   └── entry.server.tsx    # 服务端入口
├── server/                 # Express 后端
│   ├── api/                # API 路由
│   ├── middleware/         # 中间件
│   ├── db.ts               # 数据库连接
│   ├── audit.ts            # 审计日志
│   ├── queue.ts            # 通知队列
│   ├── inventory-service.ts # 库存锁定服务
│   └── index.ts            # 服务器入口
├── scripts/                # 数据库脚本
│   ├── migrate.ts          # 迁移脚本
│   └── seed.ts             # 种子数据
├── tests/                  # 测试
│   └── integration.test.ts # 集成测试
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```
