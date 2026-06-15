# 订阅账单逾期提醒系统

基于 Angular、NestJS、PostgreSQL 和 Material UI 构建的完整订阅账单逾期提醒和催收管理系统。

## 功能特性

### 核心业务流程

1. **客户成功视图** - 查看客户应收账单和付款入口
2. **催收节奏配置** - 管理员配置自动化催收规则（按逾期天数、严重程度、渠道）
3. **状态历史追踪** - 完整的应收回款状态变更历史记录
4. **月底核对** - 现金预测、发票申请、催收节奏关联原始记录和附件备注
5. **导出功能** - 下载结果包含对账差异、现金缺口和最近一次变更

### 高级功能

- **查询性能优化** - 12个数据库索引优化常用查询
- **导出队列** - Bull + Redis 异步处理，支持 Excel/CSV/PDF 格式
- **操作日志审计** - 全局拦截器自动记录所有变更操作
- **事件溯源** - 完整的状态历史记录，记录每次变更的字段、原因、操作人
- **工作流引擎** - 催收节奏自动触发（Cron调度 + 逾期天数匹配）

## 技术栈

### 后端

- **框架**: NestJS 10.x
- **ORM**: TypeORM 0.3.x
- **数据库**: PostgreSQL 15
- **队列**: Bull + Redis 7
- **任务调度**: @nestjs/schedule (Cron)
- **导出**: xlsx (Excel), pdfkit (PDF)

### 前端

- **框架**: Angular 17.x
- **UI组件**: Angular Material 17.x
- **响应式编程**: RxJS 7.x
- **日期处理**: date-fns 3.x (中文本地化)
- **样式**: SCSS + Material Design

### 数据库设计

12个核心实体表：

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| `bills` | 账单核心表 | billNumber, totalAmount, remainingAmount, dueDate, status, overdueDays |
| `status_history` | 状态历史表 | billId, fromStatus, toStatus, reason, changedFields, createdBy |
| `collection_rhythms` | 催收节奏配置 | daysOverdue, severity(reminder/warning/urgent/legal), channel, template |
| `collection_records` | 催收记录表 | billId, rhythmId, customerResponse, promisedPaymentDate, notes |
| `cash_forecasts` | 现金预测表 | forecastPeriod, expectedReceivables, projectedCashGap, billBreakdown |
| `reconciliations` | 对账记录表 | period, systemBillsTotal, bankDepositsTotal, totalVariance, matchedItems |
| `export_queues` | 导出队列表 | type, format, status, exportSummary(对账差异/现金缺口/最近变更) |
| `audit_logs` | 操作审计表 | action, entityType, oldValues, newValues, ipAddress, userAgent |
| `customers` | 客户表 | name, email, phone, address |
| `subscriptions` | 订阅表 | planName, price, billingCycle, startDate |
| `invoices` | 发票表 | billId, invoiceNumber, amount, status |
| `attachments` | 附件表 | entityType, entityId, fileName, filePath |

## 快速启动

### 前置要求

- Node.js >= 18.x
- Docker 和 Docker Compose
- npm 或 yarn

### 1. 启动基础设施（PostgreSQL + Redis）

```bash
# 启动 PostgreSQL 和 Redis
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 2. 安装后端依赖并启动

```bash
cd backend

# 复制环境变量配置
cp .env.example .env

# 安装依赖
npm install

# 启动开发服务器（端口 3000）
npm run start:dev

# 初始化种子数据（可选）
npm run seed
```

### 3. 安装前端依赖并启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器（端口 4200）
npm start
```

### 4. 访问应用

- 前端应用: http://localhost:4200
- 后端API: http://localhost:3000/api/v1
- API文档: http://localhost:3000/api/v1/docs (如配置Swagger)

## 项目结构

```
.
├── backend/                          # NestJS 后端
│   ├── src/
│   │   ├── common/                   # 通用模块
│   │   │   ├── decorators/           # @AuditLog 装饰器
│   │   │   ├── interceptors/         # 审计日志拦截器
│   │   │   ├── dto/                  # 分页DTO
│   │   │   └── services/             # 审计日志服务
│   │   ├── database/
│   │   │   ├── entities/             # 12个实体类
│   │   │   ├── typeorm.config.ts     # TypeORM配置
│   │   │   └── seed.ts               # 种子数据
│   │   ├── modules/
│   │   │   ├── bill/                 # 账单管理
│   │   │   ├── collection/           # 催收管理
│   │   │   ├── reconciliation/       # 对账管理
│   │   │   ├── cash-forecast/        # 现金预测
│   │   │   ├── export/               # 导出队列
│   │   │   ├── dashboard/            # 仪表盘
│   │   │   └── ...                   # 其他模块
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
├── frontend/                         # Angular 前端
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/                # 10个页面组件
│   │   │   │   ├── dashboard/        # 仪表盘
│   │   │   │   ├── bills/            # 应收管理（列表+详情）
│   │   │   │   ├── collection/       # 催收管理（节奏+记录）
│   │   │   │   ├── reconciliation/   # 对账管理（列表+详情）
│   │   │   │   ├── cash-forecast/    # 现金预测
│   │   │   │   ├── export/           # 导出队列
│   │   │   │   └── customer-success/ # 客户成功视图
│   │   │   ├── services/             # 7个API服务
│   │   │   ├── pipes/                # 3个自定义管道
│   │   │   ├── app.module.ts
│   │   │   ├── app.routes.ts
│   │   │   └── app.component.ts
│   │   ├── styles.scss               # Material Design 样式
│   │   └── main.ts
│   └── package.json
├── docker-compose.yml                # PostgreSQL + Redis
└── README.md
```

