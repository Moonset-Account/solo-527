# 民宿保洁和维修派单系统

## 系统概述

帮助民宿运营经理处理房间分布在不同小区，退房后快速安排保洁和维修检查的全流程管理系统。

## 技术栈

### 后端
- **框架**: FastAPI 0.104
- **ORM**: SQLAlchemy 2.0 + Alembic (迁移)
- **数据库**: PostgreSQL
- **缓存/队列**: Redis + Celery
- **对象存储**: MinIO (兼容S3)
- **认证**: JWT (OAuth2)
- **日志**: Loguru (分级日志，自动轮转)
- **测试**: pytest

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件**: Ant Design 5
- **路由**: React Router v6
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **日期处理**: Day.js

## 核心功能模块

### 1. 用户管理
- 角色：系统管理员、运营经理、保洁员、维修工
- 权限控制：基于角色的访问控制(RBAC)

### 2. 房源管理
- 多小区房源管理
- 房源信息：小区、楼号、房号、面积、户型等

### 3. 日历房态
- 按月/周查看所有房源状态
- 房态类型：可入住、已入住、已退房、清洁中、清洁完成、验收中、维修中、锁定
- 支持直接编辑房态

### 4. 保洁任务管理
- 任务创建、分配、开始、提交、验收
- 优先级管理：低、普通、高、紧急
- 超时自动检测和提醒
- 照片验收（上传清洁后照片）
- **关键约束：保洁完成并通过验收前，房间不能开放入住**

### 5. 维修工单管理
- 工单创建、分配、维修、验收
- 维修类型：水电、电器、家电、家具、油漆、门窗、其他
- 费用记录（预估/实际）
- 照片附件支持

### 6. 物料管理
- 物料库存管理
- 物料消耗记录（关联保洁任务/维修工单）
- 低库存预警

### 7. 运营看板
- 实时统计：任务总数、完成数、超时数
- 资源利用率：保洁员/维修工利用率
- 超时任务列表
- 成本统计
- 支持按时间、小区、负责人筛选

### 8. 成本报表
- 保洁员绩效排行
- 成本分析报表
- 支持Excel导出

### 9. 通知系统
- 任务分配通知
- 超时提醒通知
- 待验收提醒

## 核心业务规则和数据约束

### 房态锁定规则
```
退房 → 保洁中 → 保洁完成 → 验收中 → 验收通过 → 可入住
                                         ↓
                                       验收驳回 → 重新保洁
```
- **保洁进行中时，房间不能被安排新客人入住**
- **保洁提交但未验收时，房间不能开放入住**
- **只有验收通过后，房态才变为可入住**

### 任务状态流转
```
PENDING(待分配) → ASSIGNED(已分配) → IN_PROGRESS(进行中) → SUBMITTED(待验收)
                                                                 ↓
                                             APPROVED(已完成)/REJECTED(已驳回)
```
- 非法状态转换会被拒绝（如已完成的任务不能再次开始）

### 超时检测
- 保洁任务默认超时时间：4小时
- 维修工单默认超时时间：8小时
- 系统每30分钟自动检测超时任务
- 超时后自动标记并发送通知给运营经理

### 资源调度
- 系统自动计算空闲保洁员/维修工
- 支持查看当前忙碌的人员

## 项目结构

```
question-056/
├── backend/                          # 后端服务
│   ├── app/
│   │   ├── core/                     # 核心基础设施
│   │   │   ├── config.py            # 配置管理
│   │   │   ├── database.py          # 数据库连接
│   │   │   ├── security.py          # 认证和密码
│   │   │   ├── logging.py           # 日志配置
│   │   │   ├── storage.py           # 对象存储
│   │   │   ├── redis_client.py      # Redis客户端
│   │   │   └── exceptions.py        # 异常处理
│   │   ├── models/                   # 数据模型
│   │   ├── schemas/                  # Pydantic Schema
│   │   ├── services/                 # 业务逻辑服务
│   │   ├── routers/                  # API路由
│   │   ├── worker.py                # Celery任务
│   │   └── main.py                  # 应用入口
│   ├── scripts/
│   │   ├── init_db.py               # 初始化数据脚本
│   │   └── validate_constraints.py  # 业务约束验证脚本
│   ├── alembic/                      # 数据库迁移
│   ├── requirements.txt             # Python依赖
│   └── .env.example                 # 环境变量示例
├── frontend/                         # 前端应用
│   ├── src/
│   │   ├── api/                     # API客户端
│   │   ├── store/                   # 状态管理
│   │   ├── types/                   # TypeScript类型
│   │   ├── layouts/                 # 布局组件
│   │   ├── pages/                   # 页面组件
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── start.sh                         # 一键启动脚本
```

## 快速开始

### 前置依赖
1. PostgreSQL 12+
2. Redis 6+
3. MinIO (可选，用于文件存储)
4. Python 3.9+
5. Node.js 18+

### 一键启动
```bash
./start.sh
```

### 手动启动后端
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # 修改配置
python scripts/init_db.py
uvicorn app.main:app --reload --port 8000
```

### 手动启动前端
```bash
cd frontend
npm install
npm run dev
```

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 系统管理员 | admin | admin123 |
| 运营经理 | manager | manager123 |
| 保洁员 | cleaner1 | cleaner123 |
| 保洁员 | cleaner2 | cleaner123 |
| 保洁员 | cleaner3 | cleaner123 |
| 保洁员 | cleaner4 | cleaner123 |
| 维修工 | tech1 | tech123 |
| 维修工 | tech2 | tech123 |

## API文档

启动后端后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 验证业务约束

运行验证脚本测试核心业务规则：
```bash
cd backend
python scripts/validate_constraints.py
```

验证内容：
1. ✓ 保洁完成前不能开放入住
2. ✓ 任务状态流转约束
3. ✓ 非法状态流转被拒绝
4. ✓ 资源空闲/忙碌检测
5. ✓ 超时任务自动标记

## 核心API端点

### 认证
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户

### 房源
- `GET /api/properties` - 房源列表
- `POST /api/properties` - 创建房源
- `GET /api/properties/communities` - 获取小区列表

### 房态
- `GET /api/room-statuses/calendar` - 日历房态
- `POST /api/room-statuses` - 更新房态
- `POST /api/room-statuses/check-can-check-in` - 验证是否可入住

### 保洁任务
- `GET /api/cleaning-tasks` - 任务列表
- `POST /api/cleaning-tasks` - 创建任务
- `POST /api/cleaning-tasks/{id}/assign` - 分配任务
- `POST /api/cleaning-tasks/{id}/start` - 开始任务
- `POST /api/cleaning-tasks/{id}/submit` - 提交任务
- `POST /api/cleaning-tasks/{id}/approve` - 验收通过
- `POST /api/cleaning-tasks/{id}/reject` - 验收驳回

### 维修工单
- 类似保洁任务的完整API

### 看板和报表
- `GET /api/dashboard/stats` - 看板统计
- `GET /api/reports/cleaner-performance` - 保洁员绩效
- `GET /api/reports/export/cost` - 成本报表导出

### 附件上传
- `POST /api/attachments/upload` - 上传照片/文件
