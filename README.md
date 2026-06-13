# 北桥网格事件台

网格事件协商投票站系统，基于 React、Vite、NestJS、PostgreSQL 和 TypeORM 构建。

## 功能特性

### 📋 事件管理
- **整改复查**: 问题上报、整改跟踪、复查确认
- **议题投票**: 社区议题发起、投票表决、结果统计
- **巡逻任务**: 网格巡逻、路线规划、任务执行

### 🗳️ 投票管理
- 投票规则配置（通过率、参与率、投票时长）
- 单选/多选投票支持
- 投票资格异常检测与待办处理
- 投票进度实时统计

### ✅ 任务管理
- 整改任务、巡逻任务、复查任务分类管理
- 任务分配与状态跟踪
- 截止时间提醒

### ⚠️ 待办事项
- 投票资格异常自动进入待办
- 影响帮扶进度统计
- 优先级管理

### 📊 数据报表
- 事件闭环过程数据统计
- 帮扶进度报表（受投票异常影响）
- 人员绩效统计
- 班次工作量统计
- 投票参与率分析

### 🔍 筛选功能
- 按状态筛选
- 按负责人筛选
- 按班次筛选（早班/中班/晚班）
- 按网格区域筛选
- 按时间范围筛选

### 📝 操作面板
- **附件管理**: 支持图片、文档上传
- **备注记录**: 事件处理过程记录
- **修改历史**: 完整的操作审计日志

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 5
- Ant Design 5
- React Router 6
- Axios
- ECharts

### 后端
- NestJS 10
- TypeScript
- TypeORM 0.3
- PostgreSQL
- JWT 认证
- bcrypt 密码加密

## 快速开始

### 环境要求
- Node.js >= 16
- PostgreSQL >= 12
- npm 或 yarn

### 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装所有子项目依赖
npm run install:all
```

### 数据库配置

1. 创建 PostgreSQL 数据库
```sql
CREATE DATABASE beiqiao_grid;
```

2. 执行初始化脚本（创建默认用户和规则）
```bash
psql -d beiqiao_grid -f backend/init.sql
```

3. 修改 `backend/.env` 中的数据库连接配置

### 启动项目

```bash
# 同时启动前后端
npm run dev

# 仅启动后端
npm run dev:backend

# 仅启动前端
npm run dev:frontend
```

### 访问地址
- 前端: http://localhost:5173
- 后端 API: http://localhost:3001/api

### 默认账号
- 用户名: `admin`
- 密码: `admin123`

## 项目结构

```
beiqiao-grid-event-platform/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   ├── components/      # 公共组件
│   │   ├── services/        # API 服务
│   │   └── types/           # TypeScript 类型定义
│   └── package.json
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── modules/         # 业务模块
│   │   │   ├── user/        # 用户模块
│   │   │   ├── event/       # 事件模块
│   │   │   ├── vote/        # 投票模块
│   │   │   ├── task/        # 任务模块
│   │   │   ├── todo/        # 待办模块
│   │   │   ├── report/      # 报表模块
│   │   │   └── upload/      # 上传模块
│   │   └── common/          # 公共模块
│   ├── init.sql             # 数据库初始化脚本
│   └── package.json
└── package.json             # 根目录配置
```

## 核心流程

### 事件闭环流程
1. **上报事件**: 用户上报问题，填写位置和描述
2. **分配处理**: 管理人员分配给网格员处理
3. **整改执行**: 网格员进行整改并提交结果
4. **复查确认**: 管理人员复查整改结果
5. **事件关闭**: 复查通过后关闭事件

### 投票流程
1. **创建投票**: 管理人员创建投票议题
2. **配置规则**: 选择或配置投票规则
3. **启动投票**: 投票开始，符合资格用户参与投票
4. **异常处理**: 投票资格异常自动生成待办
5. **结束投票**: 统计结果，生成报表

### 投票资格异常处理
- 检测到投票资格异常时自动创建待办
- 待办标记为"影响帮扶进度"
- 影响帮扶进度报表的综合评分
- 处理完成后恢复评分

## API 接口

### 用户模块
- `POST /api/users/login` - 登录
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户

### 事件模块
- `GET /api/events` - 获取事件列表
- `GET /api/events/stats` - 获取事件统计
- `POST /api/events` - 创建事件
- `PUT /api/events/:id` - 更新事件
- `GET /api/events/:id/notes` - 获取备注
- `POST /api/events/:id/notes` - 添加备注
- `GET /api/events/:id/attachments` - 获取附件
- `POST /api/events/:id/attachments` - 上传附件
- `GET /api/events/:id/histories` - 获取修改历史

### 投票模块
- `GET /api/votes` - 获取投票列表
- `POST /api/votes` - 创建投票
- `POST /api/votes/:id/start` - 启动投票
- `POST /api/votes/:id/end` - 结束投票
- `POST /api/votes/:id/vote` - 提交投票
- `GET /api/votes/rules` - 获取投票规则
- `POST /api/votes/rules` - 创建投票规则

### 报表模块
- `GET /api/reports/help-progress` - 帮扶进度报表
- `GET /api/reports/event-closure` - 事件闭环统计
- `GET /api/reports/performance` - 人员绩效
- `GET /api/reports/vote-participation` - 投票参与统计
- `GET /api/reports/shift-stats` - 班次统计

## 业务亮点

1. **投票资格异常处理**: 不只是群里提醒，而是进入待办系统并影响帮扶进度报表，形成闭环管理
2. **事件闭环可视化**: 详情页展示完整的事件处理流程时间线
3. **多维度筛选**: 支持按负责人、状态、班次、区域、时间等组合筛选
4. **操作面板完整**: 每个事件都有附件、备注、修改历史，操作可追溯
5. **帮扶进度评分**: 综合考虑事件闭环率和投票异常处理情况，自动计算帮扶进度评分
