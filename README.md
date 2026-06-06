# 手术室耗材备包系统

面向手术室护士的专业耗材备包管理系统，贴合真实医院手术室工作流程，围绕术式、耗材包、手术间、批号、备包人、退回原因六大核心要素建立完整台账。

## 技术栈

- **后端**: Node.js + Express.js
- **数据库**: PostgreSQL
- **前端**: 原生 HTML + Tailwind CSS + Font Awesome
- **认证**: JWT Token
- **日志**: Winston
- **定时任务**: node-cron

## 快速开始

### 环境要求

- Node.js >= 16.x
- PostgreSQL >= 13.x

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

### 初始化数据库

```bash
# 创建数据库
psql -U postgres -c "CREATE DATABASE or_supply_db;"

# 执行建表脚本
psql -U postgres -d or_supply_db -f database/schema.sql

# 导入测试数据
psql -U postgres -d or_supply_db -f database/seed.sql
```

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

访问 `http://localhost:3000` 打开系统。

---

## 核心业务流程

### 备包流程（6步状态流转）

```
草稿 → 待审核 → 已审核 → 已确认 → 已发放 → 已使用
  ↓        ↓        ↓        ↓        ↓
退回     退回     退回     退回     退回
```

1. **登记**：护士从模板创建备包，选择手术排班、耗材明细
2. **资格校验**：系统自动校验耗材库存、批号有效期、手术时段
3. **库存校验**：实时扣减库存，记录出入库台账
4. **时段校验**：检查手术间排班冲突
5. **人工确认**：护士长/设备科审核备包内容
6. **执行记录**：扫码领用、登记使用、退回盘点

### 退包流程

```
退包登记 → 核验耗材 → 库存回补 → 记录原因
```

### 月度对账流程

```
自动生成 → 人工核对 → 提交审核 → 财务确认
```

---

## 数据模型

### 核心表结构（16张表）

#### 1. 用户表 `users`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| username | VARCHAR(50) UNIQUE | 用户名 |
| password_hash | VARCHAR(255) | 密码哈希（bcrypt） |
| real_name | VARCHAR(50) | 真实姓名 |
| role | VARCHAR(20) | 角色：admin/head_nurse/nurse/equipment |
| department | VARCHAR(100) | 所属科室 |
| phone | VARCHAR(20) | 联系电话 |
| is_active | BOOLEAN | 是否启用 |
| created_at | TIMESTAMP | 创建时间 |

#### 2. 手术间表 `operating_rooms`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| room_no | VARCHAR(20) UNIQUE | 手术间编号 |
| name | VARCHAR(50) | 手术间名称 |
| floor | VARCHAR(20) | 楼层 |
| status | VARCHAR(20) | 状态：available/maintenance/cleaning |
| description | TEXT | 备注 |

#### 3. 术式表 `surgery_types`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| code | VARCHAR(50) UNIQUE | 术式编码 |
| name | VARCHAR(100) | 术式名称 |
| department | VARCHAR(50) | 所属科室 |
| estimated_duration | INTEGER | 预估时长（分钟） |
| default_template_id | INTEGER | 默认备包模板 |

#### 4. 耗材目录表 `supply_items`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| item_code | VARCHAR(50) UNIQUE | 耗材编码 |
| name | VARCHAR(100) | 耗材名称 |
| specification | VARCHAR(100) | 规格型号 |
| unit | VARCHAR(20) | 单位 |
| category | VARCHAR(50) | 分类：高值/低值/耗材 |
| is_high_value | BOOLEAN | 是否高值耗材 |
| safety_stock | INTEGER | 安全库存 |
| barcode | VARCHAR(100) | 条码 |
| description | TEXT | 描述 |

#### 5. 耗材批次表 `supply_batches`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| item_id | INTEGER | 关联耗材ID |
| batch_no | VARCHAR(50) | 批号 |
| quantity | INTEGER | 库存数量 |
| expiry_date | DATE | 有效期至 |
| manufacturer | VARCHAR(100) | 生产厂家 |
| supplier | VARCHAR(100) | 供应商 |
| received_date | DATE | 入库日期 |
| is_expired | BOOLEAN | 是否已过期 |

**关键约束**：过期批号自动标记，加入备包时强制校验

#### 6. 备包模板表 `package_templates`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| name | VARCHAR(100) | 模板名称 |
| surgery_type_id | INTEGER | 关联术式ID |
| description | TEXT | 模板说明 |
| created_by | INTEGER | 创建人ID |
| created_at | TIMESTAMP | 创建时间 |

