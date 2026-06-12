# API接口文档

## 目录

1. [通用说明](#通用说明)
2. [认证接口](#认证接口)
3. [用户管理接口](#用户管理接口)
4. [费用申请接口](#费用申请接口)
5. [审批接口](#审批接口)
6. [审批规则接口](#审批规则接口)
7. [配置管理接口](#配置管理接口)
8. [附件管理接口](#附件管理接口)
9. [审计日志接口](#审计日志接口)
10. [超时监控接口](#超时监控接口)
11. [仪表板接口](#仪表板接口)
12. [变更记录接口](#变更记录接口)
13. [数据字典](#数据字典)

## 通用说明

### 基础信息

- **Base URL**: `http://localhost:8080/api`
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token (JWT)

### 请求头

| 名称              | 类型   | 必填 | 说明                          |
|-------------------|--------|------|-------------------------------|
| Authorization     | string | 是   | Bearer {access_token}         |
| Content-Type      | string | 是   | application/json              |
| X-Requested-With  | string | 否   | XMLHttpRequest                |

### 响应格式

所有接口统一返回格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": 1703123456789
}
```

### 分页响应格式

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "size": 10,
    "pages": 10
  },
  "timestamp": 1703123456789
}
```

### 错误码说明

| 错误码 | 说明                       |
|--------|----------------------------|
| 200    | 操作成功                   |
| 400    | 请求参数错误               |
| 401    | 未认证或Token过期          |
| 403    | 无权限访问                 |
| 404    | 资源不存在                 |
| 500    | 服务器内部错误             |
| 1001   | 用户名或密码错误           |
| 1002   | Token已过期                |
| 1003   | Token无效                  |
| 2001   | 申请单不存在               |
| 2002   | 申请单状态不允许当前操作   |
| 3001   | 文件格式不支持             |
| 3002   | 文件大小超出限制           |

---

## 认证接口

### 1. 用户登录

**POST** `/auth/login`

**请求参数：**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

| 参数     | 类型   | 必填 | 说明   |
|----------|--------|------|--------|
| username | string | 是   | 用户名 |
| password | string | 是   | 密码   |

**响应示例：**

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "username": "admin",
      "realName": "系统管理员",
      "email": "admin@example.com",
      "phone": "13800138000",
      "roles": ["ADMIN"]
    }
  },
  "timestamp": 1703123456789
}
```

### 2. 用户登出

**POST** `/auth/logout`

**响应示例：**

```json
{
  "code": 200,
  "message": "登出成功",
  "data": null,
  "timestamp": 1703123456789
}
```

### 3. 获取当前用户信息

**GET** `/auth/me`

**响应示例：**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "id": 1,
    "username": "admin",
    "realName": "系统管理员",
    "email": "admin@example.com",
    "phone": "13800138000",
    "department": "IT部",
    "roles": ["ADMIN"],
    "permissions": ["user:list", "user:create", "..."]
  },
  "timestamp": 1703123456789
}
```

### 4. 修改密码

**POST** `/auth/change-password`

**请求参数：**

```json
{
  "oldPassword": "admin123",
  "newPassword": "newPass123",
  "confirmPassword": "newPass123"
}
```

---

## 用户管理接口

### 1. 获取用户列表

**GET** `/users`

**请求参数：**

| 参数       | 类型    | 必填 | 说明         | 默认值 |
|------------|---------|------|--------------|--------|
| page       | integer | 否   | 页码         | 1      |
| size       | integer | 否   | 每页条数     | 10     |
| keyword    | string  | 否   | 搜索关键词   | -      |
| roleCode   | string  | 否   | 角色编码     | -      |
| status     | integer | 否   | 状态(0禁用/1启用) | - |

**响应示例：**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "list": [
      {
        "id": 1,
        "username": "admin",
        "realName": "系统管理员",
        "email": "admin@example.com",
        "phone": "13800138000",
        "department": "IT部",
        "status": 1,
        "roles": ["ADMIN"],
        "createdAt": "2024-01-01 10:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "size": 10,
    "pages": 10
  },
  "timestamp": 1703123456789
}
```

### 2. 创建用户

**POST** `/users`

**请求参数：**

```json
{
  "username": "zhangsan",
  "password": "123456",
  "realName": "张三",
  "email": "zhangsan@example.com",
  "phone": "13900139000",
  "department": "财务部",
  "roleCodes": ["APPROVER"],
  "status": 1
}
```

### 3. 更新用户

**PUT** `/users/{id}`

### 4. 删除用户

**DELETE** `/users/{id}`

### 5. 获取用户详情

**GET** `/users/{id}`

### 6. 重置用户密码

**POST** `/users/{id}/reset-password`

**响应示例：**

```json
{
  "code": 200,
  "message": "密码已重置为: 123456",
  "data": "123456",
  "timestamp": 1703123456789
}
```

### 7. 启用/禁用用户

**PUT** `/users/{id}/status`

**请求参数：**

```json
{
  "status": 0
}
```

---

## 费用申请接口

### 1. 获取申请列表

**GET** `/applications`

**请求参数：**

| 参数         | 类型    | 必填 | 说明                     | 默认值 |
|--------------|---------|------|--------------------------|--------|
| page         | integer | 否   | 页码                     | 1      |
| size         | integer | 否   | 每页条数                 | 10     |
| applicationNo| string  | 否   | 申请单号                 | -      |
| expenseType  | string  | 否   | 费用类型                 | -      |
| status       | string  | 否   | 状态                     | -      |
| startDate    | string  | 否   | 开始日期(yyyy-MM-dd)     | -      |
| endDate      | string  | 否   | 结束日期(yyyy-MM-dd)     | -      |
| applicantId  | long    | 否   | 申请人ID(管理员用)       | -      |
| myPending    | boolean | 否   | 只看我待审批的           | false  |
| mySubmitted  | boolean | 否   | 只看我提交的             | false  |

**响应示例：**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "list": [
      {
        "id": 1,
        "applicationNo": "FA2024010001",
        "title": "差旅费报销-北京出差",
        "expenseType": "TRAVEL",
        "expenseTypeName": "差旅费",
        "amount": 5000.00,
        "status": "PENDING_APPROVAL",
        "statusName": "待审批",
        "applicantId": 5,
        "applicantName": "张三",
        "applicantDept": "销售部",
        "currentNode": "部门经理审批",
        "currentApprover": "李四",
        "createdAt": "2024-01-15 10:30:00",
        "attachmentCount": 3
      }
    ],
    "total": 50,
    "page": 1,
    "size": 10,
    "pages": 5
  },
  "timestamp": 1703123456789
}
```

### 2. 创建申请

**POST** `/applications`

**请求参数：**

```json
{
  "title": "差旅费报销-北京出差",
  "expenseType": "TRAVEL",
  "amount": 5000.00,
  "startDate": "2024-01-10",
  "endDate": "2024-01-15",
  "description": "前往北京参加客户会议，包含机票、住宿、餐饮等费用",
  "attachmentIds": [101, 102, 103],
  "detailItems": [
    {
      "itemName": "机票",
      "amount": 2000.00,
      "description": "上海-北京往返机票"
    },
    {
      "itemName": "住宿",
      "amount": 2000.00,
      "description": "5晚酒店住宿"
    },
    {
      "itemName": "餐饮",
      "amount": 1000.00,
      "description": "出差期间餐饮费用"
    }
  ]
}
```

### 3. 更新申请

**PUT** `/applications/{id}`

> 仅草稿状态可更新

### 4. 获取申请详情

**GET** `/applications/{id}`

**响应示例：**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "id": 1,
    "applicationNo": "FA2024010001",
    "title": "差旅费报销-北京出差",
    "expenseType": "TRAVEL",
    "expenseTypeName": "差旅费",
    "amount": 5000.00,
    "startDate": "2024-01-10",
    "endDate": "2024-01-15",
    "description": "前往北京参加客户会议",
    "status": "PENDING_APPROVAL",
    "statusName": "待审批",
    "applicant": {
      "id": 5,
      "username": "zhangsan",
      "realName": "张三",
      "department": "销售部"
    },
    "detailItems": [...],
    "attachments": [
      {
        "id": 101,
        "fileName": "机票行程单.pdf",
        "fileSize": 102400,
        "fileType": "pdf",
        "fileUrl": "/uploads/2024/01/xxx.pdf",
        "uploadedAt": "2024-01-15 10:25:00"
      }
    ],
    "approvalRecords": [
      {
        "id": 1,
        "nodeName": "提交申请",
        "approverName": "张三",
        "action": "SUBMIT",
        "actionName": "提交",
        "comment": "提交申请",
        "createdAt": "2024-01-15 10:30:00"
      },
      {
        "id": 2,
        "nodeName": "部门经理审批",
        "approverName": "李四",
        "action": "PENDING",
        "actionName": "待审批",
        "comment": null,
        "createdAt": "2024-01-15 10:30:00"
      }
    ],
    "currentNodeIndex": 1,
    "canApprove": true,
    "canEdit": false,
    "canDelete": false,
    "canWithdraw": true,
    "createdAt": "2024-01-15 10:30:00",
    "updatedAt": "2024-01-15 10:30:00"
  },
  "timestamp": 1703123456789
}
```

### 5. 删除申请

**DELETE** `/applications/{id}`

> 仅草稿或已撤回状态可删除

### 6. 提交申请

**POST** `/applications/{id}/submit`

### 7. 撤回申请

**POST** `/applications/{id}/withdraw`

**请求参数：**

```json
{
  "reason": "需要修改金额"
}
```

---

## 审批接口

### 1. 获取待我审批列表

**GET** `/approvals/pending`

**请求参数：** 同申请列表

### 2. 获取我已审批列表

**GET** `/approvals/approved`

### 3. 审批

**POST** `/approvals/{applicationId}`

**请求参数：**

```json
{
  "action": "APPROVE",
  "comment": "同意报销，费用合理",
  "nextApproverId": null
}
```

| 参数           | 类型   | 必填 | 说明                             |
|----------------|--------|------|----------------------------------|
| action         | string | 是   | APPROVE(同意)/REJECT(退回)/TRANSFER(转交) |
| comment        | string | 否   | 审批意见                         |
| nextApproverId | long   | 否   | 转交时指定下一个审批人            |
| rejectReason   | string | 否   | 退回原因编码（退回时必填）        |

**响应示例：**

```json
{
  "code": 200,
  "message": "审批成功",
  "data": {
    "applicationId": 1,
    "newStatus": "APPROVED",
    "nextNode": "财务审核"
  },
  "timestamp": 1703123456789
}
```

### 4. 批量审批

**POST** `/approvals/batch`

**请求参数：**

```json
{
  "applicationIds": [1, 2, 3],
  "action": "APPROVE",
  "comment": "统一审批通过"
}
```

### 5. 获取审批记录

**GET** `/approvals/{applicationId}/records`

---

## 审批规则接口

### 1. 获取规则列表

**GET** `/approval-rules`

**请求参数：**

| 参数        | 类型    | 必填 | 说明         |
|-------------|---------|------|--------------|
| expenseType | string  | 否   | 费用类型     |
| enabled     | boolean | 否   | 是否启用     |

**响应示例：**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": [
    {
      "id": 1,
      "name": "差旅费审批规则",
      "expenseType": "TRAVEL",
      "expenseTypeName": "差旅费",
      "description": "差旅费审批流程",
      "enabled": true,
      "amountFrom": 0,
      "amountTo": 10000,
      "nodes": [
        {
          "id": 1,
          "nodeName": "部门经理审批",
          "nodeOrder": 1,
          "approverType": "DEPT_MANAGER",
          "timeoutHours": 24,
          "canTransfer": true,
          "canDelegate": true
        },
        {
          "id": 2,
          "nodeName": "财务审核",
          "nodeOrder": 2,
          "approverType": "ROLE",
          "approverRole": "FINANCE_MANAGER",
          "timeoutHours": 12,
          "canTransfer": true,
          "canDelegate": false
        }
      ],
      "createdAt": "2024-01-01 10:00:00"
    }
  ],
  "timestamp": 1703123456789
}
```

### 2. 创建规则

**POST** `/approval-rules`

**请求参数：**

```json
{
  "name": "差旅费审批规则",
  "expenseType": "TRAVEL",
  "description": "差旅费审批流程",
  "enabled": true,
  "amountFrom": 0,
  "amountTo": 10000,
  "nodes": [
    {
      "nodeName": "部门经理审批",
      "nodeOrder": 1,
      "approverType": "DEPT_MANAGER",
      "timeoutHours": 24,
      "canTransfer": true
    }
  ]
}
```

### 3. 更新规则

**PUT** `/approval-rules/{id}`

### 4. 删除规则

**DELETE** `/approval-rules/{id}`

### 5. 启用/禁用规则

**PUT** `/approval-rules/{id}/status`

**请求参数：**

```json
{
  "enabled": false
}
```

---

## 配置管理接口

### 1. 获取配置列表

**GET** `/configs`

**请求参数：**

| 参数       | 类型   | 必填 | 说明         |
|------------|--------|------|--------------|
| configType | string | 是   | 配置类型     |

**configType 说明：**
- `ATTACHMENT` - 附件配置
- `REJECT_REASON` - 退回原因配置
- `RESOURCE` - 资源占用配置
- `CALIBER_CHANGE` - 口径变更说明

**响应示例（附件配置）：**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": [
    {
      "id": 1,
      "configType": "ATTACHMENT",
      "configKey": "allowed_types",
      "configValue": "jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx",
      "description": "允许上传的文件类型",
      "sort": 1,
      "enabled": true
    },
    {
      "id": 2,
      "configType": "ATTACHMENT",
      "configKey": "max_size",
      "configValue": "10485760",
      "description": "单个文件最大大小(字节)",
      "sort": 2,
      "enabled": true
    },
    {
      "id": 3,
      "configType": "ATTACHMENT",
      "configKey": "max_count",
      "configValue": "10",
      "description": "最多上传文件数量",
      "sort": 3,
      "enabled": true
    }
  ],
  "timestamp": 1703123456789
}
```

### 2. 保存配置

**POST** `/configs`

**请求参数：**

```json
{
  "configType": "ATTACHMENT",
  "configs": [
    {
      "configKey": "allowed_types",
      "configValue": "jpg,jpeg,png,gif,pdf",
      "description": "允许上传的文件类型",
      "sort": 1,
      "enabled": true
    }
  ]
}
```

### 3. 获取所有配置（按类型分组）

**GET** `/configs/all`

**响应示例：**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "ATTACHMENT": [...],
    "REJECT_REASON": [
      {
        "id": 10,
        "configType": "REJECT_REASON",
        "configKey": "INCOMPLETE_DOCS",
        "configValue": "资料不完整",
        "description": "附件资料不完整，需要补充",
        "sort": 1,
        "enabled": true
      }
    ],
    "RESOURCE": [...],
    "CALIBER_CHANGE": [...]
  },
  "timestamp": 1703123456789
}
```

---

## 附件管理接口

### 1. 上传附件

**POST** `/attachments/upload`

**Content-Type**: `multipart/form-data`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是   | 文件 |

**响应示例：**

```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "id": 101,
    "fileName": "机票行程单.pdf",
    "originalName": "机票行程单.pdf",
    "fileSize": 102400,
    "fileType": "pdf",
    "fileUrl": "/uploads/2024/01/abc123.pdf",
    "uploadedBy": 1,
    "uploadedAt": "2024-01-15 10:25:00"
  },
  "timestamp": 1703123456789
}
```

### 2. 批量上传

**POST** `/attachments/batch-upload`

**Content-Type**: `multipart/form-data`

### 3. 下载附件

**GET** `/attachments/{id}/download`

### 4. 预览附件

**GET** `/attachments/{id}/preview`

### 5. 删除附件

**DELETE** `/attachments/{id}`

---

## 审计日志接口

### 1. 获取审计日志列表

**GET** `/audit-logs`

**请求参数：**

| 参数         | 类型    | 必填 | 说明         |
|--------------|---------|------|--------------|
| page         | integer | 否   | 页码         |
| size         | integer | 否   | 每页条数     |
| operation    | string  | 否   | 操作类型     |
| username     | string  | 否   | 操作人       |
| startDate    | string  | 否   | 开始日期     |
| endDate      | string  | 否   | 结束日期     |
| resourceType | string  | 否   | 资源类型     |

**响应示例：**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "list": [
      {
        "id": 1,
        "operation": "CREATE_APPLICATION",
        "operationName": "创建申请",
        "username": "zhangsan",
        "realName": "张三",
        "resourceType": "APPLICATION",
        "resourceId": 1,
        "resourceName": "FA2024010001",
        "ip": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "detail": "{\"title\":\"差旅费报销\",\"amount\":5000}",
        "createdAt": "2024-01-15 10:30:00"
      }
    ],
    "total": 1000,
    "page": 1,
    "size": 10,
    "pages": 100
  },
  "timestamp": 1703123456789
}
```

### 2. 获取日志详情

**GET** `/audit-logs/{id}`

### 3. 导出审计日志

**GET** `/audit-logs/export`

---

## 超时监控接口

### 1. 获取超时列表

**GET** `/timeouts`

**请求参数：**

| 参数          | 类型    | 必填 | 说明         |
|---------------|---------|------|--------------|
| page          | integer | 否   | 页码         |
| size          | integer | 否   | 每页条数     |
| status        | string  | 否   | 超时状态     |
| applicationNo | string  | 否   | 申请单号     |
| nodeName      | string  | 否   | 节点名称     |

**status 说明：**
- `WARNING` - 即将超时
- `TIMEOUT` - 已超时
- `HANDLED` - 已处理

**响应示例：**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "list": [
      {
        "id": 1,
        "applicationId": 1,
        "applicationNo": "FA2024010001",
        "applicationTitle": "差旅费报销-北京出差",
        "nodeId": 2,
        "nodeName": "部门经理审批",
        "approverId": 3,
        "approverName": "李四",
        "status": "TIMEOUT",
        "statusName": "已超时",
        "timeoutHours": 24,
        "expiredAt": "2024-01-16 10:30:00",
        "reminderCount": 3,
        "lastReminderAt": "2024-01-16 09:00:00",
        "affectedObjects": [
          {
            "type": "APPLICANT",
            "userId": 5,
            "userName": "张三",
            "message": "您的申请审批超时，请耐心等待或联系审批人"
          },
          {
            "type": "APPROVER",
            "userId": 3,
            "userName": "李四",
            "message": "您有待处理的审批已超时，请及时处理"
          }
        ],
        "timeLimit": "24小时"
      }
    ],
    "total": 25,
    "page": 1,
    "size": 10,
    "pages": 3
  },
  "timestamp": 1703123456789
}
```

### 2. 发送超时提醒

**POST** `/timeouts/{id}/remind`

### 3. 批量发送提醒

**POST** `/timeouts/batch-remind`

### 4. 超时统计

**GET** `/timeouts/statistics`

**响应示例：**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "warningCount": 5,
    "timeoutCount": 3,
    "handledCount": 17,
    "totalCount": 25,
    "avgHandlingTime": 18.5,
    "topTimeoutApprovers": [
      {"userId": 3, "userName": "李四", "timeoutCount": 3},
      {"userId": 7, "userName": "王五", "timeoutCount": 2}
    ]
  },
  "timestamp": 1703123456789
}
```

---

## 仪表板接口

### 1. 获取概览数据

**GET** `/dashboard/overview`

**响应示例：**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "pendingCount": 15,
    "todaySubmittedCount": 8,
    "todayApprovedCount": 12,
    "todayRejectedCount": 2,
    "timeoutCount": 3,
    "monthlyAmount": 125000.00,
    "monthlyCount": 45,
    "approvalEfficiency": {
      "avgHours": 12.5,
      "within24hRate": 85.5,
      "timeoutRate": 6.7
    },
    "topExpenseTypes": [
      {"type": "TRAVEL", "name": "差旅费", "amount": 55000, "count": 18},
      {"type": "ENTERTAINMENT", "name": "招待费", "amount": 32000, "count": 12}
    ]
  },
  "timestamp": 1703123456789
}
```

### 2. 获取趋势数据

**GET** `/dashboard/trend`

**请求参数：**

| 参数   | 类型   | 必填 | 说明               |
|--------|--------|------|--------------------|
| type   | string | 否   | daily/weekly/monthly |
| days   | int    | 否   | 天数（type=daily时） |

**响应示例：**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": [
    {
      "date": "2024-01-10",
      "submittedCount": 5,
      "approvedCount": 3,
      "rejectedCount": 1,
      "totalAmount": 8500.00
    }
  ],
  "timestamp": 1703123456789
}
```

---

## 变更记录接口

### 1. 获取口径变更列表

**GET** `/change-logs`

**请求参数：**

| 参数       | 类型    | 必填 | 说明         |
|------------|---------|------|--------------|
| page       | integer | 否   | 页码         |
| size       | integer | 否   | 每页条数     |
| changeType | string  | 否   | 变更类型     |
| keyword    | string  | 否   | 搜索关键词   |

**响应示例：**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "list": [
      {
        "id": 1,
        "changeType": "CALIBER_CHANGE",
        "changeTypeName": "口径变更",
        "title": "差旅费住宿费标准调整",
        "content": "自2024年2月1日起，一线城市住宿费标准调整为500元/天，二线城市调整为400元/天",
        "effectiveDate": "2024-02-01",
        "version": "v2.1",
        "createdBy": "admin",
        "createdByName": "系统管理员",
        "createdAt": "2024-01-15 10:00:00"
      }
    ],
    "total": 10,
    "page": 1,
    "size": 10,
    "pages": 1
  },
  "timestamp": 1703123456789
}
```

