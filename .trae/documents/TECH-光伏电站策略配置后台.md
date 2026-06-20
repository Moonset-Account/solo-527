## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层 (React + Ant Design)"
        A["页面层: 首页/告警/策略/收益/补贴/表计"]
        B["组件层: 表格/表单/图表/状态标签"]
        C["状态管理: Zustand"]
        D["API层: Axios 请求封装"]
    end

    subgraph "后端层 (Express + TypeScript)"
        E["路由层: RESTful API"]
        F["中间件: 鉴权/日志/异常处理"]
        G["服务层: 业务逻辑处理"]
        H["Prisma ORM: 数据访问层"]
    end

    subgraph "数据层"
        I["MySQL: 业务数据存储"]
        J["Prisma Schema: 数据模型定义"]
    end

    subgraph "外部服务"
        K["设备告警接入 API"]
        L["通知推送服务"]
        M["ECharts: 图表渲染"]
    end

    A --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    G --> K
    G --> L
    A --> M
```

## 2. 技术描述

- **前端框架**: React@18 + TypeScript
- **UI 组件库**: Ant Design@5
- **状态管理**: Zustand@4
- **路由管理**: React Router DOM@6
- **HTTP 客户端**: Axios@1
- **图表库**: ECharts@5 + echarts-for-react
- **图标库**: @ant-design/icons + lucide-react
- **构建工具**: Vite@5
- **样式方案**: TailwindCSS@3 + Ant Design 主题
- **后端框架**: Express@4 + TypeScript
- **ORM**: Prisma@5
- **数据库**: MySQL@8
- **开发语言**: TypeScript 严格模式

## 3. 路由定义

### 前端路由

| 路由路径 | 页面名称 | 说明 |
|----------|----------|------|
| / | 首页仪表盘 | 关键指标概览、告警统计、收益趋势 |
| /alerts | 设备告警列表 | 告警列表、筛选、状态操作 |
| /alerts/:id | 设备告警详情 | 告警详情、处理记录 |
| /strategies | 策略配置列表 | 策略列表、启停控制 |
| /strategies/create | 创建策略 | 策略表单编辑 |
| /strategies/:id/edit | 编辑策略 | 策略表单编辑 |
| /revenue | 储能收益总览 | 收益概览、趋势分析 |
| /revenue/detail | 储能收益明细 | 下钻明细、缺口分析 |
| /subsidies | 补贴记录列表 | 补贴记录、筛选查询 |
| /meters | 表计分区列表 | 分区列表、设备关联 |

### 后端 API 路由

| 方法 | 路由路径 | 说明 |
|------|----------|------|
| GET | /api/dashboard/stats | 获取首页统计数据 |
| GET | /api/dashboard/trends | 获取趋势数据 |
| GET | /api/alerts | 获取告警列表 |
| GET | /api/alerts/:id | 获取告警详情 |
| PUT | /api/alerts/:id/status | 更新告警状态 |
| POST | /api/alerts/webhook | 设备告警 webhook 接入 |
| GET | /api/strategies | 获取策略列表 |
| GET | /api/strategies/:id | 获取策略详情 |
| POST | /api/strategies | 创建策略 |
| PUT | /api/strategies/:id | 更新策略 |
| PUT | /api/strategies/:id/toggle | 启停策略 |
| GET | /api/revenue/summary | 收益总览 |
| GET | /api/revenue/details | 收益明细 |
| GET | /api/revenue/gaps | 数据缺口分析 |
| GET | /api/subsidies | 补贴记录列表 |
| GET | /api/meters | 表计分区列表 |

## 4. API 定义

### 类型定义

```typescript
// 告警状态枚举
type AlertStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ABNORMAL_CLOSED';

// 告警级别
type AlertLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

// 策略状态
type StrategyStatus = 'ACTIVE' | 'INACTIVE';

// 设备告警
interface DeviceAlert {
  id: string;
  deviceId: string;
  deviceName: string;
  alertLevel: AlertLevel;
  alertType: string;
  title: string;
  description: string;
  status: AlertStatus;
  handlerId?: string;
  handlerName?: string;
  responseDuration?: number;
  createdAt: string;
  updatedAt: string;
  processingLogs: ProcessingLog[];
}

