# 汽车保养客户回访系统

## 项目介绍

汽车保养客户回访系统是一套完整的汽车4S店售后服务管理解决方案，涵盖线索管理、预约接待、质量检测、客户回访、配件管理等核心业务模块。系统采用前后端分离架构，帮助4S店提升服务质量、提高客户满意度、增加客户复购率。

## 技术栈说明

### 前端技术栈
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI 组件库**: Ant Design Vue
- **状态管理**: Pinia
- **路由**: Vue Router
- **样式**: Tailwind CSS
- **图表**: ECharts
- **HTTP 客户端**: Axios

### 后端技术栈
- **框架**: NestJS + TypeScript
- **数据库**: MongoDB 6.0
- **缓存**: Redis 7.0
- **ORM**: Mongoose
- **认证**: JWT + Passport
- **API 文档**: Swagger
- **任务调度**: @nestjs/schedule

## 功能模块清单

| 模块 | 功能说明 |
|------|----------|
| **仪表盘** | 数据概览、关键指标统计、图表展示 |
| **线索管理** | 线索录入、分配、跟进、状态流转 |
| **预约接待** | 保养预约、到店登记、服务接待 |
| **质量检测** | 检测模板、质检记录、异常处理 |
| **客户回访** | 回访任务、回访记录、满意度调查 |
| **基础配置** | 车辆档案、检测模板、配件报价、规则配置 |
| **系统管理** | 用户管理、角色权限、操作日志 |

## 快速开始

### 环境要求

- Node.js >= 18.x
- npm >= 9.x
- Docker >= 20.x (推荐)
- MongoDB >= 6.0
- Redis >= 7.0

### 1. 安装依赖

```bash
# 使用 npm workspaces 安装所有依赖
npm run install:all
```

### 2. 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 修改 .env 文件中的配置，特别是：
# - MONGODB_URI: MongoDB 连接地址
# - REDIS_HOST / REDIS_PORT: Redis 连接配置
# - JWT_SECRET: JWT 密钥（生产环境必须修改）
```

### 3. 启动数据库服务（使用 Docker）

```bash
# 启动 MongoDB 和 Redis
docker-compose up -d
```

### 4. 启动开发服务

```bash
# 同时启动前后端开发服务器
npm run dev

# 或分别启动
npm run dev:client    # 启动前端 (http://localhost:5173)
npm run dev:server    # 启动后端 (http://localhost:3000)
```

### 5. 访问系统

- **前端地址**: http://localhost:5173
- **后端 API**: http://localhost:3000/api
- **API 文档**: http://localhost:3000/api/docs

### 6. 生产部署

```bash
# 构建前后端
npm run build:all

# 启动生产服务
npm run start:prod
```

## 目录结构说明

```
auto-maintenance-system/
├── client/                      # 前端项目
│   ├── src/
│   │   ├── api/                 # API 接口定义
│   │   ├── assets/              # 静态资源
│   │   ├── components/          # 公共组件
│   │   ├── composables/         # 组合式函数
│   │   ├── layouts/             # 布局组件
│   │   ├── pages/               # 页面组件
│   │   ├── router/              # 路由配置
│   │   ├── stores/              # 状态管理
│   │   ├── types/               # 类型定义
│   │   ├── utils/               # 工具函数
│   │   ├── App.vue              # 根组件
│   │   └── main.ts              # 入口文件
│   ├── package.json
│   └── vite.config.ts
├── server/                      # 后端项目
│   ├── src/
│   │   ├── common/              # 公共模块（过滤器、守卫、拦截器等）
│   │   ├── config/              # 配置模块
│   │   ├── modules/             # 业务模块
│   │   │   ├── appointments/    # 预约模块
│   │   │   ├── auth/            # 认证模块
│   │   │   ├── dashboard/       # 仪表盘模块
│   │   │   ├── exceptions/      # 异常模块
│   │   │   ├── followups/       # 回访模块
│   │   │   ├── leads/           # 线索模块
│   │   │   ├── parts/           # 配件模块
│   │   │   ├── quality/         # 质检模块
│   │   │   ├── rules/           # 规则模块
│   │   │   ├── templates/       # 模板模块
│   │   │   └── vehicles/        # 车辆模块
│   │   ├── schemas/             # 数据模型定义
│   │   ├── shared/              # 共享模块
│   │   ├── app.module.ts        # 根模块
│   │   ├── main.ts              # 入口文件
│   │   └── init-data.ts         # 初始化数据脚本
│   ├── package.json
│   └── nest-cli.json
├── docker-compose.yml           # Docker Compose 配置
├── package.json                 # 根目录 package.json (monorepo)
├── .env.example                 # 环境变量示例
├── .gitignore                   # Git 忽略文件
└── README.md                    # 项目说明文档
```

## 默认账号说明

系统启动时会自动初始化以下默认账号：

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | ADMIN | 系统管理员，拥有所有权限 |
| consultant1 | 123456 | STAFF | 顾问用户，用于测试 |
| consultant2 | 123456 | STAFF | 顾问用户，用于测试 |

> **注意**: 生产环境请务必修改默认密码！

## API 文档地址

启动后端服务后，可通过以下地址访问 API 文档：

- **Swagger UI**: http://localhost:3000/api/docs
- **JSON 格式**: http://localhost:3000/api/docs-json

API 文档包含所有接口的详细说明、请求参数、响应格式和示例。

## 开发规范

### 分支管理
- `main`: 主分支，生产环境代码
- `develop`: 开发分支
- `feature/*`: 功能分支
- `bugfix/*`: 修复分支

### 代码规范
- 前端使用 ESLint + Prettier
- 后端使用 ESLint + Prettier
- 遵循 TypeScript 最佳实践
- 提交信息遵循 Conventional Commits 规范

## 许可证

MIT License
