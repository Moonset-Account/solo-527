# 设计图纸客户验收门户

基于 Next.js 14 + TypeScript + Prisma + PostgreSQL + Redis 构建的装修项目验收管理系统。

## 功能特性

### 设计师端
- ✅ **报价管理** - 创建、编辑、确认项目报价，支持多版本管理
- ✅ **增项管理** - 记录项目增项，包含原因、金额，支持审批流程
- ✅ **版本追溯** - 所有变更都有完整版本历史，支持对比查看

### 内部后台
- ✅ **项目总览** - 查看所有项目状态、预算、进度
- ✅ **预算追踪** - 实时监控预算变化，记录每次变更
- ✅ **返修管理** - 追踪返修任务，超时自动提醒老板
- ✅ **客户反馈** - 汇总客户反馈，处理满意度评分
- ✅ **报表中心** - 月度运营报表，支持 Excel 导出

### 系统特性
- ✅ **Redis 缓存** - 筛选结果、热点数据自动缓存
- ✅ **分页支持** - 所有列表支持分页，应对大数据量
- ✅ **高级筛选** - 多条件组合筛选，快速定位数据
- ✅ **数据导出** - 支持 Excel 格式导出，方便复盘
- ✅ **版本追溯** - 材料清单、现场照片、合同附件都可追溯原始记录

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **ORM**: Prisma
- **数据库**: PostgreSQL
- **缓存**: Redis
- **样式**: Tailwind CSS
- **UI 组件**: Radix UI
- **图表**: Recharts
- **表单**: React Hook Form
- **验证**: Zod
- **Excel导出**: SheetJS (xlsx)

## 项目结构

```
├── app/
│   ├── api/                    # API 路由
│   │   ├── projects/           # 项目管理
│   │   ├── quotes/             # 报价管理
│   │   ├── addons/             # 增项管理
│   │   ├── budget-changes/     # 预算变更
│   │   ├── repairs/            # 返修管理
│   │   ├── feedbacks/          # 客户反馈
│   │   ├── notifications/      # 通知中心
│   │   ├── reports/            # 报表导出
│   │   └── version-history/    # 版本追溯
│   ├── designer/               # 设计师端页面
│   │   ├── page.tsx
│   │   ├── quotes/
│   │   └── addons/
│   ├── admin/                  # 后台管理页面
│   │   ├── page.tsx
│   │   ├── projects/
│   │   ├── budget/
│   │   ├── repairs/
│   │   ├── feedbacks/
│   │   └── reports/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                     # 基础 UI 组件
│   ├── layout/                 # 布局组件
│   ├── projects/               # 项目组件
│   ├── quotes/                 # 报价组件
│   ├── addons/                 # 增项组件
│   ├── budget/                 # 预算组件
│   ├── repairs/                # 返修组件
│   ├── feedbacks/              # 反馈组件
│   ├── reports/                # 报表组件
│   └── version-history/        # 版本历史组件
├── lib/
│   ├── prisma.ts               # Prisma 客户端
│   ├── redis.ts                # Redis 客户端
│   ├── utils.ts                # 工具函数
│   ├── pagination.ts           # 分页工具
│   ├── budget.ts               # 预算逻辑
│   ├── notifications.ts        # 通知逻辑
│   ├── reports.ts              # 报表逻辑
│   ├── version-history.ts      # 版本历史逻辑
│   └── hooks/
│       └── use-api.ts          # API Hooks
├── prisma/
│   ├── schema.prisma           # 数据模型
│   └── migrations/             # 数据库迁移
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 数据库模型

### 核心实体关系

```
User (设计师/客户/管理员/老板)
  ├─ Project (作为设计师)
  ├─ Project (作为客户)
  └─ ...

Project
  ├─ Quote (报价)
  │   └─ QuoteItem (报价明细)
  ├─ Addon (增项)
  ├─ BudgetChange (预算变更记录)
  ├─ Material (材料清单)
  ├─ SitePhoto (现场照片)
  ├─ Contract (合同附件)
  ├─ Repair (返修记录)
  │   └─ RepairPhoto (返修照片)
  └─ Feedback (客户反馈)

VersionHistory (所有实体的版本历史)
Notification (系统通知)
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# PostgreSQL 数据库连接
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/design_portal?schema=public"

# Redis 连接
REDIS_URL="redis://localhost:6379"

# 应用 URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. 启动数据库

使用 Docker 启动 PostgreSQL 和 Redis：

```bash
# 启动 PostgreSQL
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=design_portal postgres:16

# 启动 Redis
docker run -d --name redis -p 6379:6379 redis:7
```

### 4. 运行数据库迁移

