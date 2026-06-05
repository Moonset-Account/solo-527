# 校园戏剧社排练和票务管理系统 - 技术架构文档

## 1. 整体架构设计

```mermaid
graph TB
    subgraph "客户端层"
        A["Web 浏览器 (Desktop)"]
        B["移动端浏览器 (Mobile)"]
        C["PWA 离线支持"]
    end
    
    subgraph "前端层 (Next.js)"
        D["Pages Router / App Router"]
        E["React Components (UI)"]
        F["State Management (Zustand)"]
        G["API Routes (Serverless)"]
        H["Middleware (Auth/RBAC)"]
    end
    
    subgraph "服务层"
        I["Next.js API Routes"]
        J["NextAuth.js (认证)"]
        K["Background Jobs (BullMQ)"]
        L["File Upload Service"]
        M["Notification Service"]
    end
    
    subgraph "数据层"
        N["PostgreSQL"]
        O["Prisma ORM"]
        P["Redis (缓存/队列)"]
        Q["文件存储 (本地/S3)"]
    end
    
    subgraph "基础设施"
        R["Docker Compose"]
        S["Nginx (反向代理)"]
        T["Prometheus + Grafana (监控)"]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    D --> F
    D --> G
    G --> H
    H --> I
    I --> J
    I --> K
    I --> L
    I --> M
    I --> O
    O --> N
    K --> P
    L --> Q
    M --> P
    R --> N
    R --> P
    R --> D
    T --> R
```

## 2. 技术栈说明

### 2.1 核心技术栈
| 类别 | 技术选型 | 版本 | 用途 |
|------|----------|------|------|
| 前端框架 | Next.js | 14.x | 全栈 React 框架，支持 SSR/SSG |
| UI 框架 | React | 18.x | 组件化开发 |
| 样式方案 | TailwindCSS | 3.x | 原子化 CSS |
| UI 组件 | shadcn/ui | latest | 高质量组件库 |
| 状态管理 | Zustand | 4.x | 轻量级状态管理 |
| 表单校验 | react-hook-form + zod | latest | 表单处理与校验 |
| 认证方案 | NextAuth.js | 5.x | 身份认证与会话管理 |
| 数据库 | PostgreSQL | 15.x | 关系型数据存储 |
| ORM | Prisma | 5.x | 数据库访问层 |
| 缓存/队列 | Redis | 7.x | 缓存、后台任务队列 |
| 后台任务 | BullMQ | latest | 异步任务处理 |
| 文件上传 | multer / uploadthing | latest | 文件上传处理 |
| 二维码 | qrcode / jsqr | latest | 二维码生成与扫描 |
| 图表 | recharts | latest | 数据可视化 |
| 导出 | exceljs / jspdf | latest | Excel/PDF 报表导出 |
| 测试 | Jest + React Testing Library | latest | 单元测试与集成测试 |
| 容器化 | Docker + Docker Compose | latest | 部署与环境一致性 |

### 2.2 项目初始化工具
- `create-next-app@latest` 初始化 Next.js 项目
- TypeScript 作为开发语言
- ESLint + Prettier 代码规范

## 3. 路由定义

### 3.1 前端路由 (App Router)

| 路由路径 | 页面名称 | 权限要求 |
|----------|----------|----------|
| `/` | 首页/公共剧目展示 | 公开 |
| `/login` | 登录页 | 公开 |
| `/register` | 注册页 | 公开 |
| `/dashboard` | 仪表盘 | 已登录 |
| `/productions` | 剧目列表 | 已登录 |
| `/productions/[id]` | 剧目详情 | 已登录 |
| `/productions/[id]/roles` | 角色管理 | 导演/干事/管理员 |
| `/productions/[id]/rehearsals` | 排练计划 | 已登录 |
| `/productions/[id]/tickets` | 票务设置 | 干事/管理员 |
| `/rehearsals/calendar` | 排练日历 | 已登录 |
| `/venues` | 场地管理 | 干事/管理员 |
| `/leaves` | 请假管理 | 已登录 |
| `/tickets/shows` | 演出场次 | 公开/已登录 |
| `/tickets/shows/[id]/select` | 在线选座 | 已登录 |
| `/tickets/orders` | 我的订单 | 已登录 |
| `/tickets/scan` | 扫码验票 | 票务/干事/管理员 |
| `/tickets/waitlist` | 候补名单 | 干事/管理员 |
| `/finance/records` | 财务记录 | 干事/管理员 |
| `/finance/reports` | 报表中心 | 干事/管理员 |
| `/admin/users` | 用户管理 | 管理员 |
| `/admin/roles` | 角色权限 | 管理员 |
| `/admin/audit-logs` | 操作日志 | 管理员 |
| `/notifications` | 消息中心 | 已登录 |
| `/profile` | 个人中心 | 已登录 |

