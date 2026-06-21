# 烘焙门店巡店整改系统

基于 **Nuxt 3 + Naive UI + FastAPI + PostgreSQL + Celery** 开发的烘焙门店一体化管理系统，专为区域督导巡店场景设计。

## 功能特性

### 🍞 前台（门店端）
- **烘焙批次管理**：登记烘焙批次，记录温度、湿度、烘焙时间，完成批次时自动计算损耗
- **报损登记**：支持按批次、按食材报损，自动关联库存扣减，记录处理结果和备注
- **库存查询**：实时查看门店库存，库存不足自动预警

### 📋 后台（督导/管理端）
- **巡店任务管理**：创建巡店任务、记录检查项、完成巡店评分
- **整改管理**：下发整改任务、跟踪整改进度、复查整改结果
- **库存管理**：多门店库存监控、入库出库操作、库存预警处理
- **食材损耗追踪**：多维度报损统计，按类型、按门店、按时间分析
- **现金流水**：收支记录，分类统计，自动计算净收入
- **人力成本统计**：工时登记，自动计算工资，支持加班统计
- **系统配置**：模块启停、参数配置，修改口径无需重新发版

### ⚙️ 系统特性
- **可配置化**：所有功能模块可独立启停，业务参数可动态调整
- **自动预警**：库存不足自动生成预警，支持定时任务巡检
- **角色权限**：系统管理员、区域督导、店长、烘焙师、收银员五级权限
- **数据追踪**：所有操作留痕，报损有处理人、处理结果、备注
- **异步任务**：Celery 定时任务，自动检查库存、生成日报

## 技术栈

### 后端
- **FastAPI**: 高性能 Python Web 框架
- **PostgreSQL**: 关系型数据库
- **SQLAlchemy**: ORM 框架
- **Celery**: 分布式任务队列
- **Redis**: 消息中间件 + 缓存
- **Pydantic**: 数据验证
- **python-jose**: JWT 认证

### 前端
- **Nuxt 3**: Vue 3 全栈框架
- **Naive UI**: Vue 3 组件库
- **TypeScript**: 类型安全
- **Tailwind CSS**: 原子化 CSS
- **ECharts**: 数据可视化
- **Vite**: 构建工具

## 快速开始

### 方式一：Docker 一键启动（推荐）

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend
```

访问:
- 前端: http://localhost:3000
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

### 方式二：本地开发

#### 1. 启动数据库和 Redis
```bash
docker-compose up -d postgres redis
```

#### 2. 启动后端
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
chmod +x run.sh
./run.sh
```

#### 3. 启动 Celery（新终端）
```bash
cd backend
chmod +x run_celery.sh
./run_celery.sh
```

#### 4. 启动 Celery Beat（新终端）
```bash
cd backend
chmod +x run_celery_beat.sh
./run_celery_beat.sh
```

#### 5. 启动前端
```bash
cd frontend
npm install
npm run dev
```

## 默认账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | 系统管理员 | 最高权限 |
| supervisor | 123456 | 区域督导 | 巡店、整改管理 |
| manager | 123456 | 店长 | 门店管理、库存、财务 |
| baker | 123456 | 烘焙师 | 烘焙批次、报损 |
| cashier | 123456 | 收银员 | 现金流水 |

系统会在首次启动时自动创建以上账号和测试数据。

## 数据库设计

核心数据表：

| 表名 | 说明 |
|------|------|
| `users` | 用户表 |
| `stores` | 门店表 |
| `products` | 产品表 |
| `ingredients` | 食材表 |
| `baking_batches` | 烘焙批次表 |
| `loss_records` | 报损记录表 |
| `inventory_items` | 库存表 |
| `stock_alerts` | 库存预警表 |
| `inspection_tasks` | 巡店任务表 |
| `inspection_check_records` | 巡店检查记录表 |
| `rectification_tasks` | 整改任务表 |
| `cash_flows` | 现金流水表 |
| `labor_records` | 工时记录表 |
| `system_settings` | 系统配置表 |

## 核心业务流程

### 1. 烘焙批次 -> 报损流程
```
创建批次 → 开始烘焙 → 完成批次 → 系统自动计算损耗 → 生成报损记录 → 店长处理报损
```

### 2. 巡店 -> 整改流程
```
督导创建巡店任务 → 开始巡店 → 记录检查项 → 完成巡店评分 → 下发整改任务 → 
店长开始整改 → 提交整改结果 → 督导复查 → 整改通过/驳回重改
```

### 3. 库存预警流程
```
库存低于阈值 → 系统自动生成预警 → 预警通知 → 店长处理（补货/调整/替换）→ 
记录处理结果和备注 → 关闭预警
```

## API 接口

主要接口模块：

| 模块 | 前缀 | 说明 |
|------|------|------|
| 认证 | `/api/auth` | 登录、密码修改 |
| 基础数据 | `/api/master` | 门店、产品、食材、用户 |
| 烘焙批次 | `/api/batch` | 批次管理、报损管理 |
| 库存管理 | `/api/inventory` | 库存、预警 |
| 巡店管理 | `/api/inspection` | 巡店任务、检查记录 |
| 整改管理 | `/api/rectification` | 整改下发、处理、复查 |
| 财务管理 | `/api/finance` | 现金流水、人力成本 |
| 系统设置 | `/api/settings` | 模块配置、参数设置 |

详细 API 文档请访问 `http://localhost:8000/docs`

## 目录结构

```
.
├── backend/                    # FastAPI 后端
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # 应用入口
│   │   ├── config.py           # 配置
│   │   ├── database.py         # 数据库连接
│   │   ├── models.py           # ORM 模型
│   │   ├── schemas.py          # Pydantic 模式
│   │   ├── auth.py             # 认证
│   │   ├── celery_app.py       # Celery 配置
│   │   ├── tasks.py            # 异步任务
│   │   ├── crud/               # CRUD 操作
│   │   └── routers/            # API 路由
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/                   # Nuxt 3 前端
│   ├── pages/                  # 页面
│   ├── layouts/                # 布局
│   ├── composables/            # 组合函数
│   ├── plugins/                # 插件
│   ├── middleware/             # 中间件
│   ├── assets/                 # 静态资源
│   ├── types/                  # 类型定义
│   ├── nuxt.config.ts
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 可配置模块说明

系统支持以下模块的动态启停和参数配置，无需重新发版：

| 模块 | 配置项 | 说明 |
|------|--------|------|
| 库存管理 | `enabled` | 启用/禁用模块 |
| 库存管理 | `low_stock_threshold` | 低库存预警阈值 |
| 库存管理 | `auto_check_alerts` | 自动检查库存预警 |
| 巡店管理 | `default_score_threshold` | 合格分数阈值 |
| 整改管理 | `default_deadline_days` | 整改默认期限 |
| 报损管理 | `require_handler` | 报损是否需要处理人 |
| 人力成本 | `default_hourly_rate` | 默认时薪 |

在「系统设置」页面可以随时调整这些配置。

## 常见问题

### 1. 如何修改业务口径？
登录系统 → 进入「系统设置」→ 选择对应模块 → 修改配置值 → 立即生效，无需重启服务。

### 2. 库存预警是如何触发的？
- 手动入库/出库时实时检查
- Celery 定时任务每小时自动检查一次
- 预警生成后需要店长处理，填写处理结果和备注

### 3. 报损一定要关联批次吗？
不一定。报损可以关联批次（烘焙失败等），也可以关联食材（过期、损坏等），还可以独立登记。

### 4. 如何关闭某个功能模块？
在「系统设置」→「模块管理」中点击「禁用」即可，该模块的菜单和功能都会隐藏。

## License

MIT
