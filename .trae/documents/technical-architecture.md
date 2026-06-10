## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层"
        A["Next.js 14 App Router"]
        B["React Server Components"]
        C["Client Components (交互)"]
        D["TailwindCSS 样式"]
        E["shadcn/ui 组件库"]
    end
    
    subgraph "API 层"
        F["Next.js Route Handlers"]
        G["Server Actions"]
        H["API 认证中间件"]
    end
    
    subgraph "业务层"
        I["Prisma ORM"]
        J["业务服务层"]
        K["Redis 缓存"]
    end
    
    subgraph "数据层"
        L["PostgreSQL"]
        M["Redis"]
    end
    
    subgraph "外部服务"
        N["支付服务 (模拟)"]
        O["邮件服务 (模拟)"]
    end
    
    A --> F
    A --> G
    C --> F
    F --> H
    G --> I
    H --> I
    I --> J
    J --> L
    J --> K
    K --> M
    J --> N
    J --> O
```

## 2. 技术描述

- **前端框架**：Next.js 14 (App Router) + React 18 + TypeScript 5
- **样式方案**：TailwindCSS 3 + shadcn/ui 组件库
- **ORM**：Prisma 5
- **主数据库**：PostgreSQL 15
- **缓存/会话**：Redis 7
- **图表库**：recharts
- **日期处理**：date-fns
- **表单处理**：react-hook-form + zod
- **图标库**：lucide-react
- **状态管理**：React Context + Server State

## 3. 路由定义

| 路由 | 用途 | 权限 |
|------|------|------|
| / | 用户首页/概览 | 登录用户 |
| /pricing | 套餐列表 | 公开 |
| /billing | 账单列表 | 登录用户 |
| /billing/[id] | 账单详情 | 登录用户 |
| /seats | 席位管理 | 登录用户 |
| /admin | 管理后台首页 | 管理员 |
| /admin/plans | 套餐配置 | 管理员 |
| /admin/plans/[id] | 套餐编辑 | 管理员 |
| /admin/billing-rules | 账期规则 | 管理员 |
| /admin/seats | 席位总览 | 管理员 |
| /admin/trials | 试用管理 | 管理员 |
| /admin/thresholds | 用量阈值 | 管理员 |
| /admin/refunds | 退款管理 | 管理员 |
| /admin/refunds/stats | 退款统计 | 管理员 |
| /admin/changes | 变更记录 | 管理员 |
| /login | 登录页 | 公开 |
| /register | 注册页 | 公开 |

## 4. API 定义

### 4.1 认证相关

```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}
interface LoginResponse {
  user: User;
  token: string;
}

// POST /api/auth/register
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}
interface RegisterResponse {
  user: User;
  token: string;
}
```

### 4.2 套餐相关

```typescript
// GET /api/plans
interface PlanListResponse {
  plans: Plan[];
}

// POST /api/plans (管理员)
interface CreatePlanRequest {
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  seatLimit: number;
  trialDays: number;
  status: 'active' | 'inactive';
}

// PATCH /api/plans/[id] (管理员)
interface UpdatePlanRequest extends Partial<CreatePlanRequest> {}
```

### 4.3 订阅相关

```typescript
// POST /api/subscriptions
interface CreateSubscriptionRequest {
  planId: string;
  paymentMethodId: string;
}
interface CreateSubscriptionResponse {
  subscription: Subscription;
  invoice: Invoice;
}

// POST /api/subscriptions/upgrade
interface UpgradeSubscriptionRequest {
  targetPlanId: string;
}
```

### 4.4 账单相关

```typescript
// GET /api/invoices
interface InvoiceListResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}

// GET /api/invoices/[id]
interface InvoiceDetailResponse {
  invoice: Invoice;
  items: InvoiceItem[];
}

// GET /api/invoices/export
// 返回 CSV 文件
```

### 4.5 退款相关

```typescript
// POST /api/refunds
interface CreateRefundRequest {
  invoiceId: string;
  reason: string;
  reasonCode: string;
  amount: number;
  note?: string;
}

// GET /api/admin/refunds (管理员)
interface RefundListResponse {
  refunds: Refund[];
  total: number;
}

// PATCH /api/admin/refunds/[id] (管理员)
interface ReviewRefundRequest {
  status: 'approved' | 'rejected';
  reviewNote?: string;
}

// GET /api/admin/refunds/stats (管理员)
interface RefundStatsResponse {
  totalRefunds: number;
  totalAmount: number;
  byReason: { reason: string; count: number; amount: number }[];
  monthlyTrend: { month: string; count: number; amount: number }[];
}
```

### 4.6 席位相关

```typescript
// GET /api/seats
interface SeatListResponse {
  seats: Seat[];
  total: number;
  used: number;
}

// POST /api/seats/invite
interface InviteSeatRequest {
  email: string;
  role?: string;
}
```

### 4.7 变更记录

```typescript
// GET /api/admin/changes (管理员)
interface ChangeLogListResponse {
  changes: ChangeLog[];
  total: number;
}
```

## 5. 服务器架构图

```mermaid
graph TD
    subgraph "Next.js Server"
        A["App Router Pages (RSC)"]
        B["Route Handlers"]
        C["Server Actions"]
    end
    
    subgraph "业务服务层"
        D["AuthService"]
        E["PlanService"]
        F["SubscriptionService"]
        G["InvoiceService"]
        H["RefundService"]
        I["SeatService"]
        J["TrialService"]
        K["NotificationService"]
    end
    
    subgraph "数据访问层"
        L["Prisma Client"]
        M["Redis Client"]
    end
    
    subgraph "数据存储"
        N["PostgreSQL"]
        O["Redis"]
    end
    
    A --> D
    A --> E
    A --> F
    B --> D
    B --> E
    B --> F
    B --> G
    B --> H
    B --> I
    C --> F
    C --> G
    
    D --> L
    E --> L
    F --> L
    G --> L
    H --> L
    I --> L
    J --> L
    K --> M
    
    L --> N
    M --> O
