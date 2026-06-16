# IT账号变更审批系统

一个完整的IT账号变更审批流管理系统，包含前台申请和后台管理功能。

## 技术栈

### 后端
- **FastAPI** - Python 高性能 Web 框架
- **PostgreSQL** - 关系型数据库
- **SQLAlchemy** - ORM 框架
- **Celery** - 异步任务队列
- **Redis** - 消息代理和缓存
- **JWT** - 身份认证

### 前端
- **Nuxt 3** - Vue 3 全栈框架
- **Naive UI** - Vue 3 组件库
- **Pinia** - 状态管理
- **Tailwind CSS** - CSS 框架

## 功能特性

### 账号体系与权限
- 三级权限：普通用户、管理员、安全负责人
- JWT 令牌认证
- 账号密码登录
- 越权操作审计日志

### 申请与审批流
- 账号变更申请
- 故障上报
- 变更窗口审批
- 回滚方案审批
- 实施结果提交
- 审批历史记录

### 配置管理（管理员）
- 设备巡检管理
- 告警确认管理
- 漏洞修复管理
- 记录操作人信息

### 日志管理
- 审计日志（操作记录）
- API 错误日志（异常原因、次数、结果）
- 错误标记解决

## 快速开始

### 后端启动

1. 安装依赖
```bash
cd backend
pip install -r requirements.txt
```

2. 配置环境变量
```bash
cp .env.example .env
# 修改 .env 中的数据库连接等配置
```

3. 确保 PostgreSQL 和 Redis 运行

4. 启动服务
```bash
chmod +x run.sh
./run.sh
```

5. 启动 Celery worker（可选）
```bash
chmod +x run_celery.sh
./run_celery.sh
```

### 前端启动

1. 安装依赖
```bash
cd frontend
npm install
```

2. 配置环境变量
```bash
cp .env.example .env
```

3. 启动开发服务
```bash
npm run dev
```

## 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| security | security123 | 安全负责人 |
| user | user123 | 普通用户 |

## API 文档

启动后端后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 项目结构

```
.
├── backend/                 # 后端
│   ├── app/
│   │   ├── api/            # API 路由
│   │   ├── core/           # 核心配置
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── schemas/        # Pydantic 模型
│   │   └── tasks/          # Celery 任务
│   ├── requirements.txt
│   └── run.sh
└── frontend/               # 前端
    ├── components/         # 组件
    ├── composables/        # 组合式函数
    ├── layouts/            # 布局
    ├── middleware/         # 路由中间件
    ├── pages/              # 页面
    ├── stores/             # Pinia 状态
    └── nuxt.config.ts
```
