## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层 (Nuxt 3 Vue 3 + TypeScript)"
        A1["前台工作台 /pages/front-desk"]
        A2["客户画像库 /pages/customers"]
        A3["协同工作区 /pages/collaboration"]
        A4["后台配置 /pages/admin"]
        A5["报表中心 /pages/reports"]
        A6["审批中心 /pages/approvals"]
    end

    subgraph "服务层 (Nitro Server)"
        B1["Nitro Middleware (鉴权/日志/Redis缓存)"]
        B2["REST API Routes (/server/api)"]
        B3["Server Utils (Prisma Client / Redis封装)"]
    end

    subgraph "数据层"
        C1["MySQL 8.x - 业务主库"]
        C2["Redis 7.x - 缓存/会话/热数据"]
    end

    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B1
    A5 --> B1
    A6 --> B1
    B1 --> B2
    B2 --> B3
    B3 --> C1
    B3 --> C2
```

## 2. 技术说明

- **前端框架**：Nuxt 3.12+ (Vue 3.4 + TypeScript 5.4)，SSR/SSG 混合模式
- **UI 组件**：Nuxt UI 2.x + TailwindCSS 3.4 + @vueuse/core
- **图标库**：lucide-vue-next（与 Lucide React 风格一致的 Vue 版本）
- **状态管理**：Pinia 2.x（Nuxt 官方推荐）
- **后端服务**：Nitro（Nuxt 内置）+ H3 路由
- **ORM**：Prisma 5.14+（MySQL 驱动）
- **数据库**：MySQL 8.0+（主存）+ Redis 7.0+（缓存/会话/排行榜）
- **初始化工具**：npx nuxi init 模板

## 3. 路由定义

| 路由路径 | 用途 | 权限角色 |
|----------|------|----------|
| `/login` | 登录页 | 公开 |
| `/` | 首页总览看板 | 全员 |
| `/front-desk` | 前台工作台（咨询/复诊/消费录入） | 前台、顾问 |
| `/customers` | 客户画像库列表 | 全员 |
| `/customers/:id` | 客户画像详情 + 协同工作区 | 全员 |
| `/collaboration` | 跨部门协同视图（一体化） | 顾问、经理 |
| `/admin/tags` | 标签管理 | 经理以上 |
| `/admin/levels` | 客户等级配置 | 经理以上 |
| `/admin/advisors` | 顾问团队管理 | 经理以上 |
| `/admin/templates` | 回访计划模板 | 经理以上 |
| `/reports/conversion` | 来源转化报表 | 顾问以上 |
| `/reports/lead-quality` | 线索质量统计 | 经理以上 |
| `/approvals/batch` | 批量审批中心 | 经理以上 |

## 4. API 定义

### 4.1 客户模块
```typescript
// GET /api/customers - 客户列表（分页+筛选）
interface CustomerListQuery {
  page: number
  pageSize: number
  keyword?: string
  tagIds?: number[]
  levelId?: number
  advisorId?: number
  leadQuality?: 'A' | 'B' | 'C' | 'D'
}

// POST /api/customers - 新建客户
interface CustomerCreateInput {
  name: string
  phone: string
  gender?: 'M' | 'F'
  age?: number
  sourceChannelId: number
  consultIntent: string
  returnPreference?: string
  tagIds?: number[]
  advisorId?: number
}

// GET /api/customers/:id - 客户画像详情（聚合所有关联数据）
interface CustomerDetailVO {
  base: Customer
  tags: Tag[]
  level: CustomerLevel
  advisor: Advisor
  consults: ConsultRecord[]
  returnVisits: ReturnPlan[]
  consumptions: ConsumptionRecord[]
  quotations: Quotation[]
  churnInfo?: ChurnRecord
}
```

### 4.2 协同模块
```typescript
// POST /api/customers/:id/churn - 记录流失原因
interface ChurnCreateInput {
  reasonCode: string
  reasonDetail?: string
  quotationId?: number
}

// GET /api/customers/:id/quotations - 报价版本列表（不跳转，直接返回）
interface QuotationVO {
  id: number
  version: string
  amount: number
  items: QuotationItem[]
  expireAt: Date
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'EXPIRED' | 'REJECTED'
  expireReason?: string
  responseNodes: ResponseNode[]
}

// POST /api/customers/:id/return-plans - 新增回访计划（同屏操作）
interface ReturnPlanInput {
  planDate: Date
  planType: 'FOLLOW_UP' | 'REVISIT' | 'QUOTATION'
  content: string
  assigneeId: number
}
```

### 4.3 报表模块
```typescript
// GET /api/reports/conversion - 来源转化漏斗
interface ConversionReportVO {
  channels: ChannelFunnel[]
  quotationExpireAnalysis: {
    byReason: { reason: string; count: number; percentage: number }[]
    byOwner: { ownerName: string; expiredCount: number; totalCount: number }[]
    responseNodes: { node: string; avgDelayHours: number; ownerId: number }[]
  }
}

