# 生鲜仓供应商协作站 · Fresh Warehouse Collaboration Platform

> 为仓库主管打造的一体化生鲜供应链协作平台。扫码入库出库、供应商闭环沟通、效期批次管理、智能补货、履约统计——全部打通。

---

## ✨ 核心特性

| 能力 | 说明 |
|------|------|
| **扫码出入库** | PDA/大触屏友好，支持扫码枪 + 摄像头扫码；入库自动质检流转、出库 FIFO 先到期先出 |
| **供应商闭环协作** | 采购单→供应商确认→入库→质检→评分→沟通回复，全程可追溯 |
| **库存&批次** | 多库区、多批次；效期临近自动提醒，状态标签和卡片分组 |
| **补货建议** | 基于安全库存 + 日均用量 + leadTime 自动生成，一键转采购单 |
| **异常清单** | 质检不合格/效期/库存差异/送货延迟/少送多送 等类型，分配、升级、SLA 倒计时 |
| **统计分析** | 供应商履约排行榜、效期原因溯源、异常处理效率、责任人 Top10 |
| **批量变更** | 预览 → 双次确认 → 事务执行，失败项自动进入异常清单，不阻塞 |
| **分角色权限** | 超管/仓库主管/采购/质检/供应商/只读，数据+操作双重隔离 |
| **Excel 导出** | 库存、批次、采购、入库、异常，中文表头一键下载 |
| **通知提醒** | 低库存、效期临近、供应商回复、采购跟进，右上角铃铛集中查看 |

---

## 🏗️ 技术栈

| 层 | 技术 |
|----|------|
| 前端 | **React 18 + Vite + Ant Design 5 + React Router v6 + Zustand + ahooks + @ant-design/plots + html5-qrcode + ExcelJS** |
| 后端 | **Node.js + Express 4 + Prisma 5 + JWT + bcryptjs + dayjs + ExcelJS** |
| 数据库 | **MySQL 8.x** (Prisma 支持 MariaDB 兼容) |
| 构建 | 根目录 `package.json` 一键 install / dev / build / prisma |

---

## 📁 目录结构

```
.
├── backend/                     # Express + Prisma 后端
│   ├── prisma/
│   │   ├── schema.prisma        # 数据模型（20+ 张表）
│   │   └── seed.js              # 演示数据脚本
│   ├── src/
│   │   ├── index.js             # 启动入口
│   │   ├── middleware/          # auth / errorHandler
│   │   ├── routes/              # 18 个模块路由
│   │   ├── controllers/         # 业务控制器
│   │   └── utils/               # prisma / response / 公共函数
│   └── .env.example
│
└── frontend/                    # React + AntD 前端
    ├── index.html
    ├── vite.config.js           # /api → localhost:3001 代理
    └── src/
        ├── main.jsx             # 入口 + ConfigProvider + 主题
        ├── App.jsx
        ├── router/index.jsx     # 路由 + 权限守卫
        ├── layouts/MainLayout.jsx
        ├── store/index.js       # Zustand 全局状态
        ├── api/index.js         # axios 封装 + 模块 API
        ├── utils/               # auth / request / format / constants
        ├── components/StatusTag.jsx
        ├── styles/global.less
        └── pages/               # 24+ 个业务页面
```

---

## 🚀 快速开始

### 1. 环境准备

- **Node.js ≥ 18.x** (推荐 20 LTS)
- **MySQL ≥ 8.0** 或 MariaDB 10.11+，需开启 UTF-8 / utf8mb4
- **npm ≥ 9**

### 2. 配置数据库 & 安装依赖

```bash
# 进入后端
cd backend
cp .env.example .env
# 编辑 .env 修改 DATABASE_URL，例如：
# DATABASE_URL="mysql://root:123456@localhost:3306/fresh_warehouse?schema=public&connection_limit=10"

# 回到根目录统一安装
cd ..
npm run install:all
```

### 3. 同步数据库 & 导入演示数据

```bash
# 生成 Prisma Client
npm run prisma:generate

# 建表
npm run prisma:migrate
# 或跳过迁移历史直接同步
# cd backend && npx prisma db push

# 填充演示数据（用户 / 供应商 / 商品 / 库存 / 批次 / 采购入库 / 异常...）
npm run prisma:seed
```

### 4. 启动开发环境

