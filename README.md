# 工单排产计划台

一个基于 AdonisJS + Vue 3 + PostgreSQL + Redis 的小批量工单排产管理系统。

## 功能特性

### 核心功能
- **工单管理**：工单的增删改查，支持按日期、状态、责任人过滤
- **排产计划**：日历视图和列表视图双重展示，支持排产调整
- **物料齐套**：物料库存管理，工单物料齐套检查，库存预警
- **返工管理**：返工记录登记，原因统计分析
- **产量工时**：生产数据录入，产量趋势图表，工时统计
- **交期风险**：风险识别与预警，风险处理流程，风险报表

### 权限体系
- **管理员 (admin)**：全部权限，包括用户管理、操作日志查看
- **版房负责人 (workshop_manager)**：工单和排产管理，风险处理
- **计划员 (planner)**：查看权限，数据查询和报表查看

### 安全特性
- JWT Token 认证
- 接口参数校验
- 角色权限控制
- 操作日志记录（风险相关操作留痕）
- 生产库/测试库环境隔离

### 技术栈
- **后端**：AdonisJS v5 + TypeScript
- **前端**：Vue 3 + Vite + Element Plus + ECharts
- **数据库**：PostgreSQL
- **缓存**：Redis

## 项目结构

```
.
├── backend/                 # AdonisJS 后端
│   ├── app/
│   │   ├── Controllers/Http/   # 控制器
│   │   ├── Middleware/         # 中间件
│   │   ├── Models/             # 数据模型
│   │   ├── Policies/           # Bouncer 权限策略
│   │   ├── Validators/         # 验证器
│   │   └── Exceptions/         # 异常处理
│   ├── config/               # 配置文件
│   ├── database/
│   │   ├── migrations/       # 数据库迁移
│   │   └── seeders/          # 种子数据
│   ├── start/                # 启动文件（路由、内核等）
│   ├── .env                  # 生产环境配置
│   └── .env.testing          # 测试环境配置
│
└── frontend/               # Vue 3 前端
    ├── src/
    │   ├── api/              # API 接口
    │   ├── layouts/          # 布局组件
    │   ├── views/            # 页面视图
    │   ├── router/           # 路由
    │   ├── stores/           # Pinia 状态管理
    │   └── styles/           # 全局样式
    └── index.html
```

## 快速开始

### 环境要求
- Node.js >= 16.x
- PostgreSQL >= 13.x
- Redis >= 6.x

### 1. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 2. 配置数据库

在 `backend/.env` 中配置 PostgreSQL 和 Redis 连接信息：

```env
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_password
PG_DB_NAME=work_order_scheduling

REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. 运行数据库迁移和种子数据

```bash
cd backend

# 运行迁移
node ace migration:run

# 填充种子数据
node ace db:seed
```

### 4. 启动服务

```bash
# 启动后端 (端口 3333)
cd backend
npm run dev

# 启动前端 (端口 5173)
cd frontend
npm run dev
```

### 5. 访问应用

打开浏览器访问 http://localhost:5173

### 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@example.com | admin123 |
| 版房负责人 | manager@example.com | manager123 |
| 计划员 | planner@example.com | planner123 |

## API 接口

### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/me` - 获取当前用户信息

### 工单
- `GET /api/work-orders` - 工单列表
- `GET /api/work-orders/:id` - 工单详情
- `POST /api/work-orders` - 创建工单
- `PUT /api/work-orders/:id` - 更新工单
- `DELETE /api/work-orders/:id` - 删除工单
- `PATCH /api/work-orders/:id/status` - 更新工单状态
- `GET /api/work-orders/:id/materials` - 工单物料列表

### 排产
- `GET /api/schedules` - 排产列表
- `GET /api/schedules/calendar` - 排产日历
- `POST /api/schedules` - 创建排产
- `PUT /api/schedules/:id` - 更新排产
- `PATCH /api/schedules/:id/adjust` - 调整排产（风险操作）
- `DELETE /api/schedules/:id` - 删除排产

### 物料
- `GET /api/materials` - 物料列表
- `POST /api/materials` - 创建物料
- `PUT /api/materials/:id` - 更新物料
- `GET /api/materials/work-order/:id/readiness` - 工单齐套检查
- `POST /api/materials/work-order/:id/material` - 更新工单物料

### 返工
- `GET /api/reworks` - 返工列表
- `GET /api/reworks/stats` - 返工统计
- `POST /api/reworks` - 创建返工记录
- `PUT /api/reworks/:id` - 更新返工记录

### 产量工时
- `GET /api/productions` - 生产记录列表
- `GET /api/productions/summary` - 产量汇总
- `GET /api/productions/work-hours` - 工时统计
- `POST /api/productions` - 录入产量
- `PUT /api/productions/:id` - 更新产量记录

### 风险
- `GET /api/risks` - 风险列表
- `GET /api/risks/report` - 风险报表
- `GET /api/risks/high-risk-orders` - 高风险工单
- `POST /api/risks` - 新增风险
- `POST /api/risks/:id/handle` - 处理风险

### 日志 (仅管理员)
- `GET /api/logs` - 操作日志列表
- `GET /api/logs/risk` - 风险相关日志

### 用户 (仅管理员)
- `GET /api/users` - 用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户

## 数据库表结构

### 核心表
- `users` - 用户表
- `roles` - 角色表
- `role_user` - 用户角色关联
- `api_tokens` - API Token
- `work_orders` - 工单表
- `schedules` - 排产计划表
- `materials` - 物料表
- `work_order_materials` - 工单物料关联
- `reworks` - 返工记录表
- `production_logs` - 生产记录表
- `risk_logs` - 风险日志表
- `operation_logs` - 操作日志表

## 开发说明

### 新增路由
在 `backend/start/routes/` 目录下创建对应的路由文件，然后在 `start/routes.ts` 中引入。

### 新增模型
在 `backend/app/Models/` 目录下创建模型文件，继承 `BaseModel`。

### 新增验证器
在 `backend/app/Validators/` 目录下创建验证器，使用 AdonisJS 的 schema 验证。

### 权限控制
使用中间件 `role:admin,workshop_manager` 进行角色验证，或使用 Bouncer Policy 进行更细粒度的控制。

## 测试

```bash
cd backend
npm test
```

测试环境使用 `.env.testing` 配置文件，数据库独立。

## License

MIT