#### 7. 模板明细表 `package_template_items`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| template_id | INTEGER | 模板ID |
| item_id | INTEGER | 耗材ID |
| quantity | INTEGER | 数量 |
| is_required | BOOLEAN | 是否必选 |

#### 8. 手术排班表 `surgery_schedules`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| schedule_no | VARCHAR(50) UNIQUE | 排班编号 |
| surgery_type_id | INTEGER | 术式ID |
| operating_room_id | INTEGER | 手术间ID |
| patient_name | VARCHAR(50) | 患者姓名 |
| patient_id | VARCHAR(50) | 患者住院号 |
| surgeon | VARCHAR(50) | 主刀医生 |
| scheduled_start | TIMESTAMP | 计划开始时间 |
| scheduled_end | TIMESTAMP | 计划结束时间 |
| status | VARCHAR(20) | 状态：scheduled/in_progress/completed/cancelled |
| remarks | TEXT | 备注 |

#### 9. 备包主表 `package_preparations`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| package_no | VARCHAR(50) UNIQUE | 备包编号 |
| schedule_id | INTEGER | 关联排班ID |
| template_id | INTEGER | 使用模板ID |
| prepared_by | INTEGER | 备包人ID |
| checked_by | INTEGER | 审核人ID |
| confirmed_by | INTEGER | 确认人ID |
| status | VARCHAR(20) | 状态：draft/pending_review/approved/confirmed/delivered/used/returned |
| total_items | INTEGER | 耗材总数 |
| prepared_at | TIMESTAMP | 备包时间 |
| delivered_at | TIMESTAMP | 发放时间 |
| used_at | TIMESTAMP | 使用时间 |
| remarks | TEXT | 备注 |

#### 10. 备包明细表 `package_items`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| package_id | INTEGER | 备包ID |
| item_id | INTEGER | 耗材ID |
| batch_id | INTEGER | 批次ID |
| batch_no | VARCHAR(50) | 批号（冗余） |
| quantity | INTEGER | 数量 |
| expiry_date | DATE | 有效期（冗余） |
| is_scanned | BOOLEAN | 是否已扫码（高值耗材） |
| scanned_at | TIMESTAMP | 扫码时间 |
| scanned_by | INTEGER | 扫码人ID |

#### 11. 退回记录表 `return_records`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| return_no | VARCHAR(50) UNIQUE | 退包编号 |
| package_id | INTEGER | 关联备包ID |
| returned_by | INTEGER | 退回人ID |
| received_by | INTEGER | 接收人ID |
| return_reason | VARCHAR(100) | 退回原因 |
| return_date | TIMESTAMP | 退回时间 |
| remarks | TEXT | 备注 |

#### 12. 退回明细表 `return_items`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| return_id | INTEGER | 退回记录ID |
| package_item_id | INTEGER | 备包明细ID |
| item_id | INTEGER | 耗材ID |
| batch_id | INTEGER | 批次ID |
| quantity | INTEGER | 退回数量 |
| is_usable | BOOLEAN | 是否可复用 |
| check_result | VARCHAR(50) | 核验结果 |

#### 13. 月度对账表 `monthly_reconciliations`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| month | VARCHAR(7) UNIQUE | 对账月份 YYYY-MM |
| total_prepared | INTEGER | 备包总数 |
| total_used | INTEGER | 使用总数 |
| total_returned | INTEGER | 退回总数 |
| diff_count | INTEGER | 差异数 |
| status | VARCHAR(20) | 状态：draft/submitted/approved/rejected |
| created_by | INTEGER | 创建人ID |
| approved_by | INTEGER | 审核人ID |
| created_at | TIMESTAMP | 创建时间 |
| approved_at | TIMESTAMP | 审核时间 |

#### 14. 库存预警表 `stock_alerts`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| alert_type | VARCHAR(20) | 类型：low_stock/expiring/expired |
| item_id | INTEGER | 耗材ID |
| batch_id | INTEGER | 批次ID |
| message | TEXT | 预警信息 |
| is_handled | BOOLEAN | 是否已处理 |
| created_at | TIMESTAMP | 创建时间 |

#### 15. 导入导出任务表 `import_export_tasks`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| task_type | VARCHAR(10) | 类型：import/export |
| data_type | VARCHAR(50) | 数据类型：schedules/inventory/packages |
| status | VARCHAR(20) | 状态：pending/processing/completed/failed |
| progress | INTEGER | 进度 0-100 |
| file_path | VARCHAR(255) | 文件路径 |
| error_message | TEXT | 错误信息 |
| created_by | INTEGER | 创建人ID |
| created_at | TIMESTAMP | 创建时间 |
| completed_at | TIMESTAMP | 完成时间 |

