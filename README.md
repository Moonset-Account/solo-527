# 连锁口腔预约分诊台管理系统

面向诊所院长的连锁口腔预约分诊管理系统。

## 技术栈

- **前端**: React 18 + Ant Design 5 + Vite
- **后端**: Express.js + Prisma ORM
- **数据库**: MySQL (生产) / SQLite (演示)
- **状态管理**: React Hooks

## 核心功能

### 1. 分诊台 (核心日常操作)
- 患者搜索与选择
- 医生排班浏览、号源选择
- 快速预约、填写主诉
- **病历摘要、随访任务、患者档案侧边栏** - 核心信息贴着操作按钮，减少跳转
- 今日预约列表

### 2. 预约管理
- 预约列表、筛选查询
- 状态变更（待确认→已确认→已完成/已取消）
- 快速写病历
- 状态历史追踪

### 3. 患者档案
- 患者信息管理
- 就诊记录时间线
- 病历历史
- 随访任务
- 状态历史

### 4. 排班管理
- 单日排班
- **批量排班**（按日期范围+星期几组合）
- 号源时段管理
- 停诊/恢复排班
- 排班状态历史

### 5. 号源冲突处理
- 冲突检测与列表
- **负责人处理冲突**（取消部分预约/调整号源）
- 处理后自动更新复诊率报表
- 操作留痕

### 6. 数据统计
- **复诊率趋势图**
- 号源利用率
- 医生工作量排行
- 关键指标概览

### 7. 状态历史 & 操作留痕
所有业务记录都有完整的状态历史：
- 预约状态历史
- 排班状态历史
- 号源状态历史
- 病历状态历史
- 随访状态历史
- 预约操作日志

## 项目结构

```
.
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── server.js        # 入口文件
│   │   ├── prisma.js        # Prisma 客户端
│   │   └── routes/          # API 路由
│   │       ├── patients.js
│   │       ├── doctors.js
│   │       ├── schedules.js
│   │       ├── appointments.js
│   │       ├── records.js
│   │       ├── followups.js
│   │       ├── conflicts.js
│   │       └── stats.js
│   └── prisma/
│       ├── schema.prisma    # 数据库模型 (MySQL版)
│       ├── schema.sqlite.prisma # SQLite演示版
│       └── seed.js          # 种子数据
│
└── frontend/                # 前端应用
    ├── src/
    │   ├── pages/           # 页面组件
    │   │   ├── ReceptionPage.jsx      # 分诊台
    │   │   ├── AppointmentListPage.jsx # 预约管理
    │   │   ├── PatientListPage.jsx    # 患者档案
    │   │   ├── SchedulePage.jsx       # 排班管理
    │   │   ├── ConflictPage.jsx       # 号源冲突
    │   │   └── StatsPage.jsx          # 数据统计
    │   ├── components/
    │   │   └── MainLayout.jsx         # 主布局
    │   ├── services/                  # API 服务层
    │   └── utils/
    └── package.json
```

## 快速启动

### 方式一：使用 SQLite 演示版（推荐快速体验）

```bash
# 1. 安装后端依赖
cd backend
npm install

# 2. 初始化数据库
npx prisma generate
npx prisma db push

# 3. 导入种子数据
npm run prisma:seed

# 4. 启动后端服务
npm run dev
# 后端运行在 http://localhost:3001

# 5. 新开终端，启动前端
cd ../frontend
npm install
npm run dev
# 前端运行在 http://localhost:3000
```

### 方式二：使用 MySQL 生产版

1. 修改 `backend/prisma/schema.prisma` 使用 MySQL provider
2. 配置 `backend/.env` 中的数据库连接
3. 运行 `npx prisma migrate dev`
4. 其余步骤同上

## API 接口

### 基础路径
`/api`

### 主要接口
| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 诊所 | GET | /api/clinics | 诊所列表 |
| 患者 | GET/POST/PUT | /api/patients | 患者 CRUD |
| 医生 | GET/POST/PUT | /api/doctors | 医生 CRUD |
| 排班 | GET/POST/PUT | /api/schedules | 排班管理 |
| 号源 | PUT | /api/schedules/slots/:id | 号源状态变更 |
| 预约 | GET/POST/PUT | /api/appointments | 预约管理 |
| 病历 | GET/POST/PUT | /api/records | 病历管理 |
| 随访 | GET/POST/PUT | /api/followups | 随访管理 |
| 冲突 | GET/PUT | /api/conflicts | 号源冲突处理 |
| 统计 | GET | /api/stats/* | 数据统计 |

## 设计亮点

### 1. 状态历史模式
所有业务实体都有对应的 `*StatusHistory` 表，记录：
- `fromStatus` - 变更前状态
- `toStatus` - 变更后状态
- `remark` - 变更原因
- `operatorId/operatorName` - 操作人
- `createdAt` - 操作时间

### 2. 操作日志
预约等关键操作有详细的 `OperationLog`，记录字段级别的变更。

### 3. 少跳转设计
- 分诊台页面集成患者快速信息、病历摘要、随访任务
- 详情抽屉 + Tabs 切换，减少页面跳转
- 核心操作按钮贴着关键信息

### 4. 连锁支持
数据模型支持多诊所，可扩展为连锁管理。

## 注意事项

- 演示版本使用 SQLite 数据库，适合快速体验
- 生产环境建议使用 MySQL 并配置连接池
- 系统暂未实现完整的权限控制，建议接入时增加
