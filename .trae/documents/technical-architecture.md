## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层 (SvelteKit)"
        A["前台页面"]
        B["后台管理"]
        C["状态管理 (Svelte Stores)"]
        D["路由系统 (File-based)"]
        E["组件库"]
    end
    
    subgraph "服务端层 (SvelteKit Server)"
        F["API Routes"]
        G["Server Load Functions"]
        H["表单处理 (Form Actions)"]
        I["认证中间件"]
    end
    
    subgraph "数据层 (Drizzle ORM)"
        J["数据库连接"]
        K["Schema 定义"]
        L["查询构建器"]
        M["数据迁移"]
    end
    
    subgraph "数据库 (PostgreSQL)"
        N["业务数据表"]
        O["索引与视图"]
        P["物化视图 (大数据优化)"]
    end
    
    subgraph "外部服务"
        Q["异步任务队列 (导出/筛选)"]
        R["文件存储 (照片/导出文件)"]
        S["缓存层 (Redis)"]
    end
    
    A --> F
    A --> G
    B --> F
    B --> H
    F --> J
    G --> J
    H --> J
    J --> N
    J --> O
    J --> P
    F --> Q
    F --> R
    F --> S
```

## 2. 技术描述

- **前端框架**：SvelteKit 2.0 + TypeScript
- **样式方案**：Tailwind CSS 3.4 + PostCSS
- **ORM**：Drizzle ORM 0.30
- **数据库**：PostgreSQL 16
- **包管理**：pnpm
- **异步处理**：BullMQ + Redis
- **图标库**：lucide-svelte
- **图表库**：Chart.js + svelte-chartjs
- **虚拟滚动**：svelte-virtual
- **日期处理**：date-fns

## 3. 目录结构

```
/
├── src/
│   ├── lib/
│   │   ├── components/          # 可复用组件
│   │   ├── server/              # 服务端专用代码
│   │   │   ├── db.ts            # 数据库连接
│   │   │   ├── schema.ts        # Drizzle Schema
│   │   │   └── services/        # 业务逻辑服务
│   │   ├── stores/              # Svelte Stores
│   │   ├── utils/               # 工具函数
│   │   └── types/               # TypeScript 类型定义
│   ├── routes/
│   │   ├── +layout.svelte       # 根布局
│   │   ├── +page.svelte         # 首页/项目列表
│   │   ├── projects/
│   │   │   └── [id]/
│   │   │       ├── +page.svelte # 项目详情
│   │   │       └── signin/+page.svelte  # 签到页
│   │   ├── my-records/
│   │   │   └── +page.svelte     # 我的服务记录
│   │   ├── admin/
│   │   │   ├── +layout.svelte   # 后台布局
│   │   │   ├── budget/+page.svelte    # 预算管理
│   │   │   ├── feedback/+page.svelte  # 反馈审核
│   │   │   ├── logs/+page.svelte      # 日志中心
│   │   │   └── export/+page.svelte    # 数据导出
│   │   └── api/                 # API 路由
│   └── app.css                  # 全局样式 + Tailwind
├── drizzle/                     # 数据库迁移
├── static/                      # 静态资源
├── svelte.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── package.json
```

## 4. 路由定义

| 路由 | 用途 | 权限 |
|------|------|------|
| / | 项目公开列表页 | 公开 |
| /projects/[id] | 项目详情页（时长/物资/照片一站式查看） | 公开 |
| /projects/[id]/signin | 活动签到页 | 已报名用户 |
| /my-records | 我的服务记录 | 登录用户 |
| /admin | 后台管理首页 | 管理员/队长 |
| /admin/budget | 预算管理 | 管理员 |
| /admin/feedback | 反馈审核 | 管理员 |
| /admin/logs | 日志中心 | 管理员 |
| /admin/export | 数据导出中心 | 管理员 |
| /api/projects | 项目 CRUD API | 按权限 |
| /api/registrations | 报名 API | 登录用户 |
| /api/signin | 签到 API | 登录用户 |
| /api/export | 导出任务 API | 管理员 |

## 5. 服务端架构

```mermaid
graph LR
    A["API Routes / Form Actions"] --> B["Auth Middleware"]
    B --> C["权限校验"]
    C --> D["Service Layer"]
    D --> E["Drizzle ORM"]
    E --> F["PostgreSQL"]
    
    G["导出/大筛选请求"] --> H["异步队列 (BullMQ)"]
    H --> I["Worker 进程"]
    I --> E
    I --> J["文件存储"]
    
    K["高频查询"] --> L["Redis 缓存"]
    L --> E
