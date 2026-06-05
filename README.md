# 工地临时通行证管理系统

为施工项目安全员设计的工地临时通行证管理系统，专注于真实业务流程而非通用后台管理。

## 技术栈

- **后端**: Ruby on Rails 8.0 + PostgreSQL + Sidekiq
- **前端**: Vue 3 + Vite + Pinia + Element Plus
- **认证**: JWT
- **异步队列**: Sidekiq + Redis

## 目录结构

```
.
├── backend/       # Rails API 后端
└── frontend/      # Vue 3 前端
```

## 业务流程

```
访客申请 → 资格/库存/时段校验 → 人工确认 → 门岗放行 → 执行记录 → 月度对账
```

### 核心功能

1. **访客申请**: 提交人员、车辆、作业区域信息
2. **证件核验**: 核验身份证、驾驶证、操作证等
3. **门岗放行**: 支持通行证号/身份证/车牌三种验证方式
4. **区域权限**: 通行证与作业区域关联，按区域授权
5. **违规冻结**: 违规记录登记，支持通行证冻结
6. **自动过期**: 通行证过期自动失效（定时任务）
7. **二级审批**: 危险区域需要两级审批

---

## 数据模型

### 1. User (用户表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| username | string | 用户名 |
| password_digest | string | 密码哈希 |
| real_name | string | 真实姓名 |
| role | string | 角色: admin/safety_officer/approver/guard/staff |
| phone | string | 联系电话 |
| created_at | datetime | |
| updated_at | datetime | |

### 2. Person (人员表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| name | string | 姓名 |
| id_card | string | 身份证号 |
| phone | string | 联系电话 |
| company | string | 所属单位 |
| blacklisted | boolean | 是否黑名单 |
| blacklist_reason | text | 拉黑原因 |
| remark | text | 备注 |
| created_at | datetime | |
| updated_at | datetime | |

### 3. Credential (证件表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| person_id | bigint | 关联人员 |
| credential_type | string | 类型: id_card/driver_license/operation_cert/other |
| number | string | 证件号码 |
| issued_by | string | 签发机关 |
| issued_at | date | 签发日期 |
| valid_until | date | 有效期至 |
| verified | boolean | 是否已核验 |
| verified_at | datetime | 核验时间 |
| verified_by_id | bigint | 核验人 |
| created_at | datetime | |
| updated_at | datetime | |

### 4. Vehicle (车辆表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| plate_number | string | 车牌号 |
| vehicle_type | string | 车辆类型 |
| owner_name | string | 车主姓名 |
| owner_phone | string | 联系电话 |
| company | string | 所属单位 |
| blacklisted | boolean | 是否黑名单 |
| blacklist_reason | text | 拉黑原因 |
| remark | text | 备注 |
| created_at | datetime | |
| updated_at | datetime | |

### 5. WorkZone (作业区域表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| name | string | 区域名称 |
| code | string | 区域编码 |
| location | string | 位置 |
| requires_second_approval | boolean | 是否需要二级审批（危险区域） |
| description | text | 描述 |
| created_at | datetime | |
| updated_at | datetime | |

### 6. Pass (通行证表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| pass_number | string | 通行证号（唯一） |
| pass_type | string | 类型: visitor/worker/vehicle/temporary |
| person_id | bigint | 关联人员 |
| vehicle_id | bigint | 关联车辆（可选） |
| purpose | text | 申请事由 |
| status | string | 状态: pending/approved/rejected/frozen/expired |
| valid_from | date | 有效期起 |
| valid_until | date | 有效期止 |
| frozen | boolean | 是否冻结 |
| freeze_reason | text | 冻结原因 |
| created_by_id | bigint | 申请人 |
| created_at | datetime | |
| updated_at | datetime | |

**关联**:
- `has_many :pass_work_zones` → 通行证-区域多对多
- `has_many :work_zones, through: :pass_work_zones`
- `has_many :approvals` → 审批记录
- `has_many :violations` → 违规记录