#### 16. 通知表 `notifications`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| user_id | INTEGER | 接收用户ID |
| title | VARCHAR(100) | 标题 |
| message | TEXT | 内容 |
| type | VARCHAR(20) | 类型：info/warning/urgent |
| is_read | BOOLEAN | 是否已读 |
| created_at | TIMESTAMP | 创建时间 |

#### 17. 库存台账表 `inventory_ledger`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| item_id | INTEGER | 耗材ID |
| batch_id | INTEGER | 批次ID |
| change_type | VARCHAR(20) | 类型：in/out/return/adjust |
| quantity | INTEGER | 变动数量 |
| balance_after | INTEGER | 变动后余额 |
| related_id | INTEGER | 关联单据ID |
| related_type | VARCHAR(20) | 关联类型 |
| operated_by | INTEGER | 操作人ID |
| operated_at | TIMESTAMP | 操作时间 |
| remarks | TEXT | 备注 |

---

## 访问控制

### 角色定义（4种角色）

| 角色 | 代码 | 说明 |
|------|------|------|
| 系统管理员 | admin | 最高权限，用户管理、系统配置、审核对账 |
| 护士长 | head_nurse | 排班管理、备包审核、库存管理、月度对账 |
| 手术室护士 | nurse | 备包操作、领用确认、退包登记、批号核验 |
| 设备科 | equipment | 耗材管理、批次管理、库存盘点、导入导出 |

### 权限矩阵

| 功能模块 | admin | head_nurse | nurse | equipment |
|----------|-------|------------|-------|-----------|
| 用户管理 | ✅ | ❌ | ❌ | ❌ |
| 手术间管理 | ✅ | ✅ | ❌ | ❌ |
| 术式管理 | ✅ | ✅ | ❌ | ❌ |
| 手术排班 | ✅ | ✅ | 查看 | ❌ |
| 备包模板 | ✅ | ✅ | 查看 | ✅ |
| 耗材目录 | ✅ | 查看 | 查看 | ✅ |
| 批次管理 | ✅ | 查看 | 查看 | ✅ |
| 备包创建 | ✅ | ✅ | ✅ | ❌ |
| 备包审核 | ✅ | ✅ | ❌ | ❌ |
| 备包确认出库 | ✅ | ✅ | ❌ | ❌ |
| 备包发放 | ✅ | ✅ | ✅ | ❌ |
| 标记使用 | ✅ | ✅ | ✅ | ❌ |
| 退包登记 | ✅ | ✅ | ✅ | ❌ |
| 退包核验 | ✅ | ✅ | ❌ | ✅ |
| 月度对账生成 | ✅ | ❌ | ❌ | ✅ |
| 月度对账审核 | ✅ | ❌ | ❌ | ❌ |
| 导入导出 | ✅ | ❌ | ❌ | ✅ |
| 批号核验 | ✅ | ✅ | ✅ | ✅ |
| 库存台账 | ✅ | ✅ | 查看 | ✅ |
| 系统配置 | ✅ | ❌ | ❌ | ❌ |

### 认证方式

- 使用 JWT Token 进行身份认证
- Token 有效期：2小时
- 密码使用 bcrypt 加密存储（salt rounds: 10）
- 支持修改密码功能

---

## 异步提醒

### 定时任务（node-cron）

系统每日凌晨2点自动执行以下检查任务：

#### 1. 过期批号检查
```
Cron: 0 2 * * *
- 检查所有批次的有效期
- 自动标记已过期批次
- 对临期30天内的批次生成预警
- 通知设备科人员处理
```

#### 2. 低库存检查
```
Cron: 0 2 * * *
- 检查库存低于安全库存的耗材
- 生成库存预警记录
- 通知设备科和护士长
```

#### 3. 待审核提醒
```
Cron: 0 9 * * *
- 检查处于待审核状态的备包
- 提醒护士长及时审核
- 超过24小时未审核发送加急通知
```

### 通知类型

| 类型 | 触发条件 | 接收角色 |
|------|----------|----------|
| 临期预警 | 批次有效期不足30天 | equipment, admin |
| 过期预警 | 批次已过期 | equipment, admin, head_nurse |
| 低库存预警 | 库存低于安全库存 | equipment, admin, head_nurse |
| 待审核提醒 | 备包提交审核超过2小时 | head_nurse, admin |
| 备包完成 | 备包已确认出库 | nurse, head_nurse |
| 退包待核验 | 退包登记待核验 | equipment, admin |
| 对账待审核 | 月度对账提交待审核 | admin |