```

## 6. 数据模型

### 6.1 ER 图

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : "管理"
    USERS ||--o{ REGISTRATIONS : "报名"
    USERS ||--o{ SIGNIN_RECORDS : "签到"
    USERS ||--o{ FEEDBACKS : "提交"
    PROJECTS ||--o{ SHIFTS : "包含"
    PROJECTS ||--o{ BUDGETS : "有"
    PROJECTS ||--o{ MATERIALS : "有"
    PROJECTS ||--o{ PHOTOS : "有"
    PROJECTS ||--o{ FEEDBACKS : "收到"
    SHIFTS ||--o{ REGISTRATIONS : "被报名"
    SHIFTS ||--o{ SIGNIN_RECORDS : "有"
    BUDGETS ||--o{ BUDGET_ITEMS : "包含"
    MATERIALS ||--o{ MATERIAL_FLOWS : "有流水"
    FEEDBACKS ||--o{ FEEDBACK_PROCESSINGS : "有处理记录"
    
    USERS {
        uuid id PK
        string name
        string email
        string role
        string password_hash
    }
    
    PROJECTS {
        uuid id PK
        string title
        text description
        date start_date
        date end_date
        string status
        uuid manager_id FK
    }
    
    SHIFTS {
        uuid id PK
        uuid project_id FK
        string name
        datetime start_time
        datetime end_time
        int max_participants
        string location
    }
    
    REGISTRATIONS {
        uuid id PK
        uuid user_id FK
        uuid shift_id FK
        string status
        datetime registered_at
    }
    
    SIGNIN_RECORDS {
        uuid id PK
        uuid user_id FK
        uuid shift_id FK
        datetime signin_time
        decimal duration_hours
        string status
    }
    
    BUDGETS {
        uuid id PK
        uuid project_id FK
        decimal total_amount
        decimal used_amount
    }
    
    BUDGET_ITEMS {
        uuid id PK
        uuid budget_id FK
        string item_name
        decimal amount
        string category
        date expense_date
    }
    
    MATERIALS {
        uuid id PK
        uuid project_id FK
        string name
        int initial_quantity
        int current_quantity
        string unit
    }
    
    MATERIAL_FLOWS {
        uuid id PK
        uuid material_id FK
        string type
        int quantity
        string direction
        datetime flow_time
        string handler
        string remark
    }
    
    PHOTOS {
        uuid id PK
        uuid project_id FK
        string url
        string caption
        string category
        datetime uploaded_at
    }
    
    FEEDBACKS {
        uuid id PK
        uuid user_id FK
        uuid project_id FK
        text content
        string status
        datetime created_at
    }
    
    FEEDBACK_PROCESSINGS {
        uuid id PK
        uuid feedback_id FK
        uuid processor_id FK
        text affected_parties
        text responsible_person
        text next_steps
        text processing_result
        datetime processed_at
    }
    
    OPERATION_LOGS {
        uuid id PK
        uuid user_id FK
        string action
        string target_type
        uuid target_id
        jsonb details
        datetime created_at
    }
    
    EXPORT_TASKS {
        uuid id PK
        uuid user_id FK
        string export_type
        jsonb filters
        string status
        string file_url
        datetime created_at
        datetime completed_at
    }
```

### 6.2 索引优化

```sql
-- 项目查询优化
CREATE INDEX idx_projects_status_date ON projects(status, start_date DESC);
CREATE INDEX idx_projects_manager ON projects(manager_id);

-- 签到记录优化（大数据量）
CREATE INDEX idx_signin_user_date ON signin_records(user_id, signin_time DESC);
CREATE INDEX idx_signin_shift ON signin_records(shift_id);
CREATE INDEX idx_signin_project ON signin_records(shift_id) INCLUDE (user_id, duration_hours);

-- 日志表分区（按月份）
CREATE TABLE operation_logs_partition OF operation_logs
PARTITION BY RANGE (created_at);

-- 物化视图：时长统计
CREATE MATERIALIZED VIEW mv_service_hours_summary AS
SELECT 
    user_id,
    project_id,
    SUM(duration_hours) as total_hours,
    COUNT(*) as times
FROM signin_records
WHERE status = 'confirmed'
GROUP BY user_id, project_id;

CREATE INDEX idx_mv_hours_user ON mv_service_hours_summary(user_id);
```