### 2. 创建变更记录

**POST** `/change-logs`

**请求参数：**

```json
{
  "changeType": "CALIBER_CHANGE",
  "title": "差旅费住宿费标准调整",
  "content": "自2024年2月1日起...",
  "effectiveDate": "2024-02-01",
  "version": "v2.1"
}
```

### 3. 更新变更记录

**PUT** `/change-logs/{id}`

### 4. 删除变更记录

**DELETE** `/change-logs/{id}`

---

## 数据字典

### 1. 费用类型 (ExpenseType)

| 编码          | 名称   |
|---------------|--------|
| TRAVEL        | 差旅费 |
| ENTERTAINMENT | 招待费 |
| OFFICE        | 办公费 |
| TRANSPORT     | 交通费 |
| COMMUNICATION | 通讯费 |
| TRAINING      | 培训费 |
| OTHER         | 其他   |

### 2. 申请状态 (ApplicationStatus)

| 编码               | 名称         |
|--------------------|--------------|
| DRAFT              | 草稿         |
| PENDING_APPROVAL   | 待审批       |
| APPROVING          | 审批中       |
| APPROVED           | 已通过       |
| REJECTED           | 已退回       |
| WITHDRAWN          | 已撤回       |
| PAID               | 已付款       |
| ARCHIVED           | 已归档       |

### 3. 审批动作 (ApprovalAction)

| 编码     | 名称   |
|----------|--------|
| SUBMIT   | 提交   |
| APPROVE  | 同意   |
| REJECT   | 退回   |
| TRANSFER | 转交   |
| DELEGATE | 委托   |
| WITHDRAW | 撤回   |

### 4. 角色编码 (RoleCode)

| 编码            | 名称         |
|-----------------|--------------|
| ADMIN           | 系统管理员   |
| FINANCE_MANAGER | 财务经理     |
| APPROVER        | 审批人       |
| APPLICANT       | 申请人       |

### 5. 超时状态 (TimeoutStatus)

| 编码     | 名称     |
|----------|----------|
| NORMAL   | 正常     |
| WARNING  | 即将超时 |
| TIMEOUT  | 已超时   |
| HANDLED  | 已处理   |

---

**文档版本**: v1.0
**最后更新**: 2024-01-15
