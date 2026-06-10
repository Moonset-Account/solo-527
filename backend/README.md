# 青禾候选人管道台 - 后端

基于 FastAPI + SQLAlchemy + PostgreSQL + Celery 的校招候选人管道管理系统后端。

## 技术栈

- FastAPI
- SQLAlchemy 2.0
- PostgreSQL
- Celery + Redis
- JWT 认证
- Pydantic v2

## 核心模块

### 用户与权限
- 三角色体系：管理员、招聘员、候选人
- JWT Token 认证
- 基于角色的权限控制

### 候选人管道
- 职位管理
- 候选人档案
- 投递申请
- 状态流转（12种状态）
- 阶段管理（简历筛选→测评→技术面→HR面→Offer→入职）
- 状态历史记录（周期、渠道、操作人留痕）

### 面试管理
- 多种面试类型（电话、视频、现场、测评）
- 面试时间冲突检测
- 面试评价与反馈
- 面试状态管理

### 测评管理
- 题库管理（6种题型）
- 难度分级
- 分类标签
- 测评记录

### 录用管理
- Offer 起草与发放
- 候选人回应
- Offer 状态追踪

### 签到管理
- 面试签到记录
- 多种签到状态
- 设备与位置信息

### 待办中心
- 普通待办
- 升级催办
- 面试冲突提醒
- 状态超时自动升级
- 提醒规则配置

### 系统配置
- 字典项管理
- 系统阈值配置
- 提醒频率配置
- 操作审计日志

## 快速开始

### 1. 启动数据库

```bash
cd ..
docker-compose up -d postgres redis
```

### 2. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 3. 初始化数据

```bash
python -m app.initial_data
```

### 4. 启动服务

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. 启动 Celery Worker

```bash
celery -A app.tasks.celery_app worker --loglevel=info
```

## API 文档

启动后访问:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 招聘员 | recruiter | recruiter123 |
| 候选人 | candidate1 | candidate123 |

## 目录结构

```
backend/
├── app/
│   ├── api/                  # API 路由
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── candidates.py
│   │   ├── positions.py
│   │   ├── applications.py
│   │   ├── interviews.py
│   │   ├── assessments.py
│   │   ├── todos.py
│   │   ├── dictionary.py
│   │   └── admin.py
│   ├── core/                 # 核心配置
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   └── deps.py
│   ├── models/               # 数据模型
│   ├── schemas/              # Pydantic 模式
│   ├── services/             # 业务逻辑
│   ├── tasks/                # Celery 任务
│   │   ├── celery_app.py
│   │   ├── notification_tasks.py
│   │   └── scheduled_tasks.py
│   └── main.py               # 应用入口
├── requirements.txt
└── README.md
```