```bash
# 生成 Prisma 客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 核心流程说明

### 1. 报价确认流程

1. 设计师创建报价单，包含多个报价项
2. 报价提交客户确认，状态变为 `PENDING_CONFIRMATION`
3. 客户确认后，系统自动：
   - 更新报价状态为 `CONFIRMED`
   - 创建 `BudgetChange` 记录
   - 更新项目 `currentBudget`
   - 创建版本历史记录

### 2. 增项确认流程

1. 设计师创建增项，填写原因和金额
2. 增项提交确认，状态变为 `PENDING_CONFIRMATION`
3. 确认后系统自动：
   - 更新增项状态为 `CONFIRMED`
   - 创建 `BudgetChange` 记录
   - 更新项目预算
   - 创建版本历史记录

### 3. 返修超时提醒

1. 系统每小时自动检查超时返修任务
2. 发现超时任务：
   - 更新状态为 `OVERDUE`
   - 向所有 `BOSS` 角色用户发送通知
   - 24小时内不重复提醒

### 4. 预算追踪

- 每次报价/增项确认自动记录预算变更
- 记录变更前后预算、变更金额、变更原因
- 关联具体的报价/增项记录
- 支持按时间、项目筛选

### 5. 版本追溯

- 报价、增项、材料、照片、合同修改时自动创建版本快照
- 记录修改人、修改时间、修改备注
- 支持两个版本对比，高亮显示差异
- 所有变更永久保存，可随时回溯

### 6. 月底报表

- 自动生成本月运营数据：
  - 项目数量、完成率
  - 预算总额、支出、增项金额
  - 返修情况统计
  - 客户反馈满意度
- 支持导出 Excel 格式
- 数据可视化图表展示

## API 接口说明

### 项目接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects` | 获取项目列表（支持分页、筛选、缓存） |
| POST | `/api/projects` | 创建新项目 |
| GET | `/api/projects/:id` | 获取项目详情 |
| PATCH | `/api/projects/:id` | 更新项目信息 |
| DELETE | `/api/projects/:id` | 删除项目 |

### 报价接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/quotes` | 获取报价列表 |
| POST | `/api/quotes` | 创建报价 |
| GET | `/api/quotes/:id` | 获取报价详情 |
| POST | `/api/quotes/:id?action=confirm` | 确认报价 |
| PATCH | `/api/quotes/:id` | 更新报价状态 |

### 增项接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/addons` | 获取增项列表 |
| POST | `/api/addons` | 创建增项 |
| GET | `/api/addons/:id` | 获取增项详情 |
| POST | `/api/addons/:id?action=confirm` | 确认增项 |

### 其他接口

- 预算变更: `/api/budget-changes`
- 返修管理: `/api/repairs`
- 客户反馈: `/api/feedbacks`
- 通知中心: `/api/notifications`
- 报表导出: `/api/reports`
- 版本历史: `/api/version-history`

### 分页与筛选

所有列表接口支持统一的分页筛选参数：

```
GET /api/projects?page=1&pageSize=20&status=IN_PROGRESS&search=关键词&sortBy=createdAt&sortOrder=desc
```

参数说明：
- `page`: 页码，默认 1
- `pageSize`: 每页数量，默认 20，最大 100
- `status`/`designerId` 等: 具体字段筛选
- `search`: 模糊搜索
- `sortBy`: 排序字段
- `sortOrder`: 排序方向（asc/desc）

## 缓存策略

### Redis 缓存键设计

- `projects:{filters}` - 项目列表缓存，TTL 5分钟
- `quotes:{filters}` - 报价列表缓存，TTL 5分钟
- `addons:{filters}` - 增项列表缓存，TTL 5分钟
- `repairs:{filters}` - 返修列表缓存，TTL 1分钟（更频繁更新）
- `budget-changes:{filters}` - 预算变更缓存，TTL 5分钟

### 缓存失效

- 创建/更新/删除操作后，自动清除相关缓存
- 使用 `delPattern` 批量清除同类型缓存

## 部署建议

### 生产环境部署

1. **数据库**: 使用托管 PostgreSQL（如 Supabase, Neon, AWS RDS）
2. **Redis**: 使用托管 Redis（如 Upstash, Redis Labs, AWS ElastiCache）
3. **应用**: 部署到 Vercel 或其他支持 Next.js 的平台
4. **定时任务**: 使用 Vercel Cron 或独立服务定期检查超时返修

### 环境变量

确保生产环境配置以下变量：

```env
DATABASE_URL=
REDIS_URL=
NEXT_PUBLIC_APP_URL=
```

### 性能优化

1. 数据库索引已在 Prisma schema 中预定义
2. 列表查询默认使用 Redis 缓存
3. 大数据量时建议：
   - 增加 Redis 内存
   - 调整分页大小
   - 使用数据库只读副本
   - 定期归档历史数据

## 开发说明

### 添加新功能

1. 在 `prisma/schema.prisma` 定义数据模型
2. 运行 `npm run prisma:generate` 生成类型
3. 在 `lib/` 添加业务逻辑
4. 在 `app/api/` 添加 API 路由
5. 在 `components/` 添加 UI 组件
6. 在 `app/` 下添加页面路由

### 代码规范

- 使用 TypeScript 严格模式
- 遵循现有代码风格
- API 接口使用 Zod 验证输入
- 数据库操作使用事务保证一致性
- 重要变更自动记录版本历史

## 许可证

MIT