```bash
# 同时启动前后端（backend 3001, frontend 5173）
npm run dev

# 或分别启动
npm run dev:backend   # http://localhost:3001/health
npm run dev:frontend  # http://localhost:5173
```

### 5. 生产构建

```bash
npm run build        # 前端输出到 frontend/dist
npm start            # 启动后端，可自行把 frontend/dist 交给 Nginx 或挂到 Express static
```

---

## 👤 默认账号

（`prisma:seed` 后可用）

| 账号 | 密码 | 角色 | 说明 |
|------|------|------|------|
| `superadmin` | `123456` | 超级管理员 | 全权限 |
| **`manager`** | **`123456`** | **仓库主管** | ⭐ 主要使用角色 |
| `purchase` | `123456` | 采购员 | 采购单、供应商 |
| `qc` | `123456` | 质检员 | 入库质检、异常 |
| `viewer` | `123456` | 只读 | 查看报表 |
| `sup001` | `123456` | 供应商(SUP001) | 绿源蔬菜 |
| `sup002` | `123456` | 供应商(SUP002) | 鲜果时光 |
| `sup003` | `123456` | 供应商(SUP003) | 海味鲜水产 |

---

## 🧭 产品导航（仓库主管视角）

### 1. 工作台 `/dashboard`
- **6 张 KPI**：今日入库 / 出库 / 待处理异常 / 未读提醒 / 低库存 SKU / 效期临近
- **供应商履约 Top5**：准时率、合格率、综合评分（点击跳供应商详情）
- **7 天出入库趋势** 折线图
- **待办 Tab**：待质检入库 / 待处理异常 / 待确认采购单
- **最新提醒**：可直接跳转 / 标记已读

### 2. 供应商协作 `/suppliers`
- 列表：综合评分进度条、准时率、合格率、等级 ★
- 详情 **6 个 Tab**：基本信息 / 在供商品 / 采购记录 / 质检统计 / 评分记录 / 沟通回复
- **闭环**：评分 → 回复 → 等级联动

### 3. 库存中心
- `/inventory` 库存：展开子表格看批次、支持单条&批量调整
- `/inventory/batches` 批次：按生产日/到期日区间查询
- `/inventory/near-expiry` 效期临近：卡片分组「已过期 / 1天 / 7天 / 15天 / 30天」→ 一键建异常 / 通知供应商

### 4. 采购管理 `/purchase-orders`
- 列表按状态分组 Tab；紧急度用颜色区分
- 详情 **Timeline** + 状态流转：草稿 → 待供应商 → 已确认 → 部分/全部到货 → 完成
- Tab：明细 / 关联入库 / 沟通回复 / 质检 / 异常 / 评分
- **直接在详情里发起沟通、评分、生成异常**，信息不跳转

### 5. 出入库
- `/inbound/scan` **扫码入库**：大输入框，扫码枪回车自动识别；PDA 友好
- `/inbound-orders/:id` 入库详情：扫码加品 → 录入质检 → 完成入库（自动调库存+建批次+更新采购进度）
- `/outbound/scan` **扫码出库**：FIFO 自动匹配最早到期批次
- 失败项自动写入异常清单

### 6. 异常处理 `/exceptions`
- 类型：质检不合格 / 效期 / 差异 / 延迟 / 少送 / 多送 / 批次错误
- 状态：待处理 → 处理中 → 待供应商 → 已解决 / 已关闭 / 已升级
- 每条异常有 **SLA 倒计时**、责任人、影响金额 & 数量
- 详情 **Timeline + 沟通 + 处理记录** 完整闭环

### 7. 批量操作 `/batch-ops`
- 类型：批量改价 / 批次状态更新 / 库存调整 / 盘点确认 / 批量建异常 ...
- **三步确认**：
  ① 预览影响清单（可勾选去除）
  ② 免责勾选 + 输入备注 + 二次确认弹窗
  ③ 事务执行 + 滚动日志 + 成功/失败统计
- **失败项自动生成异常记录**，可直接跳转处理

### 8. 数据统计 `/statistics`
- **① 供应商履约** Tab：KPI + 履约排行榜（下钻）+ 等级分布饼图 + 履约趋势
- **② 效期分析** Tab：到期分布柱图 + 效期临近原因溯源（入库延迟 / 周转慢 / 采购过量 / 其他）+ 责任人 & 处理时效
- **③ 处理效率** Tab：平均处理时长 + 按时完成率 + 类型柱图 + 责任人排行榜 + 周趋势
- **④ 综合看板**