### 3.2 API 路由前缀
- `/api/auth/*` - NextAuth 认证接口
- `/api/v1/*` - 业务 API 接口

## 4. API 接口定义

### 4.1 核心类型定义

```typescript
// 用户相关
interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  studentId?: string;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

type UserRole = 'SUPER_ADMIN' | 'COMMITTEE' | 'DIRECTOR' | 'ACTOR' | 'TICKET_STAFF' | 'USER';

// 剧目相关
interface Production {
  id: string;
  title: string;
  description: string;
  poster?: string;
  author?: string;
  director?: string;
  status: 'DRAFT' | 'REHEARSING' | 'PERFORMING' | 'COMPLETED';
  startDate: Date;
  endDate: Date;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

// 角色
interface Character {
  id: string;
  name: string;
  description?: string;
  productionId: string;
  actorId?: string;
  order: number;
}

// 排练场地
interface Venue {
  id: string;
  name: string;
  location: string;
  capacity: number;
  type: 'REHEARSAL' | 'PERFORMANCE';
  facilities?: string;
  isActive: boolean;
}

// 排练计划
interface Rehearsal {
  id: string;
  productionId: string;
  venueId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  content?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdById: string;
  conflictCheckStatus: 'PENDING' | 'PASSED' | 'FAILED';
}

// 演员课程表
interface CourseSchedule {
  id: string;
  userId: string;
  dayOfWeek: number; // 0-6
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  courseName: string;
  semester: string;
}

// 请假申请
interface LeaveRequest {
  id: string;
  rehearsalId: string;
  userId: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedById?: string;
  approvedAt?: Date;
  createdAt: Date;
}

// 演出场次
interface Show {
  id: string;
  productionId: string;
  venueId: string;
  startTime: Date;
  endTime: Date;
  isSaleOpen: boolean;
  seatMapConfig: JSON;
}

// 票档
interface TicketTier {
  id: string;
  showId: string;
  name: string;
  price: number;
  color: string;
  totalSeats: number;
  soldSeats: number;
}

// 座位
interface Seat {
  id: string;
  showId: string;
  row: string;
  number: number;
  tierId: string;
  status: 'AVAILABLE' | 'HELD' | 'SOLD' | 'RESERVED';
  orderId?: string;
}

// 订单
interface Order {
  id: string;
  orderNo: string;
  userId: string;
  showId: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
  totalAmount: number;
  paidAt?: Date;
  createdAt: Date;
}

// 电子票
interface Ticket {
  id: string;
  orderId: string;
  seatId: string;
  qrCode: string;
  isCheckedIn: boolean;
  checkedInAt?: Date;
}

// 换座记录
interface SeatChangeLog {
  id: string;
  ticketId: string;
  oldSeatId: string;
  newSeatId: string;
  operatorId: string;
  reason?: string;
  createdAt: Date;
}

// 候补名单
interface WaitlistEntry {
  id: string;
  showId: string;
  userId: string;
  tierId: string;
  position: number;
  status: 'WAITING' | 'OFFERED' | 'CONVERTED' | 'EXPIRED';
  createdAt: Date;
}

// 财务记录
interface FinanceRecord {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  description: string;
  relatedOrderId?: string;
  receiptUrl?: string;
  recordedById: string;
  recordedAt: Date;
}

// 通知
interface Notification {
  id: string;
  userId: string;
  type: 'SYSTEM' | 'REHEARSAL' | 'TICKET' | 'LEAVE' | 'FINANCE';
  title: string;
  content: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: Date;
}

// 操作日志
interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: JSON;
  newValue?: JSON;
  ipAddress?: string;
  createdAt: Date;
}
```

### 4.2 主要 API 接口

