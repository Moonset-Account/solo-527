# 工程材料询价比价平台

一个基于 **Remix + Express + MongoDB + Redis** 的企业级采购管理平台，完整覆盖工程项目材料询价比价的日常流程。

---

## 功能模块概览

### 👷 工程项目负责人端 (`/pm/*`)
| 功能 | 路径 | 说明 |
|------|------|------|
| 采购需求列表 | `/pm/requests` | 按状态筛选、进度可视化、统计概览 |
| 新建/编辑需求 | `/pm/requests/new` | 多材料明细录入、附件上传、变更原因填写 |
| 单据详情 | `/documents/purchase-request/:id` | 三标签页：详情 / 变更历史 / 关联报价 |

### 📊 管理端 (`/admin/*`)
| 功能 | 路径 | 说明 |
|------|------|------|
| 报价管理 | `/admin/quotes` | 报价收集、状态流转、价格波动明细双Tab |
| 比价中心 | `/admin/comparison` | 多供应商横向对比、可视化条形图、逐项比价表 |
| 价格波动报表 | `/admin/quotes`(Tab2) | ≥10% 波动预警、颜色分级高亮 |
| 综合报表 | `/admin/reports` | 采购分析、价格趋势、供应商分析四视图 |

### 🤝 供应商协同端 (`/coordinator/*`)
| 功能 | 路径 | 说明 |
|------|------|------|
| 资质异常提醒 | `/coordinator/alerts` | 自动检测、接单处理、完成后**自动写入审批看板** |
| 审批时长看板 | `/coordinator/board` | 月度趋势、平均时长、KPI达标情况、明细列表 |
| 供应商管理 | `/coordinator/suppliers` | 完整增删改查、资质文件管理、**变更历史弹窗** |

### 📄 单据详情 (通用)
| 实体类型 | 路径 | 特色功能 |
|----------|------|----------|
| 采购需求 | `/documents/purchase-request/:id` | 材料清单、关联报价比价、版本差异对比 |
| 报价单 | `/documents/quote/:id` | 付款/交货/质保条款、分级金额汇总、变更原因追踪 |
| 框架协议 | `/documents/agreement/:id` | 协议价清单、有效期、历史版本 |

---

## 核心业务流程

```
  项目负责人         系统自动         管理端          供应商协同员
      │                │                │                │
      ▼                │                │                │
  新建采购需求────────►│                │                │
      │                │                │                │
      ▼                │                │                │
  提交审批────┐        │                │                │
             │        ▼                │                │
             └────► 发送询价           │                │
                      │                │                │
                      ▼                │                │
              供应商提交报价────────► 收集报价          │
                      │                │                │
                      │                ▼                │
                      │            比价中心             │
                      │          历史价格对比           │
                      │          波动明细≥10%           │
                      │                │                │
                      │                ▼                │
                      │            选中报价             │
                      │                │                │
                      │                └────────────────►生成待办
                      │                                 │
                      │       资质到期◄──自动扫描────────┤
                      │                                 │
                      │                                 ▼
                      │                            处理异常提醒
                      │                                 │
                      │                                 ▼
                      │                     ┌─审批时长看板◄──┐
                      │                     │  自动计算时长   │
                      │                     │  月底核对差异   │
                      │                     └─────────────────┘
```

---

## 关键技术实现

### 🔍 变更历史追踪系统
- **监听字段**：状态、金额、材料明细、数量/单价、资质状态等关键字段
- **深度对比**：递归检测嵌套对象/数组变化
- **不可删除**：所有变更记录永久保存，用于月底核对差异
- **组件化**：`<ChangeHistoryView />` 复用组件，支持弹窗嵌入

### 📈 价格波动检测
- **触发时机**：报价提交时自动检测同一供应商同类材料历史价格
- **阈值配置**：10% 触发提醒，20% 标红严重告警
- **Redis缓存**：波动数据1小时缓存，支持报表快速查询
- **实时通知**：Redis Pub/Sub 发送到消息频道

### 🔔 资质异常 & 审批看板
- **自动扫描**：遍历所有资质文件，30天内到期/已过期生成提醒
- **状态流转**：待分配 → 处理中 → 已完成
- **看板数据**：处理完成时**自动**计算审批时长（小时）并写入看板
- **月度统计**：处理单量柱状图、平均时长达标率、明细列表导出

### 🔐 三种身份一键切换
顶部导航模拟多角色体验：
- 👷 **项目负责人**：管理自己的采购需求
- 📊 **管理端**：报价、比价、报表全局视图
- 🤝 **供应商协同**：资质提醒、审批看板、供应商库

---

## 目录结构

