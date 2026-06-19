# 票务运营签到核销系统

行业峰会专业票务管理解决方案，基于 Nuxt 3 + Naive UI + FastAPI + PostgreSQL + Celery 技术栈开发。

## 功能特性

### 用户端
- 在线报名提交（实名资料、公司信息、票种选择）
- 自动生成报名编号

### 后台管理
- **活动管理**：创建/编辑活动，设置时间、地点、人数上限
- **报名管理**：报名列表查询、详情查看、质量分级、质量变更历史
- **签到核销**：快捷签到、签到记录查询、到场反馈
- **设备管理**：核销设备配置、设备状态管理、签到统计
- **待办事项**：退票异常自动生成待办、手动创建待办、待办处理
- **退票异常**：异常列表、异常处理、处理结果回写活动参与状态
- **操作日志**：全量操作记录，包含操作人、时间、IP地址
- **报表导出**：报名数据、签到数据、质量历史导出（仅正式环境真实数据）
- **数据概览**：核心指标统计卡片

### 系统特性
- 三种环境配置：开发(development) / 测试(testing) / 生产(production)
- 测试环境禁止导出真实数据
- 退票异常自动生成待办任务（Celery 异步任务）
- 操作日志全程追溯，票务运营详情记录处理人和时间
- 签到核销、到场反馈、实名资料与原始单据关联
- 报名质量历史记录可追溯

## 技术栈

### 前端
- Nuxt 3 (Vue 3)
- Naive UI
- TypeScript
- SCSS

### 后端
- FastAPI
- SQLAlchemy
- PostgreSQL
- Celery + Redis
- Alembic

## 项目结构

```
.
├── backend/                 # 后端 FastAPI 项目
│   ├── app/
│   │   ├── api/             # API 路由
│   │   ├── core/            # 核心配置（数据库、安全、配置）
│   │   ├── crud/            # CRUD 操作
│   │   ├── models/          # SQLAlchemy 模型
│   │   ├── schemas/         # Pydantic 模式
│   │   └── services/        # 服务层（Celery 任务）
│   ├── alembic/             # 数据库迁移
│   ├── scripts/             # 脚本工具
│   └── requirements.txt
└── frontend/                # 前端 Nuxt 3 项目
    ├── pages/               # 页面
    ├── layouts/             # 布局
    ├── composables/         # 组合式函数
    ├── plugins/             # 插件
    └── assets/              # 静态资源
```

## 快速开始

### 环境要求
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### 后端启动

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 修改 .env 中的数据库连接等配置

# 初始化数据库（自动建表 + 初始数据）
python scripts/init_db.py

# 启动服务
python run.py
```

默认账号：
- 管理员：admin / admin123
- 运营人员：operator / operator123
- 签到人员：checker / checker123

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 启动开发服务
npm run dev
```

### Celery 启动

```bash
cd backend

# 启动 Worker
celery -A app.services.celery_app.celery_app worker --loglevel=info

# 启动定时任务 Beat
celery -A app.services.celery_app.celery_app beat --loglevel=info
```

## API 文档

启动后端服务后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 环境配置说明

通过 `ENVIRONMENT` 环境变量区分：

- `development`：开发环境，开启调试，允许跨域
- `testing`：测试环境，禁止导出真实数据
- `production`：生产环境，严格安全策略

## 核心业务流程

### 报名流程
1. 用户填写报名资料提交
2. 系统自动生成报名编号
3. 运营人员可调整报名质量等级
4. 质量变更记录历史留痕

### 签到流程
1. 签到人员输入/扫描报名编号
2. 系统验证报名状态
3. 记录签到信息（设备、操作人、时间）
4. 支持到场反馈标记

### 退票异常流程
1. 报名状态标记为退票异常
2. Celery 定时检测自动生成待办
3. 运营人员处理退票异常
4. 处理结果回写到活动参与状态
5. 关联待办自动标记完成

## 数据关联说明

所有操作与原始单据建立关联：
- 签到记录 → 报名记录 + 设备 + 操作人
- 质量变更 → 报名记录 + 变更历史
- 退票异常 → 报名记录 + 待办事项
- 操作日志 → 报名记录 + 操作人 + IP