### 7. Approval (审批表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| pass_id | bigint | 关联通行证 |
| approval_level | integer | 审批级别: 1/2 |
| status | string | 状态: pending/approved/rejected |
| approver_id | bigint | 审批人 |
| comment | text | 审批意见 |
| approved_at | datetime | 审批通过时间 |
| rejected_at | datetime | 审批拒绝时间 |
| created_at | datetime | |
| updated_at | datetime | |

### 8. Violation (违规记录表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| pass_id | bigint | 关联通行证 |
| person_id | bigint | 关联人员 |
| violation_type | string | 类型: unauthorized_entry/overtime/restricted_zone/other |
| description | text | 违规描述 |
| penalty | string | 处罚措施 |
| recorded_by_id | bigint | 记录人 |
| created_at | datetime | |
| updated_at | datetime | |

### 9. GateLog (门岗记录表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| pass_id | bigint | 关联通行证 |
| person_id | bigint | 关联人员 |
| vehicle_id | bigint | 关联车辆 |
| gate_name | string | 门岗名称 |
| action_type | string | 类型: entry/exit |
| result | string | 结果: allowed/rejected |
| reject_reason | string | 拒绝原因 |
| operator_id | bigint | 操作员 |
| created_at | datetime | |
| updated_at | datetime | |

### 10. Notification (通知表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| user_id | bigint | 接收用户 |
| notification_type | string | 类型: approval/violation/expiry/system |
| title | string | 标题 |
| content | text | 内容 |
| read | boolean | 是否已读 |
| read_at | datetime | 阅读时间 |
| created_at | datetime | |
| updated_at | datetime | |

### 11. ImportExportJob (导入导出队列表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| job_type | string | 类型: import/export |
| model_type | string | 数据类型: Person/Vehicle/Pass/Violation/GateLog |
| status | string | 状态: pending/processing/completed/failed |
| file_name | string | 文件名 |
| file_path | string | 文件路径 |
| total_count | integer | 总数 |
| processed_count | integer | 已处理数 |
| error_count | integer | 错误数 |
| error_messages | text | 错误信息 |
| filters | jsonb | 筛选条件 |
| created_by_id | bigint | 创建人 |
| created_at | datetime | |
| updated_at | datetime | |

### 12. ErrorLog (错误日志表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| level | string | 级别: info/warn/error/fatal |
| message | text | 错误信息 |
| backtrace | text | 堆栈信息 |
| context | jsonb | 上下文 |
| user_id | bigint | 关联用户 |
| request_url | string | 请求URL |
| request_method | string | 请求方法 |
| ip_address | string | IP地址 |
| created_at | datetime | |
| updated_at | datetime | |

---

## 访问控制

### 角色定义

| 角色 | 标识 | 权限说明 |
|------|------|----------|
| 系统管理员 | admin | 全部权限，用户管理 |
| 安全员 | safety_officer | 通行证管理、违规登记、查看所有数据 |
| 审批人 | approver | 审批通行证、查看审批列表 |
| 门岗 | guard | 门岗验证、门岗记录查询 |
| 普通员工 | staff | 申请通行证、查看自己的通行证 |

### 权限检查

权限检查在 `ApplicationController` 中实现，通过 `before_action` 拦截：

- `require_admin!` - 仅管理员
- `require_approver!` - 审批人及以上
- `require_safety_officer!` - 安全员及以上
- `require_guard!` - 门岗及以上

---

## 异步提醒

### 通知类型

1. **审批通知**: 新的待审批任务
2. **违规通知**: 违规记录登记
3. **过期提醒**: 通行证即将过期（提前3天）
4. **系统通知**: 系统公告

### 实现方式

使用 Sidekiq 异步任务队列处理通知发送：

- `NotificationJob` - 通知异步发送
- `ExpireCheckJob` - 每小时检查过期通行证，自动更新状态并发送提醒

### 定时任务

```ruby
# config/sidekiq.yml
:schedule:
  expire_check:
    cron: '0 * * * *'   # 每小时执行
    class: ExpireCheckJob
```

---

## 导入导出队列

### 导出功能