```
work-0005/
├── package.json                          # Monorepo root
├── tsconfig.base.json
└── packages/
    ├── shared/                           # 共享类型定义
    │   ├── package.json
    │   └── src/
    │       ├── index.ts
    │       └── types.ts                  # 核心业务类型
    │
    ├── api/                              # Express 后端
    │   ├── package.json
    │   ├── .env.example
    │   ├── scripts/
    │   │   └── seed.ts                   # 模拟数据脚本
    │   └── src/
    │       ├── server.ts                 # 服务入口
    │       ├── config/
    │       │   ├── mongodb.ts            # MongoDB连接
    │       │   └── redis.ts              # Redis连接、缓存键定义
    │       ├── models/                   # 7个Mongoose模型
    │       │   ├── PurchaseRequest.ts
    │       │   ├── Quote.ts
    │       │   ├── Supplier.ts
    │       │   ├── FrameworkAgreement.ts
    │       │   ├── Alert.ts
    │       │   ├── ChangeHistory.ts
    │       │   ├── PriceHistory.ts
    │       │   └── QualificationAlert.ts # + ApprovalBoardItem
    │       ├── services/
    │       │   ├── changeTracker.ts      # 深度对比+变更历史
    │       │   ├── purchaseRequest.ts    # PR业务逻辑
    │       │   ├── quoteService.ts       # 报价+比价+波动检测
    │       │   ├── supplierService.ts    # 资质+看板统计
    │       │   └── agreementService.ts   # 协议+版本差异
    │       └── routes/                   # 5个路由模块
    │
    └── web/                              # Remix 前端
        ├── package.json
        ├── vite.config.ts                # 代理到 :4000
        └── app/
            ├── root.tsx                  # 全局布局+角色切换导航
            ├── remix.env.d.ts
            ├── lib/
            │   └── api.ts                # API客户端+格式化工具
            ├── components/
            │   └── ChangeHistoryView.tsx # 变更历史可视化组件
            └── routes/                   # 10+路由页面
```

---

## 快速开始

### 前置要求
- Node.js ≥ 20
- MongoDB ≥ 6.x (默认 `mongodb://localhost:27017/procurement_db`)
- Redis ≥ 7.x (默认 `localhost:6379`)

### 安装依赖
```bash
npm install
```

### 配置环境变量
```bash
cp packages/api/.env.example packages/api/.env
# 根据需要修改 MongoDB / Redis 地址
```

### 启动 MongoDB 和 Redis
```bash
# 示例，根据实际安装方式调整
mongod
redis-server
```

### [可选] 导入模拟数据
```bash
npm run seed -w @app/api
# 将生成 12个采购需求 / 8个供应商 / 多份报价 / 资质提醒 / 变更历史
```

### 启动开发服务器
```bash
npm run dev
# 前端: http://localhost:3000 (自动代理API)
# 后端: http://localhost:4000
```

### 生产构建
```bash
npm run build
npm start
```

---

## API 接口速查

| 模块 | Method | 路径 | 说明 |
|------|--------|------|------|
| 附件 | POST | `/api/attachments/upload` | multipart多文件上传 |
| 采购需求 | GET/POST/PUT | `/api/purchase-requests` | 标准CRUD + 提交 |
| | GET | `/api/purchase-requests/:id/history` | 变更历史 |
| 报价 | GET/POST/PUT | `/api/quotes` | 标准CRUD |
| | GET | `/api/quotes/compare/:prId` | 横向比价分析 |
| | GET | `/api/quotes/fluctuations` | 价格波动明细 |
| | POST | `/api/quotes/:id/select` | 中标报价 |
| 供应商 | GET/POST/PUT | `/api/suppliers` | 标准CRUD |
| | POST | `/api/suppliers/qualifications/check` | 触发资质扫描 |
| | POST | `/api/suppliers/qualifications/alerts/:id/assign` | 接单 |
| | POST | `/api/suppliers/qualifications/alerts/:id/resolve` | 完成+写入看板 |
| | GET | `/api/suppliers/approval-board/stats` | 看板统计 |
| 框架协议 | GET/POST/PUT | `/api/agreements` | 标准CRUD |
| | GET | `/api/agreements/diff/:entityType/:entityId` | **统一版本差异** |
| 仪表盘 | GET | `/api/dashboard/summary` | 首页统计数字 |

---

## 月底核对差异指引

平台为月底对账提供三处数据交叉验证：

1. **单据详情页 → 版本差异对比视图**
   - 采购需求从草稿到完成的每一次状态、金额、材料变更
   - 供应商报价的单价/条款修改痕迹
   - 框架协议有效期和协议价调整记录

2. **审批时长看板 → 月度统计**
   - 资质异常处理平均时长 KPI 对比
   - 每份处理单的开始/结束时间戳不可篡改
   - 可导出明细与 HR 绩效系统核对

3. **价格波动报表 → 历史价格趋势**
   - 同种材料不同时期的价格变化
   - 异常涨幅订单的审计追踪
   - 实际采购价 vs 预算价差异汇总

所有数据均带 `createdAt / updatedAt` 时间戳，变更历史记录不可删除/修改。

---

© 2025 工程材料询价比价平台