---

## 导入导出队列

### 设计原理

使用异步任务队列处理大批量数据的导入导出，避免阻塞主进程。

### 支持的数据类型

| 类型 | 导出 | 导入 | 说明 |
|------|------|------|------|
| 手术排班 | ✅ | ✅ | 支持按月份导出 |
| 耗材库存 | ✅ | ✅ | 包含批次信息 |
| 备包记录 | ✅ | ❌ | 支持按时间范围导出 |
| 耗材目录 | ✅ | ✅ | 批量更新耗材信息 |

### 任务状态流转

```
pending → processing → completed
                    ↘ failed
```

### 任务执行流程

1. 用户提交导入/导出请求
2. 系统创建任务记录，状态为 `pending`
3. 后台队列按顺序处理任务
4. 任务进行中更新 `progress` 字段
5. 任务完成后生成文件，更新状态为 `completed`
6. 用户可在任务列表下载结果文件
7. 失败任务记录错误信息，支持重试

### 导出文件格式

- 文件格式：CSV
- 编码：UTF-8 with BOM（兼容Excel）
- 文件命名：`{data_type}_{YYYYMMDD}_{HHmmss}.csv`
- 文件保存路径：`/uploads/exports/`

---

## 错误日志

### 日志分级

使用 Winston 实现分级日志：

| 级别 | 说明 | 示例 |
|------|------|------|
| error | 错误日志 | 数据库连接失败、API异常、业务校验失败 |
| warn | 警告日志 | 库存不足、临期预警、权限不足 |
| info | 信息日志 | 用户登录、业务操作成功、定时任务执行 |
| debug | 调试日志 | 详细请求参数、SQL语句（生产环境关闭） |

### 日志输出

- **控制台输出**：开发环境使用，彩色格式化输出
- **文件输出**：生产环境使用，按日期滚动
  - `logs/error-%DATE%.log`：仅错误日志
  - `logs/combined-%DATE%.log`：全量日志
- **日志保留**：最多保留30天

