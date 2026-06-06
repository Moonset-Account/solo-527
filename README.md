# 连锁门店巡检整改平台

基于 Remix + Express + Redis + PostgreSQL 构建的连锁门店巡检整改管理系统。

## 功能特性

### 核心功能
- 📸 **照片上传**：支持问题照片和整改照片上传，与问题关联
- 📋 **整改任务管理**：完整的状态流转（待确认→待整改→已复查→已关闭）
- 👥 **角色权限**：督导、店长、区域经理三级权限体系
- ⏰ **逾期提醒**：Redis 驱动的定时任务，自动标记逾期问题
- 📊 **区域报表**：按门店、问题类型查看逾期率，支持 CSV 导出
- 📱 **离线提交**：移动端离线保存，网络恢复后自动同步重试

### 角色说明
- **督导**：提交巡检问题、确认问题、安排整改、复查、标记误报
- **店长**：处理本店问题、提交整改、上传整改照片
- **区域经理**：查看区域内所有门店、查看逾期率报表、导出报表

### 演示数据
- ✅ 误报问题（false_positive 状态）
- ✅ 超期未整改问题（is_overdue = true）
- ✅ 复查失败重新整改的问题（带 review_failure_reason）

## 技术栈

- **前端**：Remix v2 + React 18 + TypeScript
- **后端**：Express.js
- **数据库**：PostgreSQL
- **缓存/队列**：Redis
- **认证**：JWT + Session
- **文件上传**：Multer

## 快速开始

### 1. 环境准备

确保已安装：
- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

主要配置项：
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/store_inspection
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret
```

### 4. 初始化数据库

创建数据库：
```sql
CREATE DATABASE store_inspection;
```

运行数据库迁移：
```bash
npm run db:migrate
```

### 5. 导入演示数据

```bash
npm run db:seed
```

### 6. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 演示账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 督导 | supervisor1 | 123456 |
| 督导 | supervisor2 | 123456 |
| 店长（上海浦东店） | manager_sh001 | 123456 |
| 店长（上海静安店） | manager_sh002 | 123456 |
| 店长（北京朝阳店） | manager_bj001 | 123456 |
| 区域经理（华东区） | regional_east | 123456 |
| 区域经理（华北区） | regional_north | 123456 |
| 区域经理（华南区） | regional_south | 123456 |

## 项目结构

```
├── app/                    # Remix 前端代码
│   ├── components/        # 公共组件
│   ├── routes/            # 路由页面
│   ├── utils/             # 工具函数
│   ├── root.tsx           # 根组件
│   ├── entry.client.tsx   # 客户端入口
│   └── entry.server.tsx   # 服务端入口
├── server/                # Express 后端代码
│   ├── db/               # 数据库相关
│   │   ├── index.ts      # 数据库连接
│   │   ├── migrate.js    # 迁移脚本
│   │   └── seed.js       # 种子数据
│   ├── middleware/       # 中间件
│   ├── redis/           # Redis 连接
│   ├── routes/          # API 路由
│   ├── services/        # 业务服务
│   └── index.ts         # 服务入口
├── uploads/             # 上传文件存储目录
├── package.json
├── tsconfig.json
├── vite.config.ts
└── remix.config.js
```

## API 接口

### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 退出登录
- `GET /api/auth/me` - 获取当前用户

### 问题管理
- `GET /api/issues` - 获取问题列表（支持筛选、分页）
- `GET /api/issues/stats` - 获取问题统计
- `GET /api/issues/:id` - 获取问题详情
- `POST /api/issues` - 创建问题
- `PUT /api/issues/:id/status` - 更新问题状态

### 照片管理
- `POST /api/photos/:issueId` - 上传照片
- `GET /api/photos/:photoId` - 获取照片

### 门店管理
- `GET /api/stores` - 获取门店列表
- `GET /api/stores/:id` - 获取门店详情
- `GET /api/stores/:id/managers` - 获取门店管理员

### 报表
- `GET /api/reports/overview` - 获取报表概览
- `GET /api/reports/export` - 导出报表（CSV）

### 离线提交
- `POST /api/offline` - 保存离线提交
- `GET /api/offline/pending` - 获取待同步列表
- `POST /api/offline/:id/retry` - 重试提交
- `DELETE /api/offline/:id` - 删除离线提交

## 核心业务流程

### 1. 巡检提交流程
1. 督导登录系统
2. 选择门店，填写问题信息（类型、标题、描述等）
3. 拍摄现场照片并上传
4. 提交问题，状态为「待确认」

### 2. 确认整改流程
1. 督导查看待确认问题
2. 确认问题有效 → 安排给店长整改，状态变为「待整改」
3. 如为误报 → 标记为「误报」并关闭

### 3. 整改流程
1. 店长登录，查看本店待整改问题
2. 进行整改，上传整改照片
3. 提交复查申请，状态变为「已复查」

### 4. 复查流程
1. 督导查看已复查问题
2. 复查通过 → 关闭问题
3. 复查不通过 → 填写原因，状态回到「待整改」

### 5. 逾期处理
- 系统每小时自动检查超过整改期限的问题
- 自动标记为逾期，并发送提醒
- 在报表中统计逾期率

## 报表导出说明

导出的 CSV 报表包含以下字段，便于追责时复现筛选口径：
- 门店编码、门店名称、所属区域
- 问题类型、问题标题、当前状态、是否逾期
- 创建人、整改负责人
- 创建时间、整改期限
- 位置、冷柜温度、问题描述

筛选条件（日期范围、门店、问题类型等）会保留在导出时的参数中。

## 离线功能说明

### 前端离线支持
- 自动检测网络状态
- 离线时提交的问题自动保存到 localStorage
- 网络恢复后自动同步
- 可在「离线任务」页面手动管理

### 后端离线队列
- 支持保存离线提交到服务端队列
- 支持失败重试机制
- 记录重试次数和错误信息

## License

MIT