### 6.3 Drizzle Schema 定义

```typescript
// src/lib/server/schema.ts
import { pgTable, uuid, text, timestamp, integer, decimal, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('volunteer'),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  coverImage: text('cover_image'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: text('status').notNull().default('draft'),
  managerId: uuid('manager_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const shifts = pgTable('shifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  name: text('name').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  maxParticipants: integer('max_participants').default(50),
  location: text('location'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const registrations = pgTable('registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  shiftId: uuid('shift_id').references(() => shifts.id).notNull(),
  status: text('status').notNull().default('registered'),
  registeredAt: timestamp('registered_at').defaultNow(),
});

export const signinRecords = pgTable('signin_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  shiftId: uuid('shift_id').references(() => shifts.id).notNull(),
  signinTime: timestamp('signin_time').defaultNow(),
  durationHours: decimal('duration_hours', { precision: 4, scale: 2 }),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  usedAmount: decimal('used_amount', { precision: 12, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const budgetItems = pgTable('budget_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  budgetId: uuid('budget_id').references(() => budgets.id).notNull(),
  itemName: text('item_name').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  category: text('category'),
  expenseDate: timestamp('expense_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const materials = pgTable('materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  name: text('name').notNull(),
  initialQuantity: integer('initial_quantity').notNull(),
  currentQuantity: integer('current_quantity').notNull(),
  unit: text('unit'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const materialFlows = pgTable('material_flows', {
  id: uuid('id').primaryKey().defaultRandom(),
  materialId: uuid('material_id').references(() => materials.id).notNull(),
  type: text('type').notNull(),
  quantity: integer('quantity').notNull(),
  direction: text('direction').notNull(),
  flowTime: timestamp('flow_time').defaultNow(),
  handler: text('handler'),
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const photos = pgTable('photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  url: text('url').notNull(),
  caption: text('caption'),
  category: text('category'),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

export const feedbacks = pgTable('feedbacks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  content: text('content').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const feedbackProcessings = pgTable('feedback_processings', {
  id: uuid('id').primaryKey().defaultRandom(),
  feedbackId: uuid('feedback_id').references(() => feedbacks.id).notNull(),
  processorId: uuid('processor_id').references(() => users.id).notNull(),
  affectedParties: text('affected_parties').notNull(),
  responsiblePerson: text('responsible_person').notNull(),
  nextSteps: text('next_steps').notNull(),
  processingResult: text('processing_result'),
  processedAt: timestamp('processed_at').defaultNow(),
});

export const operationLogs = pgTable('operation_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: uuid('target_id'),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const exportTasks = pgTable('export_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  exportType: text('export_type').notNull(),
  filters: jsonb('filters'),
  status: text('status').notNull().default('pending'),
  fileUrl: text('file_url'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});
```

## 7. 性能优化策略

### 7.1 大数据量处理
- **虚拟滚动**：日志列表、服务记录使用 `svelte-virtual`
- **分页查询**：使用 `limit/offset` + 游标分页，避免深分页问题
- **物化视图**：统计类查询预计算
- **查询批处理**：合并多次查询，减少数据库往返

### 7.2 导出异步化
- 导出请求入队列，返回任务 ID
- 后台 Worker 处理导出，生成 CSV/Excel
- 进度通过 SSE/WebSocket 推送
- 完成后存储到文件服务，发送通知

### 7.3 筛选优化
- 筛选条件使用索引覆盖查询
- 复杂筛选使用 CTE 或临时表
- 高频筛选结果缓存 Redis
- 筛选和导出接口分离，避免互相影响

### 7.4 前端优化
- 路由级代码分割
- 图片懒加载 + WebP 格式
- 组件按需导入
- 使用 Svelte Stores 管理共享状态
- 防抖处理搜索和筛选输入