### 错误日志格式

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "error",
  "message": "备包审核失败",
  "user_id": 1,
  "username": "admin",
  "ip": "192.168.1.100",
  "path": "/api/packages/123/approve",
  "method": "POST",
  "error": {
    "name": "ValidationError",
    "message": "耗材批号已过期",
    "stack": "..."
  }
}
```

### API 错误响应格式

```json
{
  "success": false,
  "message": "耗材批号已过期：B20231201",
  "code": "BATCH_EXPIRED",
  "data": null
}
```

### 常见错误码

| 错误码 | 说明 |
|--------|------|
| AUTH_FAILED | 认证失败 |
| PERMISSION_DENIED | 权限不足 |
| BATCH_EXPIRED | 批号已过期 |
| INSUFFICIENT_STOCK | 库存不足 |
| SCHEDULE_CONFLICT | 排班时段冲突 |
| INVALID_PARAMS | 参数校验失败 |
| NOT_FOUND | 资源不存在 |
| SERVER_ERROR | 服务器内部错误 |

---

## 测试账号

### 系统初始化后默认账号

| 用户名 | 密码 | 角色 | 姓名 | 说明 |
|--------|------|------|------|------|
| admin | 123456 | 系统管理员 | 张管理员 | 最高权限 |
| headnurse | 123456 | 护士长 | 李护士长 | 手术室护士长 |
| nurse1 | 123456 | 手术室护士 | 王护士 | 手术室护士 |
| nurse2 | 123456 | 手术室护士 | 刘护士 | 手术室护士 |
| equipment | 123456 | 设备科 | 陈设备 | 设备科耗材管理员 |

**安全提示**：生产环境请立即修改默认密码！

---

## 项目目录结构

```
.
├── database/
│   ├── schema.sql          # 数据库建表脚本
│   └── seed.sql            # 测试数据脚本
├── public/
│   └── index.html          # 前端单页应用
├── src/
│   ├── config.js           # 配置文件
│   ├── db.js               # 数据库连接
│   ├── server.js           # 应用入口
│   ├── middleware/
│   │   ├── auth.js         # 认证中间件
│   │   └── error.js        # 错误处理中间件
│   ├── utils/
│   │   └── logger.js       # 日志工具
│   ├── controllers/        # 业务控制器
│   │   ├── authController.js
│   │   ├── scheduleController.js
│   │   ├── packageController.js
│   │   ├── inventoryController.js
│   │   ├── returnController.js
│   │   ├── reconciliationController.js
│   │   ├── importExportController.js
│   │   └── notificationController.js
│   └── routes/             # 路由模块
│       ├── auth.js
│       ├── schedules.js
│       ├── packages.js
│       ├── inventory.js
│       ├── returns.js
│       ├── reconciliations.js
│       ├── importExport.js
│       └── notifications.js
├── logs/                   # 日志目录（自动创建）
├── uploads/                # 上传文件目录（自动创建）
├── .env.example            # 环境变量示例
├── package.json
└── README.md
```

---

## 核心业务规则

### 1. 批号管理
- 所有耗材必须关联具体批号
- 过期批号自动拦截，无法加入备包
- 高值耗材必须扫码确认批号
- 临期30天自动预警

### 2. 库存管理
- 备包审核时实时扣减库存
- 退包核验后回补可复用库存
- 所有库存变动记录台账
- 低于安全库存自动预警

### 3. 高值耗材管控
- 必须扫码关联到具体手术
- 扫码时核验批号有效期
- 记录扫码人和扫码时间
- 不可退回，必须标记使用

### 4. 时段校验
- 同一手术间同一时段只能有一台手术
- 备包必须关联有效的手术排班
- 手术取消时备包自动退回

---

## API 接口清单

### 认证接口
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户
- `POST /api/auth/change-password` - 修改密码

### 手术排班
- `GET /api/schedules` - 获取排班列表
- `POST /api/schedules` - 创建排班
- `PUT /api/schedules/:id` - 更新排班
- `DELETE /api/schedules/:id` - 取消排班
- `GET /api/schedules/:id` - 获取排班详情

### 备包管理
- `GET /api/packages` - 获取备包列表
- `POST /api/packages` - 创建备包（从模板）
- `PUT /api/packages/:id` - 修改备包
- `POST /api/packages/:id/submit` - 提交审核
- `POST /api/packages/:id/approve` - 审核通过
- `POST /api/packages/:id/confirm` - 确认出库
- `POST /api/packages/:id/deliver` - 发放
- `POST /api/packages/:id/use` - 标记使用
- `GET /api/packages/:id` - 获取备包详情

### 库存管理
- `GET /api/inventory/items` - 获取耗材目录
- `GET /api/inventory/batches` - 获取批次列表
- `POST /api/inventory/batches` - 新增批次
- `GET /api/inventory/batches/verify/:batchNo` - 核验批号
- `GET /api/inventory/ledger` - 库存台账

### 退包管理
- `GET /api/returns` - 获取退包列表
- `POST /api/returns` - 登记退包
- `POST /api/returns/:id/verify` - 核验退包
- `GET /api/returns/:id` - 获取退包详情

### 月度对账
- `GET /api/reconciliations` - 获取对账列表
- `POST /api/reconciliations/generate` - 生成月度对账
- `POST /api/reconciliations/:id/submit` - 提交对账
- `POST /api/reconciliations/:id/approve` - 审核对账

### 导入导出
- `GET /api/import-export` - 获取任务列表
- `POST /api/import-export/export` - 创建导出任务
- `POST /api/import-export/import` - 创建导入任务
- `GET /api/import-export/:id/download` - 下载结果文件

### 通知中心
- `GET /api/notifications` - 获取通知列表
- `PUT /api/notifications/:id/read` - 标记已读
- `PUT /api/notifications/read-all` - 全部已读

---

## 安全措施

1. **密码加密**：使用 bcrypt 哈希存储，不可逆
2. **JWT认证**：Token 2小时有效期，支持注销
3. **权限控制**：基于角色的细粒度权限检查
4. **输入校验**：所有API参数进行类型和格式校验
5. **SQL注入防护**：使用参数化查询
6. **XSS防护**：Helmet 安全头 + 输入转义
7. **API限流**：防止暴力破解和恶意请求
8. **操作日志**：所有关键操作记录审计日志

---

## 开发说明

### 添加新的业务模块

1. 在 `src/controllers/` 创建控制器
2. 在 `src/routes/` 创建路由文件
3. 在 `src/server.js` 注册路由
4. 如需要权限控制，在路由中使用 `authenticate` 和 `checkPermission` 中间件

### 数据库迁移

修改 `database/schema.sql` 后，需要手动执行迁移脚本或创建新的增量迁移文件。

---

## License

MIT
