## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        "Remix SSR 客户端" --> "Remix Route Loader/Action"
    end
    subgraph "后端层"
        "Remix Route Loader/Action" --> "Express API Server"
        "Express API Server" --> "业务服务层 Service"
    end
    subgraph "数据层"
        "业务服务层 Service" --> "MongoDB 主数据库"
        "业务服务层 Service" --> "Redis 缓存"
    end
    subgraph "外部服务"
        "Express API Server" --> "二维码生成服务"
        "Express API Server" --> "数据导出服务"
    end
```

## 2. 技术说明

- **前端**：Remix@2 + TailwindCSS@3 + React@18
- **初始化工具**：npx create-remix
- **后端**：Express@4（作为 Remix 的自定义服务器）
- **数据库**：MongoDB（Mongoose ODM）
- **缓存**：Redis（ioredis，用于会话、缓存、异常提醒队列）
- **二维码**：qrcode 库
- **导出**：xlsx 库生成 Excel
- **图表**：Recharts
- **图标**：Lucide React

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| `/` | 仪表盘首页，生产概览和待办提醒 |
| `/plots` | 地块列表 |
| `/plots/new` | 新增地块 |
| `/plots/:id` | 地块详情/编辑 |
| `/varieties` | 品种列表 |
| `/varieties/new` | 新增品种 |
| `/varieties/:id` | 品种详情/编辑 |
| `/farm-records` | 农事记录列表 |
| `/farm-records/new` | 新增农事记录 |
| `/farm-records/:id` | 农事记录详情/审核 |
| `/harvests` | 采收记录列表 |
| `/harvests/new` | 新增采收记录 |
| `/harvests/:id` | 采收批次详情（含溯源链路） |
| `/sorting-orders` | 分拣订单列表 |
| `/sorting-orders/new` | 新增分拣订单 |
| `/sorting-orders/:id` | 分拣订单详情/执行 |
| `/traceability/:batchNo` | 溯源二维码详情页（公开） |
| `/orders` | 订单履约列表 |
| `/orders/new` | 新增销售订单 |
| `/orders/:id` | 订单详情/履约追踪 |
| `/declarations` | 申报材料清单 |
| `/declarations/:id` | 材料详情/备注/处理结果 |
| `/admin/roles` | 角色权限管理 |
| `/admin/logs` | 操作日志 |
| `/admin/export` | 数据导出 |
| `/admin/alerts` | 异常提醒配置 |
| `/login` | 登录页面 |

## 4. API 定义

### 4.1 认证

```typescript
POST /api/auth/login
  Body: { username: string; password: string }
  Response: { token: string; user: User }

POST /api/auth/logout
  Header: Authorization: Bearer <token>
  Response: { success: boolean }