### 9. 其他
- `/restock` 补货建议 → 一键生成采购单（按供应商合并）
- `/alerts` 全部提醒列表
- `/users` 用户管理 (仅超管)
- `/profile` 个人中心 + 修改密码 + 操作日志

---

## 🔑 权限矩阵（节选）

| 能力 | 仓库主管 | 采购 | 质检 | 供应商 | 只读 |
|------|:--------:|:----:|:----:|:------:|:----:|
| 出入库扫码/完成 | ✅ | - | ✅质检 | - | - |
| 采购单创建/提交 | ✅ | ✅ | - | 仅确认 | - |
| 异常创建/分配/升级/关闭 | ✅ | ✅ | ✅ | 仅回复 | - |
| 批量变更确认 | ✅ | - | - | - | - |
| 导出数据 | ✅ | ✅ | ✅ | 仅自身 | ✅仅自己|
| 数据统计查看 | ✅ | ✅ | ✅ | 仅自身 | ✅仅部分|

---

## 🧩 核心数据模型（节选）

```
User ── Supplier
  │
  ├── PurchaseOrder ──< PurchaseOrderItem >── Product
  │        │               │
  │        │               ▼
  │        └── InboundOrder ──< InboundItem >── Batch ── Inventory
  │                              │                 │
  │                              ▼                 ▼
  │                         ExceptionRecord    SupplierRating
  │                              │
  │                              └── SupplierReply ──┘
  │
  ├── OutboundOrder ──< OutboundItem >── Batch
  ├── Alert
  ├── RestockSuggestion
  ├── BatchOperation (含 failedItems)
  └── AuditLog
```

完整字段见 [backend/prisma/schema.prisma](./backend/prisma/schema.prisma)

---

## 🛠️ 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run install:all` | 根目录安装前后端依赖 |
| `npm run dev` | 同时启动前后端 (concurrently) |
| `npm run build` | 构建前端 |
| `npm run prisma:generate` | 生成 Prisma Client |
| `npm run prisma:migrate` | 执行开发迁移 |
| `npm run prisma:seed` | 填充演示数据 |

---

## 📝 约定

- **API** 统一前缀 `/api`，响应格式 `{ code, success, message, data, timestamp }`；分页 `{ list, pagination:{page,pageSize,total,totalPages} }`
- **HTTP 状态码**：400 参数错误、401 未登录、403 无权限、404 不存在、500 服务错误
- **分页参数**：`page` 默认 1，`pageSize` 默认 20
- **时间**：ISO8601，前端统一用 dayjs zh-CN 本地化
- **错误处理**：后端抛错由 `errorHandler` 统一翻译；前端拦截器自动 message.error，401 自动跳登录

---

## ⚠️ 生产部署 Checklist

- [ ] 修改 `backend/.env` 的 `JWT_SECRET` 为长随机串
- [ ] 启用 MySQL SSL / VPC 内网连接，设置 `connection_limit`
- [ ] `NODE_ENV=production` 启动；配合 PM2 / systemd 守护
- [ ] 前端 `vite build` 产物交给 Nginx，开启 gzip / brotli
- [ ] `/api` 和 `/uploads` 反向代理到后端端口
- [ ] 开启定期备份（数据库 + uploads）
- [ ] 上传目录 `backend/uploads` 做持久化卷
- [ ] 配置邮件 / 钉钉 / 企业微信 Webhook 推送提醒（可扩展 Alert 模块）

---

## 🧪 演示数据亮点

`prisma:seed` 会生成：
- 5 家供应商 + 3 个供应商账号
- 25 个生鲜 SKU（蔬菜/水果/水产/肉禽/蛋奶），含条码 & 预警天数
- 约 60 条库存记录（分 4 个库区：常温/冷藏/冷冻/暂养）
- 约 50 个批次（含 NORMAL / NEAR_EXPIRY / EXPIRED）
- 8 张采购单（覆盖 5 个状态）
- 多个入库 / 出库单（含质检不合格、少送）
- 5 条典型异常（质检不合格、效期、延迟、少送、差异）
- 6 条系统提醒、3 条供应商沟通、3 个批量操作记录

开箱即用，无需手动造数据即可体验完整流程 ✨

---

Made with ❤️ for warehouse managers. · v1.0.0