```

## 6. 数据模型

### 6.1 ER 图

```mermaid
erDiagram
    USER ||--o{ SUBSCRIPTION : has
    USER ||--o{ INVOICE : has
    USER ||--o{ SEAT : has
    USER ||--o{ REFUND : requests
    PLAN ||--o{ SUBSCRIPTION : "subscribed to"
    PLAN ||--o{ PLAN_VERSION : has
    SUBSCRIPTION ||--o{ INVOICE : generates
    SUBSCRIPTION ||--o{ SEAT : includes
    SUBSCRIPTION ||--o{ CHANGE_LOG : has
    INVOICE ||--o{ INVOICE_ITEM : contains
    INVOICE ||--o{ REFUND : has
    INVOICE ||--o{ PAYMENT : has
    TRIAL ||--o{ SUBSCRIPTION : converts
    
    USER {
        string id PK
        string email
        string name
        string password_hash
        string role
        datetime created_at
    }
    
    PLAN {
        string id PK
        string name
        string description
        decimal price
        string interval
        int seat_limit
        int trial_days
        string status
        text features
        datetime created_at
        datetime updated_at
    }
    
    PLAN_VERSION {
        string id PK
        string plan_id FK
        decimal price
        text changes
        string note
        datetime created_at
    }
    
    SUBSCRIPTION {
        string id PK
        string user_id FK
        string plan_id FK
        string status
        datetime current_period_start
        datetime current_period_end
        datetime trial_start
        datetime trial_end
        boolean trial_used
        int seats_included
        datetime created_at
        datetime updated_at
    }
    
    INVOICE {
        string id PK
        string user_id FK
        string subscription_id FK
        decimal amount
        decimal paid_amount
        string status
        datetime due_date
        datetime paid_at
        string billing_period
        datetime created_at
    }
    
    INVOICE_ITEM {
        string id PK
        string invoice_id FK
        string description
        decimal amount
        int quantity
        string type
    }
    
    PAYMENT {
        string id PK
        string invoice_id FK
        decimal amount
        string method
        string status
        datetime created_at
    }
    
    SEAT {
        string id PK
        string user_id FK
        string subscription_id FK
        string email
        string name
        string status
        string role
        datetime invited_at
        datetime activated_at
    }
    
    REFUND {
        string id PK
        string invoice_id FK
        string user_id FK
        decimal amount
        string reason_code
        string reason
        string note
        string status
        string review_note
        datetime reviewed_at
        datetime created_at
    }
    
    CHANGE_LOG {
        string id PK
        string subscription_id FK
        string type
        text old_value
        text new_value
        string note
        string result
        datetime created_at
    }
    
    TRIAL {
        string id PK
        string user_id FK
        string plan_id FK
        datetime start_date
        datetime end_date
        string status
        boolean converted
        datetime converted_at
    }
    
    USAGE_THRESHOLD {
        string id PK
        string plan_id FK
        string metric
        int threshold
        int warning_percent
        string notification_type
    }
```

### 6.2 核心表字段说明

**users 表**
- id: 主键，UUID
- email: 邮箱，唯一索引
- name: 用户名称
- password_hash: 密码哈希
- role: 角色 (user/admin)
- created_at: 创建时间

**plans 表**
- id: 主键，UUID
- name: 套餐名称
- description: 套餐描述
- price: 价格 (decimal)
- interval: 计费周期 (monthly/yearly)
- seat_limit: 席位限制
- trial_days: 试用天数
- status: 状态 (active/inactive)
- features: 功能列表 (JSON/text)

**subscriptions 表**
- id: 主键，UUID
- user_id: 用户ID，外键
- plan_id: 套餐ID，外键
- status: 状态 (active/past_due/canceled/trialing)
- current_period_start: 当前周期开始
- current_period_end: 当前周期结束
- trial_start: 试用开始
- trial_end: 试用结束
- seats_included: 包含席位数

**invoices 表**
- id: 主键，UUID
- user_id: 用户ID
- subscription_id: 订阅ID
- amount: 账单金额
- paid_amount: 已付金额
- status: 状态 (draft/open/paid/uncollectible/void)
- due_date: 到期日
- paid_at: 支付时间
- billing_period: 账期描述

**refunds 表**
- id: 主键，UUID
- invoice_id: 账单ID
- user_id: 用户ID
- amount: 退款金额
- reason_code: 退款原因编码
- reason: 退款原因描述
- note: 备注
- status: 状态 (pending/approved/rejected/processed)
- review_note: 审核备注

**change_logs 表**
- id: 主键，UUID
- subscription_id: 订阅ID
- type: 变更类型 (upgrade/downgrade/cancel/reactivate)
- old_value: 旧值 (JSON)
- new_value: 新值 (JSON)
- note: 变更备注
- result: 处理结果
- created_at: 创建时间