| HTTP 方法 | 路径 | 描述 | 权限 |
|-----------|------|------|------|
| GET | `/api/v1/productions` | 获取剧目列表 | 已登录 |
| POST | `/api/v1/productions` | 创建剧目 | 干事/管理员 |
| GET | `/api/v1/productions/:id` | 获取剧目详情 | 已登录 |
| PUT | `/api/v1/productions/:id` | 更新剧目 | 干事/管理员 |
| POST | `/api/v1/productions/:id/roles` | 添加角色 | 导演/干事 |
| GET | `/api/v1/rehearsals` | 获取排练列表 | 已登录 |
| POST | `/api/v1/rehearsals` | 创建排练 | 导演/干事 |
| POST | `/api/v1/rehearsals/check-conflicts` | 检测冲突 | 导演/干事 |
| GET | `/api/v1/venues` | 获取场地列表 | 已登录 |
| POST | `/api/v1/venues` | 创建场地 | 干事/管理员 |
| POST | `/api/v1/leaves` | 提交请假 | 已登录 |
| PUT | `/api/v1/leaves/:id/approve` | 审批请假 | 导演/干事 |
| GET | `/api/v1/shows` | 获取演出场次 | 公开 |
| GET | `/api/v1/shows/:id/seats` | 获取座位图 | 已登录 |
| POST | `/api/v1/orders` | 创建订单 | 已登录 |
| POST | `/api/v1/orders/:id/pay` | 支付订单 | 已登录 |
| POST | `/api/v1/tickets/scan` | 扫码验票 | 票务/干事 |
| POST | `/api/v1/tickets/change-seat` | 换座 | 票务/干事 |
| GET | `/api/v1/finance/records` | 获取财务记录 | 干事/管理员 |
| POST | `/api/v1/finance/records` | 创建财务记录 | 干事/管理员 |
| GET | `/api/v1/finance/reports` | 生成财务报表 | 干事/管理员 |
| GET | `/api/v1/admin/users` | 获取用户列表 | 管理员 |
| PUT | `/api/v1/admin/users/:id/role` | 分配角色 | 管理员 |
| GET | `/api/v1/notifications` | 获取通知列表 | 已登录 |
| POST | `/api/v1/notifications/read` | 标记已读 | 已登录 |

## 5. 服务器架构

```mermaid
graph TD
    subgraph "API Layer"
        A["Next.js Route Handlers"] --> B["Auth Middleware (NextAuth)"]
        B --> C["RBAC Permission Check"]
        C --> D["Request Validation (Zod)"]
    end
    
    subgraph "Service Layer"
        D --> E["ProductionService"]
        D --> F["RehearsalService"]
        D --> G["TicketService"]
        D --> H["FinanceService"]
        D --> I["NotificationService"]
        D --> J["UserService"]
    end
    
    subgraph "Domain Logic"
        E --> K["Business Rules"]
        F --> K
        G --> K
        H --> K
    end
    
    subgraph "Data Access Layer"
        K --> L["Prisma Client"]
        L --> M[("PostgreSQL")]
    end
    
    subgraph "Cross-Cutting Concerns"
        N["Audit Logging"]
        O["Cache (Redis)"]
        P["Background Jobs (BullMQ)"]
        Q["File Storage"]
    end
    
    E --> N
    F --> N
    G --> N
    H --> N
    E --> O
    F --> O
    G --> O
    I --> P
    G --> P
    L --> Q
```

## 6. 数据模型设计

### 6.1 ER 图

```mermaid
erDiagram
    User ||--o{ Production : "creates"
    User ||--o{ Character : "plays"
    User ||--o{ Rehearsal : "attends"
    User ||--o{ LeaveRequest : "submits"
    User ||--o{ Order : "places"
    User ||--o{ FinanceRecord : "records"
    User ||--o{ Notification : "receives"
    User ||--o{ CourseSchedule : "has"
    
    Production ||--o{ Character : "contains"
    Production ||--o{ Rehearsal : "has"
    Production ||--o{ Show : "has"
    
    Venue ||--o{ Rehearsal : "hosts"
    Venue ||--o{ Show : "hosts"
    
    Rehearsal ||--o{ LeaveRequest : "has"
    
    Show ||--o{ TicketTier : "has"
    Show ||--o{ Seat : "has"
    Show ||--o{ WaitlistEntry : "has"
    
    TicketTier ||--o{ Seat : "classifies"
    
    Order ||--o{ Ticket : "contains"
    Order ||--o{ FinanceRecord : "relates"
    
    Seat ||--o| Ticket : "assigned to"
    Seat ||--o| SeatChangeLog : "changed from"
    Seat ||--o| SeatChangeLog : "changed to"
    
    Ticket ||--o{ SeatChangeLog : "has"
    
    UserRole {
        string id PK
        string name
        json permissions
    }
    
    AuditLog {
        string id PK
        string userId FK
        string action
        string entity
        string entityId
        json oldValue
        json newValue
        string ipAddress
        datetime createdAt
    }
```

