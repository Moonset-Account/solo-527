# 心理咨询预约日历系统

服务调度员专用的心理咨询预约管理系统，基于 React + Ant Design + Express + MySQL + Prisma 技术栈。

## 功能模块

### 客户端（日常入口）
- **预约咨询师**：选择咨询师、日期、时段
- **填写来访原因**：隐私保护声明前置，支持 500 字内描述
- **隐私保护提醒**：预约前必须阅读并同意隐私政策
- **候补机制**：时段满员时自动加入候补

### 管理端（服务调度工作台）
- **总览看板**：预约统计、核销效率、咨询师效率排行、每日趋势
- **可约时段**：单个/批量设置时段、服务时长、容量、启用停用
- **到店核销**：确认预约、到店核销、完成咨询、详情查看、操作记录
- **爽约名单**：标记爽约、更新爽约原因、候补超时处理
- **查询下载**：
  - 多条件检索（姓名/电话/状态/咨询师/日期）
  - 导出 CSV/JSON
  - 导出字段包含：核销效率、候补超时、最近一次操作等，方便跨部门核对

## 目录结构

```
work-0206/
├── backend/                 # Express 后端
│   ├── prisma/
│   │   └── schema.prisma    # 数据模型
│   ├── src/
│   │   ├── middleware/      # 错误处理中间件
│   │   ├── routes/          # API 路由
│   │   │   ├── appointments.js  # 预约管理
│   │   │   ├── counselors.js    # 咨询师
│   │   │   ├── export.js        # 数据导出
│   │   │   ├── stats.js         # 统计数据
│   │   │   └── timeSlots.js     # 时段管理
│   │   ├── prisma.js        # Prisma 客户端
│   │   └── server.js        # 入口
│   ├── .env                 # 环境配置
│   └── package.json
└── frontend/                # React 前端
    ├── src/
    │   ├── pages/
    │   │   ├── client/ClientBooking.jsx  # 客户端预约页
    │   │   └── admin/                     # 管理端页面
    │   │       ├── AdminDashboard.jsx     # 总览
    │   │       ├── AdminTimeSlots.jsx     # 可约时段
    │   │       ├── AdminCheckIn.jsx       # 到店核销
    │   │       ├── AdminNoShow.jsx        # 爽约名单
    │   │       └── AdminExport.jsx        # 查询下载
    │   ├── services/api.js   # API 封装
    │   ├── App.jsx           # 路由
    │   ├── main.jsx          # 入口
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 快速启动

### 1. 数据库准备

确保本地已安装 MySQL，并创建数据库：

```sql
CREATE DATABASE counseling_calendar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

根据需要修改 `backend/.env` 中的数据库连接串。

### 2. 后端启动

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

后端运行在 http://localhost:3001

### 3. 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端运行在 http://localhost:5173

## 数据模型

- **Counselor（咨询师）**：姓名、职称、专长、头像、启用状态
- **TimeSlot（时段）**：咨询师、日期、起止时间、时长、容量、已预约数
- **Appointment（预约）**：时段、来访人信息、来访原因、状态（待确认/已确认/已到店/已完成/爽约/已取消）、候补状态、操作追踪
- **OperationLog（操作日志）**：预约关联、操作类型、操作人、备注、时间戳

## 预约状态流转

```
待确认(PENDING) → 已确认(CONFIRMED) → 已到店(CHECKED_IN) → 已完成(COMPLETED)
        ↓               ↓
     爽约(NO_SHOW)   取消(CANCELLED)
```

候补用户在有空位时需管理员手动"确认预约"转为正常预约。

## 核销效率计算

- **整体核销率** = (已完成 + 已到店) / (已完成 + 已到店 + 爽约) × 100%
- **爽约率** = 爽约数 / 预约总数 × 100%
- **按咨询师统计**：每位咨询师独立计算核销效率
- **按日趋势**：每日核销效率变化

## 导出字段说明

下载 CSV/JSON 包含以下字段（用于跨部门核对）：
- 预约编号、预约时间、咨询日期、时段、服务时长、咨询师
- 来访人、联系电话、邮箱、来访原因
- 状态、到店时间、结束时间、爽约原因
- 是否候补、候补是否超时
- **核销效率**（已完成=100%，爽约=0%，未完成=未完成）
- **候补超时**（是/否）
- **最近一次操作**、**最近操作时间**