// 处理记录
interface ProcessingLog {
  id: string;
  alertId: string;
  operatorId: string;
  operatorName: string;
  action: string;
  remark: string;
  timestamp: string;
}

// 运行策略
interface Strategy {
  id: string;
  name: string;
  description: string;
  triggerCondition: Record<string, any>;
  action: Record<string, any>;
  status: StrategyStatus;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 储能收益
interface RevenueRecord {
  id: string;
  date: string;
  zoneId: string;
  zoneName: string;
  deviceId?: string;
  deviceName?: string;
  chargeEnergy: number;
  dischargeEnergy: number;
  revenue: number;
  subsidy: number;
  hasGap: boolean;
  gapReason?: string;
  gapDuration?: number;
  responsiblePerson?: string;
  createdAt: string;
}

// 补贴记录
interface SubsidyRecord {
  id: string;
  period: string;
  type: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
  description: string;
  createdAt: string;
}

// 表计分区
interface MeterZone {
  id: string;
  name: string;
  code: string;
  location: string;
  deviceCount: number;
  onlineCount: number;
  totalCapacity: number;
  status: 'NORMAL' | 'WARNING' | 'ERROR';
}
```

### 请求响应示例

**GET /api/alerts**
```typescript
// Query: { page: 1, pageSize: 20, status?: AlertStatus, level?: AlertLevel, deviceId?: string }
// Response:
{
  data: DeviceAlert[],
  total: number,
  page: number,
  pageSize: number
}
```

**PUT /api/alerts/:id/status**
```typescript
// Body: { status: AlertStatus, remark: string, operatorId: string }
// Response:
{
  success: boolean,
  data: DeviceAlert
}
```

## 5. 服务器架构图

```mermaid
graph LR
    A["HTTP 请求"] --> B["Express 服务器"]
    B --> C["中间件层"]
    C --> C1["CORS 处理"]
    C --> C2["日志中间件"]
    C --> C3["错误处理"]
    C --> D["路由层"]
    D --> D1["告警路由 /api/alerts"]
    D --> D2["策略路由 /api/strategies"]
    D --> D3["收益路由 /api/revenue"]
    D --> D4["其他路由"]
    D --> E["服务层"]
    E --> E1["AlertService"]
    E --> E2["StrategyService"]
    E --> E3["RevenueService"]
    E --> E4["NotificationService"]
    E --> F["Prisma Client"]
    F --> G["MySQL 数据库"]
    E --> H["外部服务"]
    H --> H1["设备告警 Webhook"]
    H --> H2["推送通知"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    DEVICE_ALERT ||--o{ PROCESSING_LOG : has
    DEVICE_ALERT }o--|| USER : handled_by
    STRATEGY }o--|| USER : created_by
    REVENUE_RECORD }o--|| METER_ZONE : belongs_to
    REVENUE_RECORD }o--o| DEVICE : belongs_to
    METER_ZONE ||--o{ DEVICE : contains
    SUBSIDY_RECORD }o--|| METER_ZONE : belongs_to

    DEVICE_ALERT {
        string id PK
        string device_id FK
        string device_name
        string alert_level
        string alert_type
        string title
        string description
        string status
        string handler_id FK
        int response_duration_seconds
        datetime created_at
        datetime updated_at
    }

    PROCESSING_LOG {
        string id PK
        string alert_id FK
        string operator_id FK
        string operator_name
        string action
        string remark
        datetime timestamp
    }

    STRATEGY {
        string id PK
        string name
        string description
        json trigger_condition
        json action
        string status
        int version
        string created_by FK
        datetime created_at
        datetime updated_at
    }

    REVENUE_RECORD {
        string id PK
        date date
        string zone_id FK
        string device_id FK
        decimal charge_energy
        decimal discharge_energy
        decimal revenue
        decimal subsidy
        boolean has_gap
        string gap_reason
        int gap_duration_seconds
        string responsible_person
        datetime created_at
    }

    METER_ZONE {
        string id PK
        string name
        string code
        string location
        int device_count
        decimal total_capacity
        string status
        datetime created_at
    }

    DEVICE {
        string id PK
        string name
        string code
        string type
        string zone_id FK
        string status
        datetime created_at
    }

    SUBSIDY_RECORD {
        string id PK
        string period
        string type
        decimal amount
        string status
        string zone_id FK
        string description
        datetime created_at
    }

    USER {
        string id PK
        string username
        string name
        string role
        datetime created_at
    }