支持导出以下数据：
- 人员信息
- 车辆信息
- 通行证记录
- 违规记录
- 门岗记录

导出流程：
1. 用户提交导出请求
2. 创建 `ImportExportJob` 记录，状态为 pending
3. Sidekiq 异步执行 `ExportJob`
4. 生成 Excel 文件，更新任务状态
5. 用户可在导入导出页面下载

### 导入功能

支持导入人员和车辆数据

导入流程：
1. 用户上传 Excel 文件
2. 创建 `ImportExportJob` 记录，状态为 pending
3. Sidekiq 异步执行 `ImportJob`
4. 逐行处理数据，记录成功/失败数量
5. 用户可查看导入结果和错误详情

---

## 错误日志

### 日志记录

所有 API 异常自动捕获并记录到 `error_logs` 表：

- 错误级别（info/warn/error/fatal）
- 错误信息和堆栈
- 请求上下文（URL、方法、参数、IP）
- 关联用户

### 查询方式

管理员可通过 API 查询错误日志：

```
GET /api/v1/error_logs
```

---

## 快速开始

### 环境要求

- Ruby >= 3.2.0
- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- Redis >= 6.0

### 后端启动

```bash
cd backend

# 安装依赖
bundle install

# 创建数据库
rails db:create

# 运行迁移
rails db:migrate

# 导入种子数据（含测试账号）
rails db:seed

# 启动 Sidekiq（异步任务）
bundle exec sidekiq

# 启动 Rails 服务
rails s -p 3000
```

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务
npm run dev
```

访问 `http://localhost:5173` 即可使用系统。

---

## 测试账号

种子数据已创建以下测试账号：

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | 123456 | 系统管理员 | 全部权限 |
| safety | 123456 | 安全员 | 通行证管理、违规登记 |
| approver | 123456 | 审批人 | 审批通行证 |
| guard | 123456 | 门岗 | 门岗验证放行 |
| staff | 123456 | 普通员工 | 申请通行证 |

---

## API 文档

### 认证

```
POST /api/v1/auth/login       # 登录
POST /api/v1/auth/logout      # 登出
GET  /api/v1/auth/me          # 获取当前用户信息
```

### 核心接口

```
# 人员管理
GET    /api/v1/people         # 人员列表
POST   /api/v1/people         # 新增人员
PUT    /api/v1/people/:id     # 更新人员
POST   /api/v1/people/:id/blacklist       # 拉黑
POST   /api/v1/people/:id/remove_blacklist # 解除拉黑

# 通行证管理
GET    /api/v1/passes         # 通行证列表
POST   /api/v1/passes         # 申请通行证
POST   /api/v1/passes/:id/freeze   # 冻结
POST   /api/v1/passes/:id/unfreeze # 解冻

# 审批管理
GET    /api/v1/approvals/pending_for_me  # 待我审批
POST   /api/v1/approvals/:id/approve     # 通过
POST   /api/v1/approvals/:id/reject      # 拒绝

# 门岗验证
POST   /api/v1/gate_logs/verify_and_log  # 验证并记录
GET    /api/v1/gate_logs/today_stats     # 今日统计

# 违规管理
POST   /api/v1/violations      # 登记违规

# 通知
GET    /api/v1/notifications/unread_count # 未读数量
POST   /api/v1/notifications/mark_all_as_read # 全部已读

# 导入导出
POST   /api/v1/import_export_jobs/create_export # 创建导出
POST   /api/v1/import_export_jobs/create_import # 创建导入
GET    /api/v1/import_export_jobs/:id/download  # 下载文件
```

---

## 核心业务规则

1. **通行证号自动生成**: `PASS + 年月日 + 4位序号`
2. **自动失效**: 有效期结束后自动标记为 expired
3. **二级审批**: 申请区域包含危险区域时，自动生成两级审批
4. **黑名单检查**: 人员或车辆在黑名单中时，禁止申请通行证
5. **门岗验证**: 支持通行证号、身份证号、车牌号三种方式验证
6. **违规冻结**: 严重违规可直接冻结通行证
