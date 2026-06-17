# 行业峰会报名审核台

面向票务运营团队的全栈管理系统：参会者在线报名 → 管理员审核 → 签到码 → 退款 → 质量统计 → 缺口补位 → 异常复盘。

**技术栈**：Angular 17 + Material UI · NestJS 10 + Prisma · PostgreSQL 16 · ECharts 5

---

## 📁 项目结构

```
work-0259/
├── backend/                    # NestJS 后端 (端口 3001)
│   ├── prisma/
│   │   ├── schema.prisma      # 17 个数据模型
│   │   └── seed.ts            # 初始化模拟数据
│   └── src/modules/           # 11 个业务模块
│       ├── auth/              # JWT 登录 + 角色守卫
│       ├── registrations/     # 报名 + 审核核心 (approve/reject/close)
│       ├── tickets/           # 票种库存维护 (含审计日志)
│       ├── sessions/          # 场次座位 + 质量权重
│       ├── guests/            # 嘉宾配额管理
│       ├── checkin/           # 签到码生成 + 核销
│       ├── refunds/           # 退款 + 关联原单
│       ├── notifications/     # Handlebars 模板 + 批量发送
│       ├── analytics/         # KPI / 质量 / 漏斗统计
│       ├── gap/               # 到场缺口待办 + 处理联动质量分
│       └── exceptions/        # 异常关闭原因 + 原单追溯
│
└── frontend/                   # Angular 前端 (端口 4200)
    └── src/app/
        ├── pages/
        │   ├── home/          # 大会首页
        │   ├── register/      # 4 步报名 (含座位图)
        │   ├── status/        # 状态查询 + QR 签到码
        │   └── admin/         # 13 个管理页面
        │       ├── dashboard/    # KPI + 趋势 + 待办
        │       ├── reviews/      # 审核工作台 (批量 + 质量星级)
        │       ├── tickets/      # 票种库存 + 预警
        │       ├── sessions/     # 场次座位 + 质量权重调节
        │       ├── guests/       # 嘉宾配额环形进度
        │       ├── checkin/      # 签到码中心 + CSV
        │       ├── refunds/      # 退款中心 (原单对照)
        │       ├── notifications/# 模板 + 人群筛选 + 历史
        │       ├── quality/      # 气泡图 + 分布 + 下钻
        │       ├── funnel/       # 转化漏斗 + 优化建议
        │       ├── gap/          # 缺口待办 + AI 补位推荐
        │       └── exceptions/   # 异常复盘 + 原单链路追溯
        └── components/
            ├── close-dialog/     # 异常关闭强制弹窗 (必填原因)
            └── status-badge/     # 8 状态彩色 Chip
```

---

## 🚀 快速启动

### 1. 准备数据库

```bash
# 启动 PostgreSQL (推荐 Docker)
docker run -d --name summit-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=summit_ticket \
  -p 5432:5432 postgres:16-alpine
```

### 2. 启动后端

```bash
cd backend
cp .env.example .env      # 如需要修改 DATABASE_URL

# 安装依赖
pnpm install    # 或 npm install / yarn

# 数据库迁移 + 初始化种子数据
npx prisma migrate dev --name init
npx prisma db seed

# 启动开发服务器 (端口 3001)
pnpm dev
```

默认管理员账号：`admin` / `Admin@2024`

Swagger API 文档：http://localhost:3001/api/docs

### 3. 启动前端

```bash
cd frontend
pnpm install     # 或 npm install

# 启动开发服务器 (端口 4200, 已配置代理 /api → :3001)
pnpm start       # 或 ng serve --open
```

访问：http://localhost:4200

---

## 🎯 核心业务闭环

| 用户要求 | 实现方式 |
|---------|---------|
| **异常关闭必填原因** | `CloseDialog` 弹窗强制校验 + 后端 DTO + `CloseException` 外键关联 |
| **退款关联原单追溯** | `Refund.registrationId` 外键 + 管理页左右两列对照视图 |
| **缺口处理联动质量** | `GapService.handle()` 自动加/减 `QualityMetric.totalScore` (replaced+2 / confirmed+1 / closed_gap-1) |
| **场次关联质量评分** | `Session.qualityWeight` 倍率 × 质量评分算法，场次页可下拉调节 |
| **别靠人工追问缺口** | `GapTodo` 自动识别高价值未到场 + AI 补位候选人按质量排序推荐 |

### 质量评分算法 (0-100 分)

```
基础分 = 渠道权重(25%) + 公司权重(25%) + 职位权重(30%) + 支付速度(20%)
最终分 = 基础分 × 票种系数 × 场次权重
```

---

## 🧪 快速验证流程

1. **参会者**：首页 → 立即报名 → 4 步提交 → 获取订单号
2. **参会者**：状态查询 → 手机号/订单号 → 查看审核进度
3. **管理员**：`/admin/login` → admin / Admin@2024
4. **审核**：`/admin/reviews` → 选中 → 通过 / 驳回 / 异常关闭(填原因)
5. **签到码**：`/admin/checkin` → CSV 导出 / 一键核销
6. **退款**：`/admin/refunds` → 通过 → 执行退款 (库存/座位自动释放)
7. **缺口**：`/admin/gap` → 查看 AI 补位推荐 → 处理 → 质量分自动 ±
8. **复盘**：`/admin/exceptions` → 点击「追溯原单」→ 完整时间轴
