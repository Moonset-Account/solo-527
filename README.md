# 实验室试剂库存管理系统

Reagent Inventory Management System - 面向高校实验室的试剂全生命周期管理平台

## 功能特性

### 核心业务
- 🧪 **试剂管理**：试剂档案、CAS号、危险等级、MSDS文档
- 📦 **批号追踪**：每个批次独立管理，扫码出入库
- 🗄️ **柜位管理**：按类型（普通/易燃/腐蚀/毒品/冷藏/冷冻）分类存放
- 📋 **领用审批**：多级审批流程，支持领用和归还
- 📊 **库存盘点**：全盘/抽盘，差异记录，照片存档

### 安全特性
- 🔒 **双人确认**：高危/极危试剂领用必须双人确认
- 📜 **审计日志**：所有操作不可删除，完整追溯
- ⚠️ **危险等级**：5级分类（NONE/LOW/MEDIUM/HIGH/EXTREME），自动触发管控

### 智能预警
- 📉 **低库存提醒**：低于阈值自动通知管理员
- ⏰ **过期预警**：提前30天预警即将过期试剂
- 🔔 **通知中心**：支持多种通知类型，已读/未读状态

### 多端支持
- 🖥️ **管理后台**：PC端完整管理功能
- 📱 **移动端**：H5适配，扫码、拍照、离线支持
- 📶 **离线模式**：无网络时本地缓存，联网后自动同步

### 多角色系统
- 👑 **管理员**：全功能权限，用户管理，审计日志
- 🔬 **实验室成员**：试剂查询、领用申请、确认、盘点
- 👤 **外部用户**：受限访问，仅查询权限

## 技术架构

### 后端技术栈
- **框架**: FastAPI 0.104.1 + Pydantic v2
- **ORM**: SQLAlchemy 2.0 + Alembic (预留)
- **数据库**: PostgreSQL 15
- **缓存/队列**: Redis 7
- **认证**: JWT + OAuth2 + bcrypt
- **对象存储**: MinIO (S3兼容)
- **后台任务**: Celery Worker 架构
- **日志**: 多输出通道，按天/大小切割

### 前端技术栈
- **框架**: Vue 3.3 + TypeScript + Vite 5
- **状态管理**: Pinia
- **UI组件**: Element Plus + Tailwind CSS
- **路由**: Vue Router 4
- **图表**: ECharts 5 + vue-echarts
- **扫码**: html5-qrcode
- **离线存储**: localforage (IndexedDB)
- **HTTP**: Axios 拦截器封装

## 快速开始

### 方式一：Docker Compose 一键启动（推荐）

```bash
# 1. 复制环境变量配置
cp .env.example .env

# 2. 启动所有服务
docker-compose up -d

# 3. 访问应用
# 管理后台: http://localhost:3000
# API文档: http://localhost:8000/docs
# MinIO控制台: http://localhost:9001
```

### 方式二：本地开发

#### 后端启动
```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
export DATABASE_URL=postgresql://postgres:password@localhost:5432/reagent_db
export REDIS_URL=redis://localhost:6379/0
export SECRET_KEY=your-secret-key-here

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 前端启动
```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 测试账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | admin | admin123 | 系统管理员，全部权限 |
| 管理员 | manager | manager123 | 实验室主管 |
| 研究员 | researcher1 | research123 | 普通成员，可申请/确认 |
| 研究员 | researcher2 | research123 | 普通成员 |
| 外部用户 | supplier | supplier123 | 供应商，受限访问 |

## API 接口

系统提供完整的 RESTful API，主要模块：

| 模块 | 前缀 | 说明 |
|------|------|------|
| 认证 | `/api/v1/auth` | 登录、登出、获取当前用户 |
| 用户 | `/api/v1/users` | 用户管理（管理员） |
| 试剂 | `/api/v1/reagents` | 试剂和批次管理 |
| 柜位 | `/api/v1/storage` | 存储柜位管理 |
| 领用 | `/api/v1/requisitions` | 领用申请、审批、确认 |
| 盘点 | `/api/v1/inventory` | 盘点任务管理 |
| 通知 | `/api/v1/notifications` | 通知中心 |
| 附件 | `/api/v1/attachments` | 文件上传下载 |
| 审计 | `/api/v1/audit` | 审计日志（只读） |
| 离线 | `/api/v1/offline` | 离线数据同步 |
| 报表 | `/api/v1/reports` | 数据看板、导出 |

