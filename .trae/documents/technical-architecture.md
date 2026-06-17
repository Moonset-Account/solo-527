# 联合办公房源租约账单系统 - 技术架构文档

## 1. 技术选型

### 1.1 前端技术栈
- **框架**: Nuxt 3 (Vue 3 + Vite)
- **UI 组件库**: Naive UI
- **状态管理**: Pinia
- **路由**: Nuxt 内置路由
- **HTTP 客户端**: Axios
- **类型系统**: TypeScript

### 1.2 后端技术栈
- **Web 框架**: FastAPI
- **数据库**: PostgreSQL
- **ORM**: SQLAlchemy
- **数据库迁移**: Alembic
- **任务队列**: Celery + Redis
- **认证**: JWT (PyJWT
- **密码加密**: passlib + bcrypt

### 1.3 部署与运维
- **Python 版本**: Python 3.11+
- **Node.js 版本**: Node.js 18+
- **包管理**: pip + npm/pnpm

---

## 2. 系统架构

### 2.1 整体架构图

```
                    ┌─────────────────┐
                    │   前端 (Nuxt3)│
                    │   Naive UI    │
                    └────────┬─────┘
                             │ HTTPS
                             ▼
                    ┌─────────────────┐
                    │  API Gateway     │
                    │  (FastAPI)      │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │  认证模块  │  │  业务模块  │  │  管理模块  │
    └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
      ┌──────────────┐          ┌──────────────┐
      │  PostgreSQL  │          │    Redis     │
      │  (主数据)     │          │  (缓存/队列)   │
      └──────────────┘          └──────┬───────┘
                                   │
                                   ▼
                            ┌──────────────┐
                            │   Celery    │
                            │  (异步任务)  │
                            └──────────────┘
```

### 2.2 模块划分

#### 后端模块
- `app/api: API 路由层
- `app/services`: 业务逻辑层
- `app/models`: 数据模型层
- `app/schemas`: Pydantic 数据校验
- `app/core`: 核心配置与工具
- `app/middleware`: 中间件
- `app/tasks`: Celery 异步任务
- `alembic`: 数据库迁移

#### 前端模块
- `pages/`: 页面路由
- `components/`: 可复用组件
- `stores/`: Pinia 状态管理
- `composables/`: 组合式函数
- `api/`: API 请求封装
- `types/`: TypeScript 类型定义
- `utils/`: 工具函数

---

## 3. 数据库设计

### 3.1 核心数据表

#### 用户与权限
- `users`: 用户表
- `roles`: 角色表
- `permissions`: 权限表
- `user_roles`: 用户角色关联表
- `role_permissions`: 角色权限关联表

#### 业务数据
- `properties`: 房源表
- `tenants`: 租客表
- `owners`: 业主表
- `leases`: 租约表
- `bills`: 账单表
- `bill_payments`: 账单支付记录
- `exception_orders`: 异常单表
- `follow_up_records`: 跟进记录表

#### 系统配置
- `dictionaries`: 字段字典表
- `dictionary_items`: 字典项表
- `validation_rules`: 校验规则表

#### 审计日志
- `operation_logs`: 操作日志表

### 3.2 ER 关系概览

```
users ─── user_roles ─── roles ─── role_permissions ─── permissions

properties ─┐
              ├── leases ── bills ── bill_payments
tenants ────┘           │
                         └── exception_orders

owners ─── properties

leases ─── follow_up_records ─── users

dictionaries ─── dictionary_items
```

---

## 4. API 设计

### 4.1 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 4.2 用户管理接口
- `GET /api/users` - 用户列表
- `POST /api/users` - 创建用户
- `GET /api/users/{id}` - 用户详情
- `PUT /api/users/{id}` - 更新用户
- `DELETE /api/users/{id}` - 删除用户

### 4.3 租约管理接口
- `GET /api/leases` - 租约列表
- `POST /api/leases` - 创建租约
- `GET /api/leases/{id}` - 租约详情
- `PUT /api/leases/{id}` - 更新租约
- `DELETE /api/leases/{id}` - 删除租约

### 4.4 账单管理接口
- `GET /api/bills` - 账单列表
- `POST /api/bills` - 创建账单
- `GET /api/bills/{id}` - 账单详情
- `PUT /api/bills/{id}` - 更新账单
- `POST /api/bills/generate` - 批量生成账单
- `GET /api/bills/export` - 导出账单
- `GET /api/bills/collection-progress` - 收租进度

### 4.5 异常单接口
- `GET /api/exception-orders` - 异常单列表
- `POST /api/exception-orders` - 创建异常单
- `GET /api/exception-orders/{id}` - 异常单详情
- `PUT /api/exception-orders/{id}` - 更新异常单
- `POST /api/exception-orders/{id}/resolve` - 办结异常单

### 4.6 字典管理接口
- `GET /api/dictionaries` - 字典列表
- `POST /api/dictionaries` - 创建字典
- `GET /api/dictionaries/{code}` - 字典详情
- `PUT /api/dictionaries/{code}` - 更新字典
- `GET /api/dictionaries/{code}/items` - 字典项列表

### 4.7 校验规则接口
- `GET /api/validation-rules` - 规则列表
- `POST /api/validation-rules` - 创建规则
- `PUT /api/validation-rules/{id}` - 更新规则
- `POST /api/validation-rules/validate` - 执行校验

---

## 5. 关键技术实现

### 5.1 认证与授权
- 使用 JWT Token 认证
- 基于角色的权限控制（RBAC）
- 密码使用 bcrypt 加密
- Token 刷新机制

### 5.2 操作留痕
- 数据库层面实现软删除
- 创建/更新自动记录时间和操作人
- 关键操作写入 operation_logs 表

### 5.3 异步任务处理
- Celery + Redis 作为消息代理
- 账单批量生成异步处理
- 导出任务异步处理

### 5.4 字段字典
- 字典数据缓存到 Redis
- 字典版本管理
- 字典变更记录

---

## 6. 项目目录结构

### 后端目录结构：

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── leases.py
│   │       ├── bills.py
│   │       ├── exception_orders.py
│   │       ├── dictionaries.py
│   │       ├── validation_rules.py
│   │       └── operation_logs.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── security.py
│   │   └── database.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── lease.py
│   │   ├── bill.py
│   │   ├── exception_order.py
│   │   ├── dictionary.py
│   │   └── base.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── lease.py
│   │   ├── bill.py
│   │   ├── exception_order.py
│   │   ├── dictionary.py
│   │   └── common.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   ├── lease_service.py
│   │   ├── bill_service.py
│   │   ├── exception_service.py
│   │   └── dictionary_service.py
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── celery_app.py
│   │   ├── bill_tasks.py
│   │   └── notification_tasks.py
│   └── middleware/
│       ├── __init__.py
│       └── audit.py
├── alembic/
│   ├── versions/
│   └── env.py
├── requirements.txt
├── .env.example
└── alembic.ini
```

### 前端目录结构：

```
frontend/
├── pages/
│   ├── index.vue
│   ├── login.vue
│   ├── leases/
│   │   ├── index.vue
│   │   └── [id].vue
│   ├── bills/
│   │   ├── index.vue
│   │   └── [id].vue
│   ├── exception-orders/
│   │   ├── index.vue
│   │   └── [id].vue
│   └── admin/
│       ├── users.vue
│       ├── dictionaries.vue
│       ├── validation-rules.vue
│       └── operation-logs.vue
├── components/
│   ├── layout/
│   ├── common/
│   └── forms/
├── stores/
│   ├── user.ts
│   └── app.ts
├── composables/
│   ├── useApi.ts
│   └── useAuth.ts
├── api/
│   ├── auth.ts
│   ├── lease.ts
│   ├── bill.ts
│   └── ...
├── types/
│   ├── index.ts
│   ├── user.ts
│   ├── lease.ts
│   └── ...
├── utils/
│   └── ...
├── nuxt.config.ts
├── package.json
└── tsconfig.json
```
