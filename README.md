# 家电维修服务下单系统

一套完整的家电维修服务下单管理系统，包含用户端下单、管理后台、师傅调度、数据分析等功能。

## 技术栈

- **后端框架**: AdonisJS 6 (Node.js + TypeScript)
- **前端框架**: Vue 3 + Vite + TypeScript
- **UI 组件库**: Element Plus
- **数据库**: PostgreSQL
- **缓存/会话**: Redis
- **图表库**: ECharts
- **状态管理**: Pinia
- **路由**: Vue Router

## 功能特性

### 用户端
- 📱 故障报修：上传故障照片、填写设备信息
- 📅 预约服务：选择服务时间、服务地址
- 📋 订单查询：查看订单状态、服务进度
- ⭐ 服务评价：服务完成后评价打分
- 🏘️ 社区归属：支持社区用户享受专属服务

### 管理后台
- 📊 数据仪表盘：今日订单、待处理、营收概览
- 📝 订单管理：订单列表、分配师傅、改约、取消
- 👨‍🔧 师傅管理：服务人员信息、技能管理、负载查看
- 💰 价格规则：服务项目定价、阶梯价格配置
- ⚙️ 系统配置：可维护的系统参数、变更历史留痕
- 📈 统计分析：
  - 师傅负载分析（按日/周/月，非仅总数）
  - 复购率统计（按社区/日期/渠道拆分）
  - 迟到原因分析

### 核心设计
- 🔒 演示数据隔离：正式统计排除演示样例数据
- 📝 配置变更留痕：所有配置修改记录原因、操作人
- 📊 多维度统计：支持按日期、社区、渠道等多维度分析
- ⚡ 缓存优化：Redis 缓存热点数据和会话

## 项目结构

```
.
├── backend/              # AdonisJS 后端服务
│   ├── app/
│   │   ├── controllers/  # 控制器
│   │   ├── models/       # 数据模型
│   │   ├── middleware/   # 中间件
│   │   └── validators/   # 请求验证
│   ├── config/           # 配置文件
│   ├── database/
│   │   └── migrations/   # 数据库迁移
│   ├── start/            # 启动文件
│   └── public/           # 公共资源
├── frontend/             # Vue 3 前端应用
│   ├── src/
│   │   ├── api/          # API 接口封装
│   │   ├── views/        # 页面组件
│   │   ├── components/   # 公共组件
│   │   ├── stores/       # Pinia 状态
│   │   ├── router/       # 路由配置
│   │   └── utils/        # 工具函数
│   └── public/           # 静态资源
├── DEPLOYMENT.md         # 部署运维文档
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 20.0.0
- PostgreSQL >= 14
- Redis >= 6

### 一、启动后端服务

```bash
# 进入后端目录
cd backend

# 复制环境变量配置
cp .env.example .env

# 编辑配置
# 修改数据库连接、Redis 连接等信息

# 安装依赖
npm install

# 运行数据库迁移
node ace migration:run

# 启动开发服务器
npm run dev
```

后端服务默认运行在 http://localhost:3333

### 二、启动前端服务

```bash
# 进入前端目录
cd frontend

# 复制环境变量配置
cp .env.example .env

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务默认运行在 http://localhost:5173

### 三、访问系统

- **用户端**: http://localhost:5173
- **管理后台**: http://localhost:5173/admin/login
- **API 文档**: http://localhost:3333

## 数据库表结构

### 核心数据表

| 表名 | 说明 |
|------|------|
| `users` | 用户表（用户、师傅、管理员） |
| `technicians` | 师傅表（技能、日单量限制等） |
| `orders` | 订单表（核心业务表） |
| `order_logs` | 订单操作日志 |
| `order_evaluations` | 订单评价 |
| `price_rules` | 价格规则 |
| `communities` | 社区表 |
| `configs` | 系统配置表 |
| `config_histories` | 配置变更历史 |
| `attendance_records` | 考勤/到达记录 |

## 核心 API

### 认证相关
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/logout` | 用户登出 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 用户端订单
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/orders` | 创建订单 |
| GET | `/api/orders` | 我的订单列表 |
| GET | `/api/orders/:id` | 订单详情 |
| POST | `/api/orders/:id/cancel` | 取消订单 |
| POST | `/api/orders/:id/evaluate` | 订单评价 |

### 管理端
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/orders` | 订单列表 |
| POST | `/api/admin/orders/:id/assign` | 分配师傅 |
| POST | `/api/admin/orders/:id/reschedule` | 改约 |
| POST | `/api/admin/orders/:id/cancel` | 取消订单 |
| GET | `/api/admin/statistics/overview` | 数据概览 |
| GET | `/api/admin/statistics/technician-load` | 师傅负载统计 |
| GET | `/api/admin/statistics/repurchase-stats` | 复购统计 |
| GET | `/api/admin/statistics/late-reason-stats` | 迟到原因统计 |

## 设计要点

### 1. 演示数据隔离
- 订单表有 `is_demo` 字段标记演示数据
- `ENABLE_DEMO_DATA` 环境变量控制是否生成演示数据
- **所有统计接口自动排除演示数据**，确保正式统计准确

### 2. 师傅负载统计
- 不只是简单的订单总数
- 支持按日、周、月多维度统计
- 可查看每位师傅在各时间段的具体负载
- 与师傅日单量上限对比，辅助派单决策

### 3. 复购率多维度分析
- **按日期**：复购率趋势变化
- **按渠道**：社区运营、线上推广、老客户推荐等
- **按社区**：各社区复购情况对比
- 支持交叉分析，精准定位高价值用户群体

### 4. 配置管理与变更留痕
- 所有系统配置通过 `configs` 表管理
- 每次配置修改都会在 `config_histories` 表留痕
- 记录：修改人、旧值、新值、变更原因、变更时间
- 支持配置变更历史追溯和回滚参考

### 5. 环境变量清晰配置
- 前后端均有详细的 `.env.example` 模板
- 每个配置项都有明确的说明
- 功能开关独立控制，便于灰度和测试

## 部署

详细部署说明请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 开发规范

### 代码风格
- 后端遵循 AdonisJS 官方规范
- 前端使用 ESLint + Prettier
- TypeScript 严格模式

### 提交规范
- feat: 新功能
- fix: 修复 bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 重构
- test: 测试相关
- chore: 构建/工具相关

## License

MIT