详细接口文档请访问：`http://localhost:8000/docs` (Swagger UI)

## 核心业务流程

### 1. 试剂入库流程
```
扫码/手动输入 → 选择试剂 → 填写批号/数量/有效期 → 选择柜位 → 拍照上传 → 提交
→ 自动生成条码 → 更新库存 → 记录审计日志
```

### 2. 领用审批流程
```
创建申请 → 选择试剂批次 → 填写用途 → 提交
├── 普通试剂 → 管理员审批 → 领用
└── 高危试剂 → 成员A确认 → 成员B确认 (双人确认) → 管理员审批 → 领用
→ 扣减库存 → 记录审计日志
```

### 3. 库存盘点流程
```
创建盘点任务 → 扫描/手动录入 → 拍照存档 → 系统自动比对 → 生成差异报告
→ 可导出Excel → 记录审计日志
```

## 项目结构

```
.
├── backend/                 # 后端 FastAPI 应用
│   ├── app/
│   │   ├── api/v1/          # API 路由 (11个模块)
│   │   ├── models/          # 数据库模型 (9个核心表)
│   │   ├── schemas/         # Pydantic 序列化
│   │   ├── crud/            # 业务逻辑层
│   │   ├── services/        # 服务层 (Redis/存储/通知/日志)
│   │   ├── main.py          # 应用入口
│   │   ├── config.py        # 配置管理
│   │   ├── database.py      # 数据库连接
│   │   ├── security.py      # 认证授权
│   │   ├── worker.py        # 后台任务
│   │   └── initial_data.py  # 初始化测试数据
│   ├── tests/               # API 测试
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # 前端 Vue 3 应用
│   ├── src/
│   │   ├── api/             # API 封装
│   │   ├── layouts/         # 布局组件 (管理后台/移动端)
│   │   ├── views/           # 页面组件
│   │   │   ├── admin/       # 管理后台页面 (12个)
│   │   │   └── mobile/      # 移动端页面 (9个)
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── router/          # 路由配置
│   │   └── main.ts          # 入口文件
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml       # 多服务编排
├── .env.example             # 环境变量模板
└── README.md
```

## 数据库设计 (核心表)

1. **users** - 用户表 (多角色RBAC)
2. **reagents** - 试剂表 (危险等级、最低库存阈值)
3. **reagent_batches** - 试剂批次表 (条码、有效期、剩余量)
4. **storage_cabinets** - 存储柜位表 (按类型分类)
5. **requisitions** - 领用申请表 (状态流转、双人确认)
6. **requisition_items** - 领用明细表
7. **inventory_checks** - 盘点任务表
8. **inventory_check_items** - 盘点明细表
9. **notifications** - 通知表
10. **attachments** - 附件表
11. **audit_logs** - 审计日志表 (**不可删除**)
12. **offline_sync_records** - 离线同步记录表

## 验收标准对照

| 验收项 | 实现方式 | 位置 |
|--------|----------|------|
| 高危试剂双人确认 | CRUD层自动检测hazard_level，API层双重校验 | `crud/requisition.py` |
| 历史记录不可删除 | CRUDAuditLog.remove()直接抛异常 | `crud/audit.py` |
| 扫码入库 | html5-qrcode + 条码查询API | `views/mobile/Scan.vue` |
| 领用审批流程 | 状态机 + 角色权限控制 | `models/requisition.py` |
| 低库存提醒 | 后台Worker定时扫描 + Redis去重 | `services/notification_service.py` |
| 过期预警 | 提前30天检测 + Redis缓存防重复 | `services/notification_service.py` |
| 盘点报告 | 自动计算差异 + 导出Excel | `api/v1/reports.py` |
| 多角色入口 | 路由守卫 + 角色权限中间件 | `router/index.ts` + `security.py` |
| 移动端适配 | Tailwind响应式 + 独立移动端布局 | `layouts/MobileLayout.vue` |
| 拍照上传 | Element Plus Upload + MinIO | `api/v1/attachments.py` |
| 离线补提交 | localforage + /batch-sync API | `views/mobile/StockIn.vue` |
| 测试账号 | 启动时自动初始化5个账号 | `initial_data.py` |
| 通知/附件/追踪 | 完整测试样例 | `initial_data.py` |

## 测试

```bash
# 后端 API 测试
cd backend
pytest tests/test_api.py -v
```

## 许可证

MIT License
