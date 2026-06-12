# 数据库设计文档

## 目录

1. [数据库概述](#数据库概述)
2. [ER图](#er图)
3. [数据表设计](#数据表设计)
4. [索引设计](#索引设计)
5. [初始化脚本](#初始化脚本)
6. [数据备份与恢复](#数据备份与恢复)

## 数据库概述

### 基本信息

| 项目         | 说明                                |
|--------------|-------------------------------------|
| 数据库类型   | PostgreSQL 15                       |
| 数据库名     | finance_approval                    |
| 字符集       | UTF-8                               |
| 排序规则     | zh_CN.UTF-8                         |
| 连接端口     | 5432                                |
| 连接池大小   | 最大20，最小空闲5                   |

### 设计原则

1. **第三范式**：数据表设计遵循第三范式，减少数据冗余
2. **命名规范**：表名使用下划线分隔，主键统一使用 `id`
3. **审计字段**：所有业务表包含 `created_at`, `updated_at`, `created_by`, `updated_by`
4. **软删除**：核心业务表使用 `deleted` 标志实现软删除
5. **乐观锁**：高并发表使用 `version` 字段实现乐观锁

---

## ER图

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    sys_user     │         │    sys_role     │         │  sys_user_role  │
│─────────────────│         │─────────────────│         │─────────────────│
│ id (PK)         │◄────────│ id (PK)         │         │ id (PK)         │
│ username        │         │ role_code       │────────►│ user_id (FK)    │
│ password        │         │ role_name       │         │ role_id (FK)    │
│ real_name       │         │ description     │         └─────────────────┘
│ email           │         └─────────────────┘
│ phone           │
│ department      │                  ┌──────────────────────────────┐
│ status          │                  │                              │
│ avatar          │                  │                              │
└────────┬────────┘                  │                              │
         │                           │                              │
         │ 1                         │                              │
         │                           │                              │
         │ n                         │ n                            │ n
┌────────▼────────┐       ┌──────────▼──────────┐        ┌──────────▼──────────┐
│ expense_application │   │   approval_record   │        │   approval_node     │
│───────────────────│   │─────────────────────│        │─────────────────────│
│ id (PK)           │   │ id (PK)             │        │ id (PK)             │
│ application_no    │◄──│ application_id (FK) │◄───────│ rule_id (FK)        │
│ title             │   │ node_id (FK)        │        │ node_name           │
│ expense_type      │   │ approver_id (FK)    │        │ node_order          │
│ amount            │   │ action              │        │ approver_type       │
│ start_date        │   │ comment             │        │ approver_role       │
│ end_date          │   │ created_at          │        │ approver_user_id    │
│ description       │   └─────────────────────┘        │ timeout_hours       │
│ status            │                                   └─────────────────────┘
│ applicant_id (FK) │
│ current_node_id   │             ┌──────────────────────────┐
│ created_at        │             │                          │
│ updated_at        │             │                          │
└────────┬────────┘             │                          │
         │ 1                     │                          │
         │                       │                          │
         │ n                     │ n                        │ n
┌────────▼────────┐   ┌──────────▼──────────┐   ┌──────────▼──────────┐
│ expense_attachment│   │   approval_rule     │   │   timeout_exception │
│───────────────────│   │─────────────────────│   │─────────────────────│
│ id (PK)           │   │ id (PK)             │   │ id (PK)             │
│ application_id (FK) │ │ name                │   │ application_id (FK) │
│ file_name         │   │ expense_type        │   │ node_id (FK)        │
│ original_name     │   │ description         │   │ approver_id (FK)    │
│ file_size         │   │ enabled             │   │ status              │
│ file_type         │   │ amount_from         │   │ timeout_hours       │
│ file_path         │   │ amount_to           │   │ expired_at          │
│ uploaded_by (FK)  │   └─────────────────────┘   │ reminder_count      │
│ created_at        │                             │ last_reminder_at    │
└───────────────────┘                             └─────────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ approval_config │       │   audit_log     │       │   change_log    │
│─────────────────│       │─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ config_type     │       │ operation       │       │ change_type     │
│ config_key      │       │ user_id (FK)    │       │ title           │
│ config_value    │       │ username        │       │ content         │
│ description     │       │ real_name       │       │ effective_date  │
│ sort            │       │ resource_type   │       │ version         │
│ enabled         │       │ resource_id     │       │ created_by (FK) │
│ created_at      │       │ ip              │       │ created_at      │
└─────────────────┘       │ user_agent      │       └─────────────────┘
                          │ detail          │
                          │ created_at      │
                          └─────────────────┘
```

---

## 数据表设计

### 1. 用户表 (sys_user)

| 字段名       | 类型         | 长度  | 主键 | 可空 | 默认值       | 说明                     |
|--------------|--------------|-------|------|------|--------------|--------------------------|
| id           | BIGINT       | -     | 是   | 否   | -            | 用户ID（雪花算法）       |
| username     | VARCHAR      | 50    | -    | 否   | -            | 用户名（唯一）           |
| password     | VARCHAR      | 100   | -    | 否   | -            | 密码（BCrypt加密）       |
| real_name    | VARCHAR      | 50    | -    | 否   | -            | 真实姓名                 |
| email        | VARCHAR      | 100   | -    | 是   | -            | 邮箱                     |
| phone        | VARCHAR      | 20    | -    | 是   | -            | 手机号                   |
| department   | VARCHAR      | 100   | -    | 是   | -            | 部门                     |
| status       | SMALLINT     | -     | -    | 否   | 1            | 状态：0禁用，1启用       |
| avatar       | VARCHAR      | 255   | -    | 是   | -            | 头像URL                  |
| deleted      | SMALLINT     | -     | -    | 否   | 0            | 删除标志：0未删，1已删   |
| created_by   | BIGINT       | -     | -    | 是   | -            | 创建人ID                 |
| updated_by   | BIGINT       | -     | -    | 是   | -            | 更新人ID                 |
| created_at   | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 创建时间           |
| updated_at   | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 更新时间           |

**唯一索引**：`uk_username` (username, deleted)

---

### 2. 角色表 (sys_role)

| 字段名       | 类型         | 长度  | 主键 | 可空 | 默认值       | 说明                     |
|--------------|--------------|-------|------|------|--------------|--------------------------|
| id           | BIGINT       | -     | 是   | 否   | -            | 角色ID                   |
| role_code    | VARCHAR      | 50    | -    | 否   | -            | 角色编码（唯一）         |
| role_name    | VARCHAR      | 50    | -    | 否   | -            | 角色名称                 |
| description  | VARCHAR      | 255   | -    | 是   | -            | 角色描述                 |
| sort         | INTEGER      | -     | -    | 否   | 0            | 排序                     |
| enabled      | SMALLINT     | -     | -    | 否   | 1            | 是否启用                 |
| created_at   | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 创建时间           |
| updated_at   | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 更新时间           |

**唯一索引**：`uk_role_code` (role_code)

---

### 3. 用户角色关联表 (sys_user_role)

| 字段名       | 类型         | 长度  | 主键 | 可空 | 默认值       | 说明                     |
|--------------|--------------|-------|------|------|--------------|--------------------------|
| id           | BIGINT       | -     | 是   | 否   | -            | 主键ID                   |
| user_id      | BIGINT       | -     | -    | 否   | -            | 用户ID                   |
| role_id      | BIGINT       | -     | -    | 否   | -            | 角色ID                   |
| created_at   | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 创建时间           |

**唯一索引**：`uk_user_role` (user_id, role_id)
**外键**：`fk_user_role_user` (user_id) → sys_user(id)
**外键**：`fk_user_role_role` (role_id) → sys_role(id)

---

### 4. 费用申请表 (expense_application)

| 字段名            | 类型         | 长度  | 主键 | 可空 | 默认值       | 说明                     |
|-------------------|--------------|-------|------|------|--------------|--------------------------|
| id                | BIGINT       | -     | 是   | 否   | -            | 申请ID                   |
| application_no    | VARCHAR      | 32    | -    | 否   | -            | 申请单号（唯一）         |
| title             | VARCHAR      | 200   | -    | 否   | -            | 申请标题                 |
| expense_type      | VARCHAR      | 50    | -    | 否   | -            | 费用类型                 |
| amount            | DECIMAL(12,2)| -     | -    | 否   | 0.00         | 申请总金额               |
| start_date        | DATE         | -     | -    | 是   | -            | 费用开始日期             |
| end_date          | DATE         | -     | -    | 是   | -            | 费用结束日期             |
| description       | TEXT         | -     | -    | 是   | -            | 申请说明                 |
| status            | VARCHAR      | 32    | -    | 否   | DRAFT        | 状态：DRAFT/PENDING等    |
| applicant_id      | BIGINT       | -     | -    | 否   | -            | 申请人ID                 |
| current_node_id   | BIGINT       | -     | -    | 是   | -            | 当前审批节点ID           |
| version           | INTEGER      | -     | -    | 否   | 0            | 版本号（乐观锁）         |
| deleted           | SMALLINT     | -     | -    | 否   | 0            | 删除标志                 |
| created_by        | BIGINT       | -     | -    | 是   | -            | 创建人ID                 |
| updated_by        | BIGINT       | -     | -    | 是   | -            | 更新人ID                 |
| created_at        | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 创建时间           |
| updated_at        | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 更新时间           |

**唯一索引**：`uk_application_no` (application_no)
**普通索引**：`idx_applicant` (applicant_id)
**普通索引**：`idx_status` (status)
**普通索引**：`idx_created_at` (created_at)
**普通索引**：`idx_expense_type` (expense_type)

---

### 5. 费用明细表 (expense_application_detail)

| 字段名            | 类型         | 长度  | 主键 | 可空 | 默认值       | 说明                     |
|-------------------|--------------|-------|------|------|--------------|--------------------------|
| id                | BIGINT       | -     | 是   | 否   | -            | 明细ID                   |
| application_id    | BIGINT       | -     | -    | 否   | -            | 申请ID                   |
| item_name         | VARCHAR      | 100   | -    | 否   | -            | 费用项目名称             |
| amount            | DECIMAL(12,2)| -     | -    | 否   | 0.00         | 项目金额                 |
| description       | VARCHAR      | 500   | -    | 是   | -            | 项目说明                 |
| sort              | INTEGER      | -     | -    | 否   | 0            | 排序                     |
| created_at        | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 创建时间           |

**外键**：`fk_detail_application` (application_id) → expense_application(id)

---

### 6. 费用附件表 (expense_attachment)

| 字段名         | 类型         | 长度  | 主键 | 可空 | 默认值       | 说明                     |
|----------------|--------------|-------|------|------|--------------|--------------------------|
| id             | BIGINT       | -     | 是   | 否   | -            | 附件ID                   |
| application_id | BIGINT       | -     | -    | 是   | -            | 申请ID（可为空，上传时未关联） |
| file_name      | VARCHAR      | 255   | -    | 否   | -            | 存储文件名               |
| original_name  | VARCHAR      | 255   | -    | 否   | -            | 原始文件名               |
| file_size      | BIGINT       | -     | -    | 否   | 0            | 文件大小（字节）         |
| file_type      | VARCHAR      | 50    | -    | 否   | -            | 文件类型（扩展名）       |
| file_path      | VARCHAR      | 500   | -    | 否   | -            | 文件存储路径             |
| mime_type      | VARCHAR      | 100   | -    | 是   | -            | MIME类型                 |
| uploaded_by    | BIGINT       | -     | -    | 否   | -            | 上传人ID                 |
| created_at     | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 上传时间           |

**普通索引**：`idx_application` (application_id)
**普通索引**：`idx_uploaded_by` (uploaded_by)

---

### 7. 审批规则表 (approval_rule)

| 字段名        | 类型         | 长度  | 主键 | 可空 | 默认值       | 说明                     |
|---------------|--------------|-------|------|------|--------------|--------------------------|
| id            | BIGINT       | -     | 是   | 否   | -            | 规则ID                   |
| name          | VARCHAR      | 100   | -    | 否   | -            | 规则名称                 |
| expense_type  | VARCHAR      | 50    | -    | 否   | -            | 费用类型                 |
| description   | VARCHAR      | 500   | -    | 是   | -            | 规则描述                 |
| enabled       | SMALLINT     | -     | -    | 否   | 1            | 是否启用                 |
| amount_from   | DECIMAL(12,2)| -     | -    | 否   | 0.00         | 金额范围-起始            |
| amount_to     | DECIMAL(12,2)| -     | -    | 否   | 99999999.99  | 金额范围-结束            |
| priority      | INTEGER      | -     | -    | 否   | 0            | 优先级（数字越小越高）   |
| created_by    | BIGINT       | -     | -    | 是   | -            | 创建人ID                 |
| updated_by    | BIGINT       | -     | -    | 是   | -            | 更新人ID                 |
| created_at    | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 创建时间           |
| updated_at    | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 更新时间           |

**普通索引**：`idx_expense_type_amount` (expense_type, amount_from, amount_to)
**普通索引**：`idx_enabled` (enabled)

---

### 8. 审批节点表 (approval_node)

| 字段名            | 类型         | 长度  | 主键 | 可空 | 默认值       | 说明                     |
|-------------------|--------------|-------|------|------|--------------|--------------------------|
| id                | BIGINT       | -     | 是   | 否   | -            | 节点ID                   |
| rule_id           | BIGINT       | -     | -    | 否   | -            | 规则ID                   |
| node_name         | VARCHAR      | 100   | -    | 否   | -            | 节点名称                 |
| node_order        | INTEGER      | -     | -    | 否   | 0            | 节点顺序                 |
| approver_type     | VARCHAR      | 32    | -    | 否   | -            | 审批人类型：DEPT_MANAGER/ROLE/USER |
| approver_role     | VARCHAR      | 50    | -    | 是   | -            | 审批角色（按角色审批时） |
| approver_user_id  | BIGINT       | -     | -    | 是   | -            | 指定审批人ID（指定人员时） |
| timeout_hours     | INTEGER      | -     | -    | 否   | 24           | 超时时间（小时）         |
| can_transfer      | SMALLINT     | -     | -    | 否   | 1            | 允许转交                 |
| can_delegate      | SMALLINT     | -     | -    | 否   | 0            | 允许委托                 |
| require_comment   | SMALLINT     | -     | -    | 否   | 0            | 审批意见必填             |
| created_at        | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 创建时间           |
| updated_at        | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 更新时间           |

**外键**：`fk_node_rule` (rule_id) → approval_rule(id)
**普通索引**：`idx_rule_order` (rule_id, node_order)

---

### 9. 审批记录表 (approval_record)

| 字段名            | 类型         | 长度  | 主键 | 可空 | 默认值       | 说明                     |
|-------------------|--------------|-------|------|------|--------------|--------------------------|
| id                | BIGINT       | -     | 是   | 否   | -            | 记录ID                   |
| application_id    | BIGINT       | -     | -    | 否   | -            | 申请ID                   |
| node_id           | BIGINT       | -     | -    | 否   | -            | 节点ID                   |
| node_name         | VARCHAR      | 100   | -    | 否   | -            | 节点名称（冗余）         |
| approver_id       | BIGINT       | -     | -    | 否   | -            | 审批人ID                 |
| approver_name     | VARCHAR      | 50    | -    | 否   | -            | 审批人姓名（冗余）       |
| action            | VARCHAR      | 32    | -    | 否   | -            | 审批动作：APPROVE/REJECT等 |
| comment           | VARCHAR      | 1000  | -    | 是   | -            | 审批意见                 |
| reject_reason     | VARCHAR      | 100   | -    | 是   | -            | 退回原因编码             |
| next_approver_id  | BIGINT       | -     | -    | 是   | -            | 转交/委托的下一个审批人ID |
| created_at        | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 创建时间           |

**外键**：`fk_record_application` (application_id) → expense_application(id)
**外键**：`fk_record_node` (node_id) → approval_node(id)
**普通索引**：`idx_application` (application_id)
**普通索引**：`idx_approver` (approver_id)
**普通索引**：`idx_created_at` (created_at)

---

### 10. 审批配置表 (approval_config)

| 字段名       | 类型         | 长度  | 主键 | 可空 | 默认值       | 说明                     |
|--------------|--------------|-------|------|------|--------------|--------------------------|
| id           | BIGINT       | -     | 是   | 否   | -            | 配置ID                   |
| config_type  | VARCHAR      | 50    | -    | 否   | -            | 配置类型：ATTACHMENT/REJECT_REASON等 |
| config_key   | VARCHAR      | 100   | -    | 否   | -            | 配置键                   |
| config_value | VARCHAR      | 1000  | -    | 否   | -            | 配置值                   |
| description  | VARCHAR      | 500   | -    | 是   | -            | 配置说明                 |
| sort         | INTEGER      | -     | -    | 否   | 0            | 排序                     |
| enabled      | SMALLINT     | -     | -    | 否   | 1            | 是否启用                 |
| created_by   | BIGINT       | -     | -    | 是   | -            | 创建人ID                 |
| created_at   | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 创建时间           |
| updated_at   | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 更新时间           |

**唯一索引**：`uk_type_key` (config_type, config_key)
**普通索引**：`idx_config_type` (config_type)

---

### 11. 超时异常表 (timeout_exception)

| 字段名            | 类型         | 长度  | 主键 | 可空 | 默认值       | 说明                     |
|-------------------|--------------|-------|------|------|--------------|--------------------------|
| id                | BIGINT       | -     | 是   | 否   | -            | 主键ID                   |
| application_id    | BIGINT       | -     | -    | 否   | -            | 申请ID                   |
| application_no    | VARCHAR      | 32    | -    | 否   | -            | 申请单号（冗余）         |
| node_id           | BIGINT       | -     | -    | 否   | -            | 节点ID                   |
| node_name         | VARCHAR      | 100   | -    | 否   | -            | 节点名称（冗余）         |
| approver_id       | BIGINT       | -     | -    | 否   | -            | 审批人ID                 |
| status            | VARCHAR      | 32    | -    | 否   | NORMAL       | 状态：NORMAL/WARNING/TIMEOUT/HANDLED |
| timeout_hours     | INTEGER      | -     | -    | 否   | 24           | 超时时间（小时）         |
| expired_at        | TIMESTAMP    | -     | -    | 否   | -            | 超时时间点               |
| reminder_count    | INTEGER      | -     | -    | 否   | 0            | 提醒次数                 |
| last_reminder_at  | TIMESTAMP    | -     | -    | 是   | -            | 最后提醒时间             |
| handled_at        | TIMESTAMP    | -     | -    | 是   | -            | 处理时间                 |
| handled_by        | BIGINT       | -     | -    | 是   | -            | 处理人ID                 |
| created_at        | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 创建时间           |
| updated_at        | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 更新时间           |

**外键**：`fk_timeout_application` (application_id) → expense_application(id)
**普通索引**：`idx_status` (status)
**普通索引**：`idx_approver` (approver_id)
**普通索引**：`idx_expired_at` (expired_at)

---

### 12. 审计日志表 (audit_log)

| 字段名         | 类型         | 长度  | 主键 | 可空 | 默认值       | 说明                     |
|----------------|--------------|-------|------|------|--------------|--------------------------|
| id             | BIGINT       | -     | 是   | 否   | -            | 日志ID                   |
| operation      | VARCHAR      | 50    | -    | 否   | -            | 操作类型                 |
| operation_name | VARCHAR      | 100   | -    | 否   | -            | 操作名称                 |
| user_id        | BIGINT       | -     | -    | 是   | -            | 操作人ID                 |
| username       | VARCHAR      | 50    | -    | 是   | -            | 操作人用户名             |
| real_name      | VARCHAR      | 50    | -    | 是   | -            | 操作人真实姓名           |
| resource_type  | VARCHAR      | 50    | -    | 是   | -            | 资源类型                 |
| resource_id    | BIGINT       | -     | -    | 是   | -            | 资源ID                   |
| resource_name  | VARCHAR      | 200   | -    | 是   | -            | 资源名称                 |
| ip             | VARCHAR      | 50    | -    | 是   | -            | 操作IP                   |
| user_agent     | VARCHAR      | 500   | -    | 是   | -            | 浏览器UA                 |
| detail         | TEXT         | -     | -    | 是   | -            | 操作详情（JSON）         |
| created_at     | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 操作时间           |

**普通索引**：`idx_user_id` (user_id)
**普通索引**：`idx_operation` (operation)
**普通索引**：`idx_resource` (resource_type, resource_id)
**普通索引**：`idx_created_at` (created_at)

---

### 13. 变更记录表 (change_log)

| 字段名         | 类型         | 长度  | 主键 | 可空 | 默认值       | 说明                     |
|----------------|--------------|-------|------|------|--------------|--------------------------|
| id             | BIGINT       | -     | 是   | 否   | -            | 记录ID                   |
| change_type    | VARCHAR      | 50    | -    | 否   | -            | 变更类型                 |
| title          | VARCHAR      | 200   | -    | 否   | -            | 变更标题                 |
| content        | TEXT         | -     | -    | 否   | -            | 变更内容                 |
| effective_date | DATE         | -     | -    | 是   | -            | 生效日期                 |
| version        | VARCHAR      | 50    | -    | 是   | -            | 版本号                   |
| created_by     | BIGINT       | -     | -    | 否   | -            | 创建人ID                 |
| created_at     | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 创建时间           |
| updated_at     | TIMESTAMP    | -     | -    | 否   | CURRENT_TIMESTAMP | 更新时间           |

**普通索引**：`idx_change_type` (change_type)
**普通索引**：`idx_created_at` (created_at)

---

## 索引设计

### 主键索引

所有表均以 `id` 为主键，使用 BIGINT 类型，由雪花算法生成全局唯一ID。

### 唯一索引

| 表名               | 索引名          | 索引字段              |
|--------------------|-----------------|-----------------------|
| sys_user           | uk_username     | username, deleted     |
| sys_role           | uk_role_code    | role_code             |
| sys_user_role      | uk_user_role    | user_id, role_id      |
| expense_application| uk_application_no | application_no      |
| approval_config    | uk_type_key     | config_type, config_key |

### 普通索引（按查询场景设计）

| 表名               | 索引名          | 索引字段              | 使用场景                     |
|--------------------|-----------------|-----------------------|------------------------------|
| expense_application| idx_applicant   | applicant_id          | 按申请人查询申请列表         |
| expense_application| idx_status      | status                | 按状态筛选申请               |
| expense_application| idx_created_at  | created_at            | 按创建时间范围查询           |
| expense_application| idx_expense_type| expense_type          | 按费用类型筛选               |
| approval_record    | idx_application | application_id        | 查询申请的审批历史           |
| approval_record    | idx_approver    | approver_id           | 查询审批人的审批历史         |
| timeout_exception  | idx_status      | status                | 查询超时/待处理的审批        |
| timeout_exception  | idx_approver    | approver_id           | 查询审批人的超时记录         |
| audit_log          | idx_user_id     | user_id               | 查询用户的操作日志           |
| audit_log          | idx_operation   | operation             | 按操作类型筛选日志           |
| audit_log          | idx_resource    | resource_type, resource_id | 查询资源的变更历史       |
| approval_node      | idx_rule_order  | rule_id, node_order   | 按规则查询审批节点           |

---

## 初始化脚本

### 1. 建表脚本 (schema.sql)

```sql
-- 创建用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    real_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    department VARCHAR(100),
    status SMALLINT NOT NULL DEFAULT 1,
    avatar VARCHAR(255),
    deleted SMALLINT NOT NULL DEFAULT 0,
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_username UNIQUE (username, deleted)
);

-- 创建角色表
CREATE TABLE IF NOT EXISTS sys_role (
    id BIGINT PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    sort INTEGER NOT NULL DEFAULT 0,
    enabled SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_role_code UNIQUE (role_code)
);

-- 其他表创建语句...
```

### 2. 初始化数据脚本 (data.sql)

```sql
-- 初始化角色数据
INSERT INTO sys_role (id, role_code, role_name, description, sort) VALUES
(1, 'ADMIN', '系统管理员', '拥有系统所有权限', 1),
(2, 'FINANCE_MANAGER', '财务经理', '负责审批规则制定、额度管理', 2),
(3, 'APPROVER', '审批人', '负责审批费用申请', 3),
(4, 'APPLICANT', '申请人', '负责提交费用申请', 4)
ON CONFLICT (id) DO NOTHING;

-- 初始化管理员用户（密码: admin123，已BCrypt加密）
INSERT INTO sys_user (id, username, password, real_name, email, phone, department, status) VALUES
(1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '系统管理员', 'admin@example.com', '13800138000', 'IT部', 1),
(2, 'finance', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '财务经理', 'finance@example.com', '13800138001', '财务部', 1),
(3, 'approver', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '审批人', 'approver@example.com', '13800138002', '财务部', 1),
(4, 'applicant', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '申请人', 'applicant@example.com', '13800138003', '销售部', 1)
ON CONFLICT (id) DO NOTHING;

-- 初始化用户角色关联
INSERT INTO sys_user_role (id, user_id, role_id) VALUES
(1, 1, 1),
(2, 2, 2),
(3, 3, 3),
(4, 4, 4)
ON CONFLICT (id) DO NOTHING;

-- 初始化审批配置
INSERT INTO approval_config (id, config_type, config_key, config_value, description, sort) VALUES
-- 附件配置
(1, 'ATTACHMENT', 'allowed_types', 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx', '允许上传的文件类型', 1),
(2, 'ATTACHMENT', 'max_size', '10485760', '单个文件最大大小(字节)，默认10MB', 2),
(3, 'ATTACHMENT', 'max_count', '10', '最多上传文件数量', 3),
-- 退回原因配置
(10, 'REJECT_REASON', 'INCOMPLETE_DOCS', '资料不完整', '附件资料不完整，需要补充', 1),
(11, 'REJECT_REASON', 'EXCEED_BUDGET', '超出预算', '费用超出部门预算标准', 2),
(12, 'REJECT_REASON', 'NON_COMPLIANCE', '不符合规定', '不符合公司财务规定', 3),
(13, 'REJECT_REASON', 'INSUFFICIENT_INFO', '信息不足', '申请信息不够详细，请补充说明', 4),
-- 资源占用配置
(20, 'RESOURCE', 'CPU_THRESHOLD', '80', 'CPU使用率预警阈值(%)', 1),
(21, 'RESOURCE', 'MEMORY_THRESHOLD', '85', '内存使用率预警阈值(%)', 2),
(22, 'RESOURCE', 'DISK_THRESHOLD', '90', '磁盘使用率预警阈值(%)', 3)
ON CONFLICT (id) DO NOTHING;

-- 初始化审批规则
INSERT INTO approval_rule (id, name, expense_type, description, enabled, amount_from, amount_to, priority) VALUES
(1, '差旅费审批规则', 'TRAVEL', '差旅费审批流程，10000元以内', 1, 0, 10000, 1),
(2, '差旅费大额审批规则', 'TRAVEL', '差旅费审批流程，10000元以上', 1, 10000, 99999999.99, 2),
(3, '招待费审批规则', 'ENTERTAINMENT', '招待费审批流程', 1, 0, 99999999.99, 1),
(4, '办公费审批规则', 'OFFICE', '办公费审批流程', 1, 0, 99999999.99, 1)
ON CONFLICT (id) DO NOTHING;

-- 初始化审批节点
INSERT INTO approval_node (id, rule_id, node_name, node_order, approver_type, approver_role, timeout_hours) VALUES
-- 差旅费10000以内
(1, 1, '部门经理审批', 1, 'DEPT_MANAGER', NULL, 24),
(2, 1, '财务审核', 2, 'ROLE', 'FINANCE_MANAGER', 12),
-- 差旅费10000以上
(3, 2, '部门经理审批', 1, 'DEPT_MANAGER', NULL, 24),
(4, 2, '财务经理审批', 2, 'ROLE', 'FINANCE_MANAGER', 12),
(5, 2, '总经理审批', 3, 'ROLE', 'ADMIN', 24),
-- 招待费
(6, 3, '部门经理审批', 1, 'DEPT_MANAGER', NULL, 24),
(7, 3, '财务审核', 2, 'ROLE', 'FINANCE_MANAGER', 12),
-- 办公费
(8, 4, '部门经理审批', 1, 'DEPT_MANAGER', NULL, 24),
(9, 4, '财务审核', 2, 'ROLE', 'FINANCE_MANAGER', 12)
ON CONFLICT (id) DO NOTHING;
```

---

## 数据备份与恢复

### 1. 全量备份

```bash
#!/bin/bash
# 备份脚本 backup.sh

BACKUP_DIR="/var/backups/finance"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="finance_approval"
DB_USER="postgres"

mkdir -p $BACKUP_DIR

# 备份数据库（包含数据）
pg_dump -U $DB_USER -F c -b -v -f "$BACKUP_DIR/${DB_NAME}_${DATE}.dump" $DB_NAME

# 备份数据库（SQL格式）
pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"

# 备份上传文件
tar -czf "$BACKUP_DIR/uploads_${DATE}.tar.gz" /opt/finance-app/uploads/

# 删除7天前的备份
find $BACKUP_DIR -name "*.dump" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### 2. 增量备份（WAL归档）

```bash
# postgresql.conf 配置
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/archive/%f && cp %p /var/lib/postgresql/archive/%f'
max_wal_senders = 3
```

### 3. 数据恢复

```bash
#!/bin/bash
# 恢复脚本 restore.sh

BACKUP_FILE="/var/backups/finance/finance_approval_20240115_020000.dump"
DB_NAME="finance_approval"
DB_USER="postgres"

# 停止应用服务
systemctl stop finance-app

# 断开所有连接
psql -U $DB_USER -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME';"

# 删除旧数据库
psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"

# 创建新数据库
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

# 恢复数据
pg_restore -U $DB_USER -d $DB_NAME -v "$BACKUP_FILE"

# 启动应用服务
systemctl start finance-app

echo "Restore completed"
```

### 4. 定时备份配置

```bash
# 编辑crontab
crontab -e

# 每天凌晨2点执行全量备份
0 2 * * * /opt/finance-app/backup.sh >> /var/log/finance/backup.log 2>&1

# 每小时检查归档状态
0 * * * * /opt/finance-app/check_archive.sh >> /var/log/finance/archive.log 2>&1
```

---

**文档版本**: v1.0
**最后更新**: 2024-01-15