## API 接口文档

### 账单管理 (Bills)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/bills` | 获取账单列表（支持筛选、分页、排序） |
| GET | `/api/v1/bills/:id` | 获取账单详情（含状态历史、催收记录） |
| POST | `/api/v1/bills` | 创建账单 |
| PUT | `/api/v1/bills/:id` | 更新账单 |
| PATCH | `/api/v1/bills/:id/status` | 更新账单状态（自动记录状态历史） |
| POST | `/api/v1/bills/:id/payment` | 登记付款（事务处理） |
| GET | `/api/v1/bills/:id/history` | 获取状态历史 |
| GET | `/api/v1/bills/overdue` | 获取逾期账单 |
| GET | `/api/v1/bills/statistics` | 获取账单统计 |

### 催收管理 (Collection)

#### 催收节奏

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/collection/rhythms` | 获取节奏列表 |
| POST | `/api/v1/collection/rhythms` | 创建催收节奏 |
| PUT | `/api/v1/collection/rhythms/:id` | 更新催收节奏 |
| PATCH | `/api/v1/collection/rhythms/:id/toggle` | 启用/禁用节奏 |
| DELETE | `/api/v1/collection/rhythms/:id` | 删除催收节奏 |

#### 催收记录

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/collection/records` | 获取催收记录列表 |
| POST | `/api/v1/collection/records` | 创建催收记录 |
| PUT | `/api/v1/collection/records/:id` | 更新催收记录 |
| GET | `/api/v1/collection/statistics` | 获取催收统计 |

### 对账管理 (Reconciliation)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/reconciliation` | 获取对账列表 |
| GET | `/api/v1/reconciliation/:id` | 获取对账详情 |
| POST | `/api/v1/reconciliation` | 创建对账周期 |
| POST | `/api/v1/reconciliation/:id/start` | 开始对账 |
| POST | `/api/v1/reconciliation/:id/finalize` | 确认完成对账 |
| GET | `/api/v1/reconciliation/:id/linked-records` | 获取关联记录（账单、现金预测、催收、发票、附件） |
| GET | `/api/v1/reconciliation/statistics` | 获取对账统计 |

### 现金预测 (Cash Forecast)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/cash-forecast` | 获取预测列表 |
| GET | `/api/v1/cash-forecast/:id` | 获取预测详情 |
| POST | `/api/v1/cash-forecast` | 创建预测 |
| GET | `/api/v1/cash-forecast/trend` | 获取历史趋势 |

### 导出队列 (Export)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/exports` | 获取导出队列列表 |
| POST | `/api/v1/exports` | 创建导出任务（异步处理） |
| GET | `/api/v1/exports/:id` | 获取导出任务详情 |
| GET | `/api/v1/exports/:id/download` | 下载导出文件 |
| POST | `/api/v1/exports/:id/retry` | 重试失败的导出 |
| DELETE | `/api/v1/exports/:id` | 取消导出任务 |

### 仪表盘 (Dashboard)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/dashboard/overview` | 获取概览统计 |
| GET | `/api/v1/dashboard/aging-report` | 获取账龄分析报告 |
| GET | `/api/v1/dashboard/monthly-trend` | 获取月度趋势 |

## 核心功能说明

### 1. 状态机与状态历史

账单状态流转：
```
draft → issued → pending → partial → paid
                          ↓
                        overdue → written_off
                          ↓
                        disputed
```

每次状态变更自动创建 `StatusHistory` 记录，包含：
- 变更前后状态 (`fromStatus` → `toStatus`)
- 变更原因 (`reason`)
- 变更字段 (`changedFields`)
- 操作人 (`createdBy`)
- 操作时间 (`createdAt`)

### 2. 催收节奏自动化

每日8点自动执行 `generateCollectionTasks()` Cron任务：
1. 获取所有启用的催收节奏配置
2. 根据 `daysOverdue` 匹配逾期账单
3. 自动创建催收记录，按模板生成消息内容
4. 支持变量替换：`{{customerName}}`、`{{billNumber}}`、`{{amount}}`、`{{dueDate}}`

严重程度与颜色：
- 🔵 **reminder (提醒)**: 逾期 1-15 天，邮件通知
- 🟠 **warning (警告)**: 逾期 16-30 天，短信+邮件
- 🔴 **urgent (紧急)**: 逾期 31-60 天，电话催收
- 🟣 **legal (法务)**: 逾期 60+ 天，上门/法务信函

### 3. 月底核对流程

