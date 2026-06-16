# 宿舍报修消息通知中心

一个完整的高校宿舍报修管理系统，包含学生端报修、管理端数据统计与通知推送、宿管端座位管理与身份审核等功能。

## 技术栈

**后端:**
- Django 4.2 + Django REST Framework 3.14
- PostgreSQL (主数据库)
- Redis + Celery (异步任务队列)
- JWT 身份认证

**前端:**
- React 18 + TypeScript + Vite
- Ant Design 5 (UI组件库)
- Zustand (状态管理)
- Axios (HTTP客户端)
- ECharts (数据可视化)

## 功能特性

### 学生端
- ✅ 提交报修申请（支持多图上传）
- ✅ 查看报修处理进度和历史
- ✅ 报修完成评价打分
- ✅ 消息通知与公告查看
- ✅ 自习室座位预约
- ✅ 座位签到
- ✅ 个人资料与密码管理

### 管理端 (管理员/维修人员)
- ✅ 报修工单管理（分配、状态流转）
- ✅ 数据统计仪表盘（状态分布、类型分布、处理时长）
- ✅ 推送通知（按角色、楼栋、指定用户推送）
- ✅ 公告管理（发布、置顶、过期）
- ✅ 用户管理（角色分配、状态管理）
- ✅ 角色权限配置（含变更历史）
- ✅ 操作日志审计
- ✅ 数据筛选导出（Excel格式）

### 宿管端
- ✅ 自习室与座位管理
- ✅ 座位预约记录管理
- ✅ 学生身份审核
- ✅ 签到核销（手动）
- ✅ 签到记录导出

## 项目结构

```
├── backend/                 # Django 后端
│   ├── apps/
│   │   ├── users/          # 用户与角色管理
│   │   ├── repairs/        # 报修管理
│   │   ├── notifications/  # 消息通知与公告
│   │   ├── audit/          # 审计日志
│   │   └── rooms/          # 自习室座位与签到
│   ├── config/             # 项目配置(settings, urls, celery)
│   ├── manage.py
│   └── requirements.txt
├── frontend/               # React 前端
│   ├── src/
│   │   ├── layouts/        # 布局组件
│   │   ├── pages/          # 页面
│   │   │   ├── admin/      # 管理端页面
│   │   │   ├── dorm/       # 宿管端页面
│   │   │   ├── student/    # 学生端页面
│   │   │   └── common/     # 通用页面
│   │   ├── store/          # Zustand 状态
│   │   └── utils/          # 工具函数
│   └── package.json
├── start.sh                # 一键启动脚本
├── start-backend.sh        # 后端启动
├── start-frontend.sh       # 前端启动
└── start-celery.sh         # Celery启动
```

## 快速开始

### 前置依赖
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### 1. 配置数据库

确保 PostgreSQL 和 Redis 正在运行，然后创建数据库:
```sql
CREATE DATABASE dorm_repair;
```

### 2. 启动后端

```bash
chmod +x start-backend.sh
./start-backend.sh
```

后端将在 http://localhost:8000 启动

脚本会自动:
- 创建虚拟环境
- 安装 Python 依赖
- 复制 .env 配置
- 执行数据库迁移
- 创建默认用户
- 启动开发服务器

### 3. 启动前端

```bash
chmod +x start-frontend.sh
./start-frontend.sh
```

前端将在 http://localhost:3000 启动

### 4. 启动 Celery (可选，用于异步任务)

```bash
chmod +x start-celery.sh
./start-celery.sh
```

### 5. 一键启动

```bash
chmod +x start.sh
./start.sh
```

## 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| student | 123456 | 学生 |
| dorm | 123456 | 宿管老师 |
| worker | 123456 | 维修人员 |

## API 接口

主要 API 端点:

- `POST /api/auth/login/` - JWT 登录
- `GET  /api/users/me/` - 当前用户信息
- `GET/POST /api/repairs/` - 报修申请列表/创建
- `POST /api/repairs/{id}/assign/` - 分配报修
- `POST /api/repairs/{id}/update_status/` - 更新状态
- `GET  /api/repairs/export/` - 导出报修数据
- `GET  /api/repairs/statistics/` - 统计数据
- `GET/POST /api/notifications/list/` - 通知
- `POST /api/notifications/list/{id}/push/` - 推送通知
- `GET/POST /api/notifications/announcements/` - 公告
- `GET  /api/notifications/my/` - 我的消息
- `GET/POST /api/rooms/study-rooms/` - 自习室
- `GET/POST /api/rooms/reservations/` - 座位预约
- `POST /api/rooms/checkins/do_checkin/` - 签到
- `GET  /api/audit/logs/` - 操作日志
- `GET  /api/users/role-configs/` - 角色配置

## 数据导出

系统支持将以下数据导出为 Excel (.xlsx):
- 报修记录（含处理效率筛选）
- 操作日志
- 签到记录
- 用户数据
- 公告数据

所有导出均通过 `django-import-export` 或 `openpyxl` 实现。

## 操作日志

系统自动记录所有关键操作:
- 用户登录/登出
- 报修的创建、分配、状态变更
- 通知发送、公告发布
- 用户审核、角色变更
- 座位预约、签到
- 所有数据导出操作

日志包含操作人、时间、IP地址、操作类型、模块、变更前后数据等。

## 消息通知机制

1. **实时推送**: 通过 Celery 异步任务批量分发
2. **状态变更通知**: 报修状态变更时自动推送给申请人和处理人
3. **多维度推送**: 支持按角色、楼栋、指定用户定向推送
4. **未读统计**: 前端每 60 秒轮询未读消息数量

## 处理效率统计

报修列表支持按以下维度筛选和导出:
- 创建/完成日期范围
- 处理时长 (最小/最大小时数)
- 责任处理人
- 处理状态
- 报修类型和优先级

明细字段包含:
- 处理时长 (小时)
- 最后处理记录
- 消息未读状态 (关联用户通知)

## License

MIT