### 6.2 数据库 DDL (核心表)

```sql
-- 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    student_id VARCHAR(50),
    department VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 剧目表
CREATE TABLE productions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    poster_url VARCHAR(500),
    author VARCHAR(100),
    director VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    start_date DATE,
    end_date DATE,
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_productions_status ON productions(status);
CREATE INDEX idx_productions_created_by ON productions(created_by_id);

-- 角色表
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id),
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_characters_production ON characters(production_id);
CREATE INDEX idx_characters_actor ON characters(actor_id);

-- 场地表
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    capacity INTEGER NOT NULL DEFAULT 0,
    type VARCHAR(20) NOT NULL DEFAULT 'REHEARSAL',
    facilities TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 排练表
CREATE TABLE rehearsals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id),
    title VARCHAR(200) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    content TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    created_by_id UUID NOT NULL REFERENCES users(id),
    conflict_check_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rehearsals_time ON rehearsals(start_time, end_time);
CREATE INDEX idx_rehearsals_venue ON rehearsals(venue_id);
CREATE INDEX idx_rehearsals_production ON rehearsals(production_id);

-- 课程表
CREATE TABLE course_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, day_of_week, start_time, end_time, semester)
);

-- 请假表
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rehearsal_id UUID NOT NULL REFERENCES rehearsals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approved_by_id UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leaves_rehearsal ON leave_requests(rehearsal_id);
CREATE INDEX idx_leaves_user ON leave_requests(user_id);

-- 演出场次表
CREATE TABLE shows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_sale_open BOOLEAN NOT NULL DEFAULT false,
    seat_map_config JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shows_time ON shows(start_time);

-- 票档表
CREATE TABLE ticket_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    color VARCHAR(20),
    total_seats INTEGER NOT NULL DEFAULT 0,
    sold_seats INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 座位表
CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    row_label VARCHAR(10) NOT NULL,
    seat_number INTEGER NOT NULL,
    tier_id UUID NOT NULL REFERENCES ticket_tiers(id),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    order_id UUID,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(show_id, row_label, seat_number)
);

CREATE INDEX idx_seats_show ON seats(show_id);
CREATE INDEX idx_seats_status ON seats(status);

-- 订单表
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_no VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    show_id UUID NOT NULL REFERENCES shows(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- 电子票表
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id),
    qr_code VARCHAR(100) UNIQUE NOT NULL,
    is_checked_in BOOLEAN NOT NULL DEFAULT false,
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_qr ON tickets(qr_code);

-- 换座记录表
CREATE TABLE seat_change_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    old_seat_id UUID NOT NULL REFERENCES seats(id),
    new_seat_id UUID NOT NULL REFERENCES seats(id),
    operator_id UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 候补名单表
CREATE TABLE waitlist_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    tier_id UUID NOT NULL REFERENCES ticket_tiers(id),
    position INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_waitlist_show ON waitlist_entries(show_id, position);

-- 财务记录表
CREATE TABLE finance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(10) NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    related_order_id UUID REFERENCES orders(id),
    receipt_url VARCHAR(500),
    recorded_by_id UUID NOT NULL REFERENCES users(id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_finance_type ON finance_records(type);
CREATE INDEX idx_finance_date ON finance_records(recorded_at);

-- 通知表
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    related_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- 操作日志表
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

## 7. 部署架构

### 7.1 Docker Compose 服务

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/drama
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=drama
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
```

## 8. 后台任务与消息队列

### 8.1 后台任务类型
1. **排练提醒**：排练前 2 小时发送通知
2. **候补通知**：座位释放时按队列通知候补用户
3. **订单超时取消**：30 分钟未支付自动取消
4. **报表生成**：异步生成大型报表
5. **数据同步**：离线数据批量同步处理

### 8.2 通知渠道
- 站内消息
- 邮件通知 (可选)
- 微信/短信 (可选集成)