1. **创建对账周期** - 选择对账月份
2. **开始对账** - 系统自动匹配账单和银行记录
3. **人工处理** - 处理未匹配项，添加差异说明
4. **关联记录** - 关联现金预测、发票、催收记录、附件
5. **确认完成** - 生成对账报告，支持导出

导出摘要自动包含：
- 对账差异 (`reconciliationVariance`)
- 现金缺口 (`cashGap`)
- 最近变更日期 (`lastChangeDate`)
- 总金额、已付金额、逾期金额

### 4. 导出队列机制

使用 Bull + Redis 实现异步导出：
1. 用户创建导出任务，状态为 `pending`
2. 队列处理器 `ExportProcessor` 按顺序处理
3. 处理中状态 `processing`，成功 `completed`，失败 `failed`
4. 支持失败重试（`retryCount` 字段记录重试次数）
5. 导出格式支持：Excel (.xlsx)、CSV (.csv)、PDF (.pdf)

### 5. 操作日志审计

通过 `@AuditLog()` 装饰器 + `AuditLogInterceptor` 自动记录：

```typescript
@Patch(':id/status')
@AuditLog({
  action: 'update_status',
  entityType: 'bill',
  description: '更新账单状态'
})
async updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
  // ...
}
```

记录内容：
- 操作类型、实体类型、实体ID
- 操作人ID、用户名
- 变更前后值 (`oldValues` / `newValues`)
- 变更字段列表
- IP地址、User Agent
- 请求方法、参数、状态码

## 性能优化设计

### 数据库索引

12个索引覆盖所有常用查询场景：

```sql
-- 账单查询优化
CREATE INDEX idx_bill_customer_id ON bills(customer_id);
CREATE INDEX idx_bill_due_date ON bills(due_date);
CREATE INDEX idx_bill_status ON bills(status);

-- 催收记录查询优化
CREATE INDEX idx_collection_bill_id ON collection_records(bill_id);
CREATE INDEX idx_collection_created_at ON collection_records(created_at);

-- 状态历史查询优化
CREATE INDEX idx_status_history_bill_id ON status_history(bill_id);

-- 其他索引...
```

### 查询优化

- 使用 TypeORM QueryBuilder 构建复杂查询，避免 N+1 问题
- 关联查询使用 `leftJoinAndSelect` 预加载关联数据
- 分页查询使用 `skip()` 和 `take()`
- 大数据量导出使用流式处理

## 前端页面导航

```
仪表盘 (/dashboard)
  ├── 统计卡片（应收、已收、逾期、逾期账单数）
  ├── 账龄分析
  ├── 月度趋势
  ├── 最近逾期账单
  └── 最近催收记录

客户成功视图 (/customer-success)
  ├── 客户筛选
  ├── 客户概览卡片
  ├── 客户账单列表（含付款入口）
  ├── 状态历史时间线
  └── 催收记录

应收管理 (/bills)
  ├── 账单列表（筛选、分页、排序）
  └── 账单详情 (/bills/:id)
      ├── 基本信息
      ├── 状态历史时间线
      ├── 催收记录
      └── 发票和附件

催收管理
  ├── 催收节奏配置 (/collection/rhythms)
  │   ├── 节奏列表
  │   ├── 新增/编辑对话框
  │   └── 升级规则配置
  └── 催收记录 (/collection/records)
      ├── 筛选表单
      ├── 记录列表
      └── 详情/更新/跟进对话框

月底核对
  ├── 对账管理 (/reconciliation)
  │   ├── 对账周期列表
  │   └── 对账详情 (/reconciliation/:id)
  │       ├── 概览标签页
  │       ├── 已匹配标签页
  │       ├── 未匹配标签页
  │       ├── 差异分解标签页
  │       └── 关联记录标签页
  └── 现金预测 (/cash-forecast)
      ├── 周期选择器
      ├── 现金流量卡片
      ├── 账单分解表格
      └── 历史预测对比

导出队列 (/exports)
  ├── 导出任务列表
  ├── 创建导出对话框
  ├── 摘要信息（对账差异、现金缺口、最近变更）
  └── 下载/重试/取消操作
```

## 开发说明

### 后端开发

```bash
# 启动开发模式（热重载）
npm run start:dev

# 构建生产版本
npm run build

# 运行生产版本
npm run start:prod

# 运行种子数据
npm run seed
```

### 前端开发

```bash
# 启动开发服务器
npm start

# 构建生产版本
npm run build

# 监听模式
npm run watch
```

### 数据库操作

```bash
# 生成迁移
npm run migration:generate --name=your-migration

# 运行迁移
npm run migration:run
```

## 常见问题

### 1. 如何重置数据库？

```bash
# 停止并删除容器
docker-compose down -v

# 重新启动
docker-compose up -d
```

### 2. 前端无法连接后端？

检查 `frontend/src/app/services/api.config.ts` 中的 `baseUrl` 是否正确。

### 3. 导出文件存储在哪里？

默认存储在后端 `exports/` 目录下，可在 `ExportProcessor` 中配置。

## License

MIT