```

### 4.2 地块

```typescript
GET    /api/plots              Response: Plot[]
POST   /api/plots              Body: CreatePlotDTO  Response: Plot
GET    /api/plots/:id          Response: Plot
PUT    /api/plots/:id          Body: UpdatePlotDTO  Response: Plot
DELETE /api/plots/:id          Response: { success: boolean }
```

### 4.3 品种

```typescript
GET    /api/varieties           Response: Variety[]
POST   /api/varieties           Body: CreateVarietyDTO  Response: Variety
GET    /api/varieties/:id       Response: Variety
PUT    /api/varieties/:id       Body: UpdateVarietyDTO  Response: Variety
DELETE /api/varieties/:id       Response: { success: boolean }
```

### 4.4 农事记录

```typescript
GET    /api/farm-records              Response: FarmRecord[]
POST   /api/farm-records              Body: CreateFarmRecordDTO   Response: FarmRecord
GET    /api/farm-records/:id          Response: FarmRecord
PUT    /api/farm-records/:id          Body: UpdateFarmRecordDTO   Response: FarmRecord
POST   /api/farm-records/:id/review   Body: { status: 'approved'|'rejected'; remark?: string }
DELETE /api/farm-records/:id          Response: { success: boolean }
```

### 4.5 采收记录

```typescript
GET    /api/harvests              Response: Harvest[]
POST   /api/harvests              Body: CreateHarvestDTO   Response: Harvest
GET    /api/harvests/:id          Response: Harvest
PUT    /api/harvests/:id          Body: UpdateHarvestDTO   Response: Harvest
DELETE /api/harvests/:id          Response: { success: boolean }
GET    /api/harvests/:id/trace    Response: TraceChain
```

### 4.6 分拣订单

```typescript
GET    /api/sorting-orders              Response: SortingOrder[]
POST   /api/sorting-orders              Body: CreateSortingOrderDTO   Response: SortingOrder
GET    /api/sorting-orders/:id          Response: SortingOrder
PUT    /api/sorting-orders/:id          Body: UpdateSortingOrderDTO   Response: SortingOrder
POST   /api/sorting-orders/:id/complete Body: { grades: GradeResult[] }
DELETE /api/sorting-orders/:id          Response: { success: boolean }
```

### 4.7 溯源

```typescript
GET  /api/traceability/:batchNo   Response: TraceChain
POST /api/traceability/generate   Body: { harvestId: string }  Response: { qrCodeUrl: string; batchNo: string }
```

### 4.8 订单履约

```typescript
GET    /api/orders              Response: Order[]
POST   /api/orders              Body: CreateOrderDTO   Response: Order
GET    /api/orders/:id          Response: Order
PUT    /api/orders/:id          Body: UpdateOrderDTO   Response: Order
GET    /api/orders/:id/fulfillment  Response: FulfillmentStats
POST   /api/orders/:id/ship    Body: { sortingOrderId: string; quantity: number }
DELETE /api/orders/:id          Response: { success: boolean }
```

### 4.9 申报材料

```typescript
GET    /api/declarations              Response: Declaration[]
POST   /api/declarations              Body: CreateDeclarationDTO   Response: Declaration
GET    /api/declarations/:id          Response: Declaration
PUT    /api/declarations/:id          Body: { status: string; remark?: string; result?: string }  Response: Declaration
GET    /api/declarations/stats        Response: { total: number; complete: number; missing: number }
```

### 4.10 系统

```typescript
GET    /api/admin/roles           Response: Role[]
POST   /api/admin/roles           Body: CreateRoleDTO  Response: Role
PUT    /api/admin/roles/:id       Body: UpdateRoleDTO  Response: Role
GET    /api/admin/logs            Response: AuditLog[]
POST   /api/admin/export          Body: { type: string; dateRange: [string, string] }  Response: Buffer
GET    /api/admin/alerts          Response: AlertRule[]
PUT    /api/admin/alerts/:id      Body: UpdateAlertRuleDTO  Response: AlertRule
```

### 4.11 仪表盘

```typescript
GET /api/dashboard/overview    Response: DashboardOverview
GET /api/dashboard/todos       Response: TodoItem[]
GET /api/dashboard/alerts      Response: AlertItem[]
GET /api/dashboard/harvest-trend  Response: { date: string; amount: number }[]
```

## 5. 服务端架构图

```mermaid
graph LR
    "Controller 路由层" --> "Service 业务层"
    "Service 业务层" --> "Repository 数据层"
    "Repository 数据层" --> "MongoDB"
    "Service 业务层" --> "Redis 缓存"
    "Service 业务层" --> "日志中间件"
    "Service 业务层" --> "异常提醒引擎"
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    "User" ||--o{ "FarmRecord" : creates
    "User" ||--o{ "Harvest" : records
    "Plot" ||--o{ "FarmRecord" : has
    "Plot" ||--o{ "Harvest" : produces
    "Variety" ||--o{ "FarmRecord" : associated
    "Variety" ||--o{ "Harvest" : associated
    "Harvest" ||--o{ "SortingOrder" : supplies
    "Harvest" ||--|| "Traceability" : generates
    "SortingOrder" ||--o{ "Order" : fulfills
    "Order" ||--o{ "Shipment" : ships
    "Declaration" }o--|| "Harvest" : relates

    "User" {
        "ObjectId _id" PK
        "string username" UK
        "string password"
        "string name"
        "ObjectId role" FK
        "boolean active"
        "Date createdAt"
    }

    "Role" {
        "ObjectId _id" PK
        "string name" UK
        "string[] permissions"
        "Date createdAt"
    }

    "Plot" {
        "ObjectId _id" PK
        "string code" UK
        "string name"
        "number area"
        "string location"
        "string soilType"
        "ObjectId currentVariety" FK
        "string status"
        "string remark"
        "Date createdAt"
        "Date updatedAt"
    }

    "Variety" {
        "ObjectId _id" PK
        "string code" UK
        "string name"
        "string category"
        "number growthCycle"
        "string harvestStandard"
        "number shelfLife"
        "string status"
        "Date createdAt"
        "Date updatedAt"
    }

    "FarmRecord" {
        "ObjectId _id" PK
        "ObjectId plotId" FK
        "ObjectId varietyId" FK
        "string type"
        "string content"
        "number dosage"
        "string unit"
        "ObjectId operator" FK
        "Date operateDate"
        "string[] photos"
        "string status"
        "ObjectId reviewer" FK
        "string reviewRemark"
        "Date reviewDate"
        "Date createdAt"
        "Date updatedAt"
    }

    "Harvest" {
        "ObjectId _id" PK
        "string batchNo" UK
        "ObjectId plotId" FK
        "ObjectId varietyId" FK
        "number quantity"
        "string unit"
        "string qualityGrade"
        "ObjectId harvester" FK
        "Date harvestDate"
        "string remark"
        "Date createdAt"
        "Date updatedAt"
    }

    "SortingOrder" {
        "ObjectId _id" PK
        "string orderNo" UK
        "ObjectId harvestId" FK
        "ObjectId sorter" FK
        "string status"
        "object[] grades"
        "object packaging"
        "ObjectId inspector" FK
        "string inspectResult"
        "Date createdAt"
        "Date updatedAt"
    }

    "Traceability" {
        "ObjectId _id" PK
        "string batchNo" UK
        "ObjectId harvestId" FK
        "string qrCodeUrl"
        "Date createdAt"
    }

    "Order" {
        "ObjectId _id" PK
        "string orderNo" UK
        "string customer"
        "ObjectId varietyId" FK
        "number quantity"
        "string unit"
        "number unitPrice"
        "string status"
        "Date deadline"
        "Date createdAt"
        "Date updatedAt"
    }

    "Shipment" {
        "ObjectId _id" PK
        "ObjectId orderId" FK
        "ObjectId sortingOrderId" FK
        "number quantity"
        "Date shipDate"
        "string trackingNo"
        "Date createdAt"
    }

    "Declaration" {
        "ObjectId _id" PK
        "string name"
        "ObjectId harvestId" FK
        "string status"
        "string remark"
        "string result"
        "Date deadline"
        "Date createdAt"
        "Date updatedAt"
    }

    "AuditLog" {
        "ObjectId _id" PK
        "ObjectId userId" FK
        "string action"
        "string module"
        "string detail"
        "Date createdAt"
    }

    "AlertRule" {
        "ObjectId _id" PK
        "string type"
        "string name"
        "object condition"
        "string[] notifyMethods"
        "boolean active"
        "Date createdAt"
        "Date updatedAt"
    }
```

### 6.2 数据定义语言

```javascript
// MongoDB 索引定义
db.users.createIndex({ username: 1 }, { unique: true })
db.plots.createIndex({ code: 1 }, { unique: true })
db.varieties.createIndex({ code: 1 }, { unique: true })
db.farmrecords.createIndex({ plotId: 1, operateDate: -1 })
db.farmrecords.createIndex({ status: 1 })
db.harvests.createIndex({ batchNo: 1 }, { unique: true })
db.harvests.createIndex({ plotId: 1, harvestDate: -1 })
db.sortingorders.createIndex({ orderNo: 1 }, { unique: true })
db.sortingorders.createIndex({ harvestId: 1 })
db.sortingorders.createIndex({ status: 1 })
db.traceabilities.createIndex({ batchNo: 1 }, { unique: true })
db.orders.createIndex({ orderNo: 1 }, { unique: true })
db.orders.createIndex({ status: 1 })
db.shipments.createIndex({ orderId: 1 })
db.declarations.createIndex({ status: 1 })
db.declarations.createIndex({ harvestId: 1 })
db.auditlogs.createIndex({ userId: 1, createdAt: -1 })
db.auditlogs.createIndex({ module: 1, createdAt: -1 })

// Redis 缓存键设计
// session:{token}         -> 用户会话 (TTL: 24h)
// dashboard:overview      -> 仪表盘概览数据 (TTL: 5min)
// dashboard:harvest-trend -> 采收趋势数据 (TTL: 15min)
// alerts:pending          -> 待处理异常列表 (TTL: 1h)
// declarations:missing    -> 缺失材料列表 (TTL: 30min)
```
