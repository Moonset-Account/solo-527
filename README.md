# 茶饮门店库存损耗管理系统

基于 AdonisJS + Vue 3 + PostgreSQL + Redis 的茶饮门店库存损耗管理系统。

## 技术栈

### 后端
- **框架**: AdonisJS 6 (Node.js)
- **数据库**: PostgreSQL
- **缓存**: Redis
- **ORM**: Lucid (AdonisJS 内置)
- **认证**: API Token 认证

### 前端
- **框架**: Vue 3 (Composition API)
- **UI 组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP 客户端**: Axios
- **图表**: ECharts
- **日期处理**: Day.js

## 功能模块

### 操作入口
- **营业录入**: 录入每日营业额、订单数、成本等数据
- **异常录入**: 记录报损、损坏、投诉、设备故障等异常情况

### 处理记录（统一记录）
- **巡店任务**: 巡店检查记录，支持自定义检查项
- **现金流水**: 现金收入/支出记录
- **食材库存**: 食材入库/出库/盘点/调整记录
- **全部记录**: 统一查看所有类型的处理记录，可追溯处理人和时间

### 整改管理
- 整改任务创建与分配
- 整改备注记录
- 处理结果录入
- 整改闭环管理
- 整改逾期自动识别
- 闭环统计（完成率、逾期数等）

### 报表中心
- **单店利润报表**: 支持按门店、日期范围筛选
- 营业额、成本、利润、报损等多维度统计
- 趋势图表展示

### 管理设置
- **安全库存设置**: 设置各食材的最低/预警/最高库存
- **报损原因管理**: 管理报损原因分类
- **食材管理**: 食材基础信息维护

## 项目结构

```
.
├── backend/                 # 后端项目
│   ├── app/
│   │   ├── controllers/     # 控制器
│   │   ├── models/          # 数据模型
│   │   ├── middleware/      # 中间件
│   │   └── exceptions/      # 异常处理
│   ├── config/              # 配置文件
│   ├── database/
│   │   ├── migrations/      # 数据库迁移
│   │   └── seeders/         # 种子数据
│   ├── start/               # 启动文件
│   ├── bin/                 # 入口脚本
│   ├── .env                 # 开发环境配置
│   └── .env.testing         # 测试环境配置
│
└── frontend/                # 前端项目
    ├── src/
    │   ├── views/           # 页面组件
    │   ├── layouts/         # 布局组件
    │   ├── stores/          # Pinia 状态管理
    │   ├── router/          # 路由配置
    │   ├── utils/           # 工具函数
    │   └── styles/          # 全局样式
    └── index.html
```

## 快速开始

### 前置要求
- Node.js >= 18
- PostgreSQL >= 13
- Redis >= 6

### 后端启动

1. 安装依赖
```bash
cd backend
npm install
```

2. 配置数据库
修改 `.env` 文件中的数据库连接信息：
```
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_DATABASE=tea_inventory
```

3. 运行数据库迁移
```bash
node ace migration:run
```

4. 填充种子数据
```bash
node ace db:seed
```

5. 启动开发服务器
```bash
npm run dev
```

服务将在 `http://localhost:3333` 启动

### 前端启动

1. 安装依赖
```bash
cd frontend
npm install
```

2. 启动开发服务器
```bash
npm run dev
```

前端将在 `http://localhost:5173` 启动，已配置代理转发 API 请求到后端

## 测试账号

| 角色 | 账号 | 密码 |
|------|------|------|
| 系统管理员 | admin | admin123 |
| 中关村店店长 | manager1 | 123456 |
| 国贸店店长 | manager2 | 123456 |

## 生产库和测试库隔离

项目通过环境变量实现数据库隔离：

- **开发环境**: 使用 `.env` 配置，数据库名 `tea_inventory`
- **测试环境**: 使用 `.env.testing` 配置，数据库名 `tea_inventory_test`

运行测试时，AdonisJS 会自动加载 `.env.testing` 文件。

## API 接口

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/profile` - 获取用户信息
- `POST /api/auth/logout` - 退出登录

### 操作入口
- `GET /api/operations/sales` - 营业记录列表
- `POST /api/operations/sales` - 新增营业记录
- `GET /api/operations/sales/:id` - 营业记录详情
- `GET /api/operations/exceptions` - 异常记录列表
- `POST /api/operations/exceptions` - 新增异常记录
- `GET /api/operations/exceptions/:id` - 异常记录详情

### 处理记录
- `GET /api/process/records` - 全部处理记录
- `POST /api/process/records` - 新增处理记录
- `GET /api/process/records/:id` - 处理记录详情
- `GET /api/process/inspections` - 巡店任务列表
- `POST /api/process/inspections` - 新增巡店任务
- `GET /api/process/cash-flows` - 现金流水列表
- `POST /api/process/cash-flows` - 新增现金流水
- `GET /api/process/inventory-logs` - 库存记录列表
- `POST /api/process/inventory-logs` - 新增库存记录

### 整改管理
- `GET /api/rectifications` - 整改列表
- `POST /api/rectifications` - 新增整改
- `GET /api/rectifications/:id` - 整改详情
- `PUT /api/rectifications/:id` - 更新整改
- `POST /api/rectifications/:id/close` - 整改闭环
- `GET /api/rectifications/statistics/summary` - 整改统计

### 报表
- `GET /api/reports/profit-report` - 利润报表

### 管理设置
- `GET /api/admin/safety-stocks` - 安全库存列表
- `POST /api/admin/safety-stocks` - 新增安全库存
- `PUT /api/admin/safety-stocks/:id` - 更新安全库存
- `DELETE /api/admin/safety-stocks/:id` - 删除安全库存
- `GET /api/admin/loss-reasons` - 报损原因列表
- `POST /api/admin/loss-reasons` - 新增报损原因
- `PUT /api/admin/loss-reasons/:id` - 更新报损原因
- `DELETE /api/admin/loss-reasons/:id` - 删除报损原因
- `GET /api/admin/ingredients` - 食材列表
- `POST /api/admin/ingredients` - 新增食材
- `PUT /api/admin/ingredients/:id` - 更新食材
- `GET /api/admin/ingredients/:id` - 食材详情

## 核心设计说明

### 统一处理记录设计
巡店任务、现金流水、食材库存三种业务统一沉淀到 `process_records` 表：
- 使用 `type` 字段区分记录类型
- 使用 `data` JSON 字段存储各类型的差异化数据
- 记录 `created_by`（创建人）和 `handled_by`（处理人），支持追溯
- 记录 `created_at` 和 `handled_at` 时间戳

### 整改闭环设计
- 整改支持多级状态：待处理、处理中、已解决、已关闭、已逾期
- 支持添加备注，记录整改过程
- 支持设置截止日期，自动识别逾期
- 闭环统计：闭环完成率、逾期未闭环数等指标

### 权限设计
- **admin**: 系统管理员，可查看所有门店数据
- **store_manager**: 门店店长，只能查看和操作所属门店数据
- **staff**: 员工，权限同店长但部分功能受限
