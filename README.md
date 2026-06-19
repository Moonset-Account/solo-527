# 医药批次追溯系统

采购计划员专用医药批次追溯管理系统，基于 **Nuxt 3 + Naive UI + FastAPI + PostgreSQL + Celery** 技术栈。

## 功能模块

### 🏠 采购工作台（前台）
- **仪表盘概览**：库存/效期/风险统计，出入库趋势图，紧急待办
- **智能补货建议**：自动生成补货清单，批量分配采购员，状态跟踪
- **批号流向追踪**：按批号完整追溯入库、出库、调拨、退货、报废等流转

### 🛠️ 后台维护
- **供应商管理**：供应商档案、证照、评级
- **药品档案**：药品品规、分类、安全库存/补货点配置
- **库位管理**：库区、温区、排行列层配置
- **批次效期维护**：批次入库、效期、库位、检验信息
- **库存管理**：实时库存监控，库存流转登记
- **近效期提醒**：预警级别（紧急/高/中/低），处理留痕、办理时长
- **缺货风险预警**：可销天数计算，一键跳转补货
- **异常记录**：批次异常登记，处理方案记录，办理时长与负责人
- **报表中心**：库存/流转/效期/异常/补货/差异 6 类报表异步导出

### 👑 管理中心（管理员/经理专用）
- **批次效期筛选入口**：多维度（效期/状态/供应商/差异）筛选，批量导出
- **补货筛选入口**：优先级/状态/供应商/缺口 筛选，批量分配采购任务
- **签收差异管理**：差异追踪、办理时长、处理方案、负责人完整留痕
- **字典管理**：分类/温区/异常类型等字典，**显示生效时间**
- **提醒策略**：预警条件与动作配置，**显示生效/失效时间**
- **用户管理**：用户、角色、权限管理

## 技术架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端 (Nuxt 3 + Naive UI)                  │
│  Naive UI 组件库 | Pinia 状态管理 | ECharts 图表 | Axios 请求     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API 网关 (FastAPI)                          │
│  RESTful API | JWT 鉴权 | 权限控制 | Pydantic 校验              │
└──────────────┬──────────────────────────────────┬────────────────┘
               │                                  │
               ▼                                  ▼
┌──────────────────────────┐        ┌────────────────────────────┐
│    PostgreSQL (持久层)    │        │   Redis + Celery (任务层)   │
│  批次/库存/供应商/用户    │        │  近效期扫描/缺货预警/报表导出 │
└──────────────────────────┘        └────────────────────────────┘
```

## 快速启动（推荐 Docker）

### 前置要求
- Docker ≥ 20.10
- Docker Compose ≥ 2.0

### 启动步骤

```bash
# 1. 复制环境变量
cp .env.example .env
# 可选：修改 .env 中的密码和密钥

# 2. 启动所有服务（PostgreSQL, Redis, 后端, Celery Worker, Celery Beat, 前端）
docker-compose up -d --build

# 3. 查看日志
docker-compose logs -f backend frontend

# 4. 停止服务
docker-compose down
```

### 启动后访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:3000 | 主界面 |
| 后端 API | http://localhost:8000 | API 服务 |
| Swagger 文档 | http://localhost:8000/docs | 交互式 API 文档 |
| PostgreSQL | localhost:5432 | 数据库 |
| Redis | localhost:6379 | 消息队列/缓存 |

## 本地开发（不使用 Docker）

### 1. 启动基础服务
```bash
# 需要本地 PostgreSQL 和 Redis
# macOS 可使用 brew:
brew install postgresql@15 redis
brew services start postgresql@15
brew services start redis

# 创建数据库
psql -U postgres
CREATE DATABASE pharm_trace;
CREATE USER pharmadmin WITH PASSWORD 'pharmadmin123';
GRANT ALL PRIVILEGES ON DATABASE pharm_trace TO pharmadmin;
```

### 2. 启动后端
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 启动 API 服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 另起终端，启动 Celery Worker
celery -A app.celery_worker.celery worker --loglevel=info

# 另起终端，启动 Celery Beat（定时任务）
celery -A app.celery_worker.celery beat --loglevel=info
```

### 3. 启动前端
```bash
cd frontend
yarn install  # 或 npm install
yarn dev      # 或 npm run dev
```

## 默认账号（首次启动自动创建）

| 用户名 | 密码 | 角色 | 权限 |
|--------|------|------|------|
| admin | admin123 | 系统管理员 | 全部权限 |
| manager | manager123 | 部门经理 | 管理中心 + 业务操作 |
| purchaser | purchaser123 | 采购专员 | 业务操作（补货/批次/报表） |
| warehouse | warehouse123 | 库管员 | 库位/库存操作 |

## Celery 定时任务（自动执行）

| 任务 | 频率 | 说明 |
|------|------|------|
| check-near-expiry | 每天 1 次 | 扫描近 90 天内到期批次，生成预警提醒 |
| check-low-stock | 每 6 小时 | 扫描低于安全库存药品，生成风险预警 |
| generate-replenish | 每天 1 次 | 生成智能补货建议 |
| check-sign-differences | 每天 1 次 | 检测签收数量差异 |

## 报表说明

所有报表保留：
- **批次异常报表**：异常类型、严重程度、描述、**发现时间/人、处理时间/人、办理时长**
- **近效期报表**：预警级别、处理状态、**处理人、处理时长**
- **签收差异报表**：差异原因、解决方案、**处理人、办理时长**

## 字典与提醒策略生效时间

- 管理员修改字典或提醒策略时，**页面顶部会黄色提示框显示生效时间**
- 支持自定义未来生效时间、自动失效时间
- 所有变更保留 `created_at` / `updated_at` 审计字段

## 关键目录结构

```
work-0319/
├── docker-compose.yml          # 一键部署
├── .env.example                # 环境变量示例
├── backend/                    # FastAPI 后端
│   ├── app/
│   │   ├── main.py             # 应用入口 + 数据初始化
│   │   ├── models.py           # SQLAlchemy ORM 模型 (20+ 表)
│   │   ├── schemas.py          # Pydantic 数据校验模型
│   │   ├── security.py         # JWT 鉴权 + 密码哈希 + 权限装饰器
│   │   ├── database.py         # 数据库连接
│   │   ├── config.py           # 配置项
│   │   ├── celery_worker.py    # Celery 配置 + 定时任务
│   │   ├── tasks.py            # Celery 任务（预警/报表/补货）
│   │   └── routers/            # API 路由 (15个模块)
│   └── requirements.txt
└── frontend/                   # Nuxt 3 前端
    ├── nuxt.config.ts
    ├── stores/auth.ts          # Pinia 用户/鉴权
    ├── utils/api.ts            # Axios 封装
    ├── layouts/default.vue     # 主布局（侧边栏+头部）
    └── pages/                  # 25+ 页面
        ├── login.vue
        ├── index.vue           # 仪表盘
        ├── replenish.vue       # 补货建议
        ├── trace.vue           # 批号追踪
        ├── suppliers.vue       # 供应商
        ├── medicines.vue       # 药品
        ├── locations.vue       # 库位
        ├── batches.vue         # 批次效期
        ├── stocks.vue          # 库存
        ├── reminders.vue       # 近效期提醒
        ├── risks.vue           # 缺货风险
        ├── abnormal.vue        # 异常记录
        ├── reports.vue         # 报表中心
        └── admin/              # 管理中心
            ├── batches.vue         # 批次筛选
            ├── replenish.vue       # 补货筛选
            ├── sign-differences.vue# 签收差异
            ├── dictionaries.vue    # 字典管理
            ├── strategies.vue      # 提醒策略
            └── users.vue           # 用户管理
```