// GET /api/reports/lead-quality - 线索质量统计
interface LeadQualityReportVO {
  qualityDistribution: { grade: string; count: number; avgAmount: number }[]
  byAdvisor: { advisorId: number; A: number; B: number; C: number; D: number }[]
}
```

### 4.4 批量审批模块
```typescript
// POST /api/approvals/batch - 提交批量审批（含影响对象预览）
interface BatchApprovalInput {
  type: 'LEVEL_UPGRADE' | 'TAG_ADD' | 'ADVISOR_TRANSFER' | 'QUOTATION_APPROVE'
  targetIds: number[]
  payload: Record<string, any>
}

interface BatchApprovalPreviewVO {
  type: string
  totalCount: number
  affectedObjects: { id: number; name: string; currentValue: string; newValue: string }[]
  warningCount: number
  warnings: { targetId: number; message: string }[]
}

// POST /api/approvals/execute - 执行批量审批
interface BatchApprovalResultVO {
  successCount: number
  failCount: number
  results: {
    targetId: number
    targetName: string
    success: boolean
    originalStatus?: string
    failReason?: string
  }[]
}
```

## 5. 服务端架构图

```mermaid
graph LR
    A[Nitro Route Handler] --> B[Auth Middleware]
    B --> C[Validation Layer (zod)]
    C --> D[Service Layer]
    D --> E[Prisma Repository]
    D --> F[Redis Cache Layer]
    E --> G[(MySQL)]
    F --> H[(Redis)]
    D --> I[Event Bus (Nitro Hooks)]
    I --> J[Audit Logger]
    I --> K[Notification Service]
```

## 6. 数据模型

### 6.1 ER 图

```mermaid
erDiagram
    CUSTOMER ||--o{ CUSTOMER_TAG : has
    CUSTOMER ||--o{ CONSULT_RECORD : has
    CUSTOMER ||--o{ CONSUMPTION : has
    CUSTOMER ||--o{ QUOTATION : has
    CUSTOMER ||--o{ RETURN_PLAN : has
    CUSTOMER ||--o| CHURN_RECORD : may_have
    CUSTOMER }o--|| CUSTOMER_LEVEL : belongs_to
    CUSTOMER }o--|| ADVISOR : belongs_to
    CUSTOMER }o--|| SOURCE_CHANNEL : from
    TAG ||--o{ CUSTOMER_TAG : tagged
    ADVISOR ||--o{ RETURN_PLAN : assigned
    ADVISOR ||--o{ QUOTATION : owns
    QUOTATION ||--o{ QUOTATION_ITEM : contains
    QUOTATION ||--o{ RESPONSE_NODE : tracks
    BATCH_APPROVAL ||--o{ APPROVAL_ITEM : contains

    CUSTOMER {
        bigint id PK
        string name
        string phone UK
        string gender
        int age
        bigint level_id FK
        bigint advisor_id FK
        bigint source_channel_id FK
        string consult_intent
        string return_preference
        enum lead_quality
        datetime created_at
    }
    TAG {
        bigint id PK
        string name
        string color
        boolean active
    }
    CUSTOMER_LEVEL {
        bigint id PK
        string name
        int threshold
        string benefits
    }
    ADVISOR {
        bigint id PK
        string name
        string role
        boolean active
    }
    SOURCE_CHANNEL {
        bigint id PK
        string name
        string category
    }
    CONSULT_RECORD {
        bigint id PK
        bigint customer_id FK
        text content
        date consult_date
    }
    CONSUMPTION {
        bigint id PK
        bigint customer_id FK
        decimal amount
        string project
        date consume_date
    }
    QUOTATION {
        bigint id PK
        bigint customer_id FK
        bigint advisor_id FK
        string version
        decimal total_amount
        date expire_at
        enum status
        text expire_reason
    }
    QUOTATION_ITEM {
        bigint id PK
        bigint quotation_id FK
        string item_name
        decimal price
    }
    RESPONSE_NODE {
        bigint id PK
        bigint quotation_id FK
        string node_name
        bigint owner_id FK
        datetime due_at
        datetime done_at
        text remark
    }
    RETURN_PLAN {
        bigint id PK
        bigint customer_id FK
        bigint assignee_id FK
        date plan_date
        enum plan_type
        text content
        enum status
    }
    CHURN_RECORD {
        bigint id PK
        bigint customer_id FK
        string reason_code
        text reason_detail
        datetime churn_date
    }
    BATCH_APPROVAL {
        bigint id PK
        enum type
        bigint submitter_id
        enum status
        json payload
    }
    APPROVAL_ITEM {
        bigint id PK
        bigint approval_id FK
        bigint target_id
        enum result
        string fail_reason
        string original_value
    }
```

### 6.2 Prisma Schema 核心配置

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// Redis 缓存策略:
// - 客户详情: customers:{id} TTL=300s，更新时主动失效
// - 标签/等级字典: dict:tags / dict:levels TTL=1800s
// - 报表数据: reports:conversion:{date} TTL=3600s
// - 会话存储: session:{token} TTL=86400s
```
