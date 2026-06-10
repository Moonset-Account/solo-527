# 青禾候选人管道台 (Qinghe Candidate Pipeline)

一套面向校招场景的候选人管道管理系统，支持候选人投递追踪、招聘侧面试排期、管理员后台配置等完整功能。

## 技术栈

- **前端**: Nuxt 3 + Naive UI + TypeScript
- **后端**: FastAPI + SQLAlchemy + PostgreSQL
- **异步任务**: Celery + Redis
- **认证**: JWT + 角色权限

## 目录结构

```
qinghe-pipeline/
├── backend/          # FastAPI 后端
│   ├── app/
│   │   ├── api/        # API 路由
│   │   ├── core/       # 核心配置、安全、认证
│   │   ├── models/     # SQLAlchemy 模型
│   │   ├── schemas/    # Pydantic 模式
│   │   ├── services/   # 业务逻辑
│   │   └── tasks/      # Celery 异步任务
│   └── alembic/        # 数据库迁移
├── frontend/         # Nuxt 3 前端
│   ├── pages/
│   ├── components/
│   ├── stores/
│   └── layouts/
└── docker-compose.yml
```

## 快速启动

### 后端

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

### Celery Worker

```bash
cd backend
celery -A app.tasks.celery worker --loglevel=info
```

## 角色说明

- **候选人**: 投递简历、查看进度
- **招聘员**: 筛选简历、排面试、更新状态
- **管理员**: 题库管理、签到记录、录用结果、字典配置、系统设置
