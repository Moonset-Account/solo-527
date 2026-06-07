# 研学营地安全事件复盘看板

## 技术栈
- 前端：React 18 + TypeScript + Vite + TailwindCSS + ECharts + Leaflet
- 后端：FastAPI + SQLAlchemy + PostgreSQL
- 认证：JWT Token

## 功能特性

### 核心功能
1. **事件时间线看板**：以时间线形式展示事件，未确认/处理中/已关闭分区展示
2. **点位地图**：Leaflet + OpenStreetMap 展示签到点和事件地理位置
3. **数据报表**：ECharts 实现通知完成率、事件状态口径、处理耗时聚合分析
4. **事件补录**：老师补录事件，系统自动记录补录时间，需手动填写真实发生时间
5. **家长通知**：通知状态追踪，失败通知进入待补发列表，支持一键补发
6. **附件管理**：按角色权限控制附件访问
7. **报告导出**：支持匿名报告和完整报告导出
8. **公开报表**：无需登录，仅展示脱敏聚合数据

### 关键业务规则
- 处理时长统计 **只使用真实发生时间** (`actual_occurred_at`)，不使用补录时间
- 未确认事件和已关闭事件 **分开展示**
- 通知失败事件 **单独进入待补发列表**
- 公开报表 **只显示聚合信息**，不包含敏感数据
- 附件 **按权限控制访问** (仅负责人/老师/全部)

## 快速开始

### 前置要求
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### 后端启动

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # macOS/Linux

# 安装依赖
pip install -r requirements.txt

# 配置数据库连接
# 修改 app/config.py 中的 DATABASE_URL 或创建 .env 文件

# 初始化数据库和测试数据
python scripts/init_data.py

# 启动服务
uvicorn app.main:app --reload --port 8000
```

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 测试账号
- 项目负责人: `zhang@camp.com` / `123456`
- 带队老师1: `li@camp.com` / `123456`
- 带队老师2: `wang@camp.com` / `123456`

### 访问地址
- 前端: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs
- 公开报表: http://localhost:3000/public

## 项目结构

```
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI 主入口
│   │   ├── config.py            # 配置
│   │   ├── database.py          # 数据库连接
│   │   ├── models.py            # SQLAlchemy 模型
│   │   ├── schemas.py           # Pydantic 模型
│   │   ├── auth.py              # 认证与权限
│   │   └── routers/
│   │       ├── auth.py          # 认证路由
│   │       ├── events.py        # 事件管理
│   │       ├── checkpoints.py   # 签到点
│   │       ├── notifications.py # 通知管理
│   │       ├── reports.py       # 报表统计
│   │       └── attachments.py   # 附件管理
│   ├── scripts/
│   │   └── init_data.py         # 初始化测试数据
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx              # 路由配置
    │   ├── auth.tsx             # 认证上下文
    │   ├── api.ts               # API 服务
    │   ├── types.ts             # TypeScript 类型
    │   ├── utils.ts             # 工具函数
    │   ├── components/
    │   │   ├── Layout.tsx       # 布局组件
    │   │   └── EventCard.tsx    # 事件卡片
    │   └── pages/
    │       ├── Login.tsx        # 登录页
    │       ├── Dashboard.tsx    # 主看板(时间线)
    │       ├── EventDetail.tsx  # 事件详情
    │       ├── EventNew.tsx     # 事件补录
    │       ├── MapPage.tsx      # 点位地图
    │       ├── ReportsPage.tsx  # 数据报表
    │       └── PublicReport.tsx # 公开报表
    └── package.json
```

## API 接口

### 认证
- `POST /api/auth/login` - 用户登录

### 事件管理
- `GET /api/events` - 获取事件列表
- `GET /api/events/:id` - 获取事件详情
- `POST /api/events` - 创建事件(补录)
- `PUT /api/events/:id` - 更新事件
- `POST /api/events/:id/confirm` - 确认事件
- `POST /api/events/:id/close` - 关闭事件
- `GET /api/events/pending-notifications` - 获取待补发通知列表

### 签到点
- `GET /api/checkpoints` - 获取签到点列表

### 通知
- `POST /api/notifications/:id/resend` - 补发通知

### 报表
- `GET /api/reports/notification-rate` - 通知完成率统计
- `GET /api/reports/event-status` - 事件状态统计
- `GET /api/reports/handle-duration` - 处理耗时统计(基于真实发生时间)
- `GET /api/reports/public` - 公开聚合数据
- `GET /api/reports/export` - 导出报告

### 附件
- `GET /api/events/:id/attachments` - 获取事件附件
- `POST /api/events/:id/attachments` - 上传附件
- `GET /api/attachments/:id` - 下载附件(权限控制)