```

### 6.2 Prisma Schema 定义

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum AlertStatus {
  PENDING
  PROCESSING
  COMPLETED
  ABNORMAL_CLOSED
}

enum AlertLevel {
  INFO
  WARNING
  ERROR
  CRITICAL
}

enum StrategyStatus {
  ACTIVE
  INACTIVE
}

enum UserRole {
  ADMIN
  OPERATOR
  ANALYST
}

model User {
  id        String   @id @default(cuid())
  username  String   @unique
  name      String
  role      UserRole @default(OPERATOR)
  createdAt DateTime @default(now())
  alerts    DeviceAlert[]
  strategies Strategy[]
  logs      ProcessingLog[]
}

model Device {
  id        String   @id @default(cuid())
  name      String
  code      String   @unique
  type      String
  zoneId    String
  status    String
  createdAt DateTime @default(now())
  zone      MeterZone @relation(fields: [zoneId], references: [id])
  alerts    DeviceAlert[]
  revenueRecords RevenueRecord[]
}

model MeterZone {
  id            String   @id @default(cuid())
  name          String
  code          String   @unique
  location      String
  deviceCount   Int      @default(0)
  totalCapacity Decimal  @default(0) @db.Decimal(10, 2)
  status        String   @default("NORMAL")
  createdAt     DateTime @default(now())
  devices       Device[]
  revenueRecords RevenueRecord[]
  subsidies     SubsidyRecord[]
}

model DeviceAlert {
  id                  String          @id @default(cuid())
  deviceId            String
  deviceName          String
  alertLevel          AlertLevel
  alertType           String
  title               String
  description         String
  status              AlertStatus     @default(PENDING)
  handlerId           String?
  responseDurationSeconds Int?
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  handler             User?           @relation(fields: [handlerId], references: [id])
  processingLogs      ProcessingLog[]
}

model ProcessingLog {
  id           String   @id @default(cuid())
  alertId      String
  operatorId   String
  operatorName String
  action       String
  remark       String
  timestamp    DateTime @default(now())
  alert        DeviceAlert @relation(fields: [alertId], references: [id])
  operator     User     @relation(fields: [operatorId], references: [id])
}

model Strategy {
  id               String         @id @default(cuid())
  name             String
  description      String
  triggerCondition Json
  action           Json
  status           StrategyStatus @default(ACTIVE)
  version          Int            @default(1)
  createdById      String
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  createdBy        User           @relation(fields: [createdById], references: [id])
}

model RevenueRecord {
  id                   String   @id @default(cuid())
  date                 DateTime
  zoneId               String
  deviceId             String?
  chargeEnergy         Decimal  @db.Decimal(10, 4)
  dischargeEnergy      Decimal  @db.Decimal(10, 4)
  revenue              Decimal  @db.Decimal(10, 2)
  subsidy              Decimal  @default(0) @db.Decimal(10, 2)
  hasGap               Boolean  @default(false)
  gapReason            String?
  gapDurationSeconds   Int?
  responsiblePerson    String?
  createdAt            DateTime @default(now())
  zone                 MeterZone @relation(fields: [zoneId], references: [id])
  device               Device?  @relation(fields: [deviceId], references: [id])
}

model SubsidyRecord {
  id          String   @id @default(cuid())
  period      String
  type        String
  amount      Decimal  @db.Decimal(10, 2)
  status      String   @default("PENDING")
  zoneId      String
  description String
  createdAt   DateTime @default(now())
  zone        MeterZone @relation(fields: [zoneId], references: [id])
}
```
