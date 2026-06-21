# 志愿活动数据看板

基于 Remix + Express + MongoDB + Redis 的志愿服务管理系统，支持志愿者排班、签到、反馈审核、捐赠管理、缺席处理和预警等功能。

## 功能特性

### 志愿者队长功能
- 📅 **志愿排班** - 查看和管理志愿班次，支持报名和确认
- ✅ **签到管理** - 志愿者签到签退，记录服务时长
- 💬 **反馈审核** - 审核和处理志愿者反馈
- 💝 **捐赠明细** - 查看捐赠记录，支持追溯原单
- ⚠️ **缺席处理** - 记录志愿者缺席，包含影响范围、责任人和处理计划
- 🔔 **预警中心** - 实时预警提醒，及时处理问题

### 运营人员功能
- 🎯 **活动管理** - 创建和管理志愿服务活动
- 👥 **志愿者管理** - 志愿者信息管理
- 📊 **公开统计** - 对外公开的活动和捐赠数据
- 📷 **照片管理** - 活动照片上传和管理

### 核心特性
- 🔗 **记录可追溯** - 所有记录支持关联原单，方便溯源
- 📱 **移动端适配** - 手机查看保留关键字段和操作按钮
- 📎 **附件和备注** - 关键附件和备注不丢失
- 📝 **关闭说明** - 关闭记录前可补充处理说明
- ⚡ **Redis 缓存** - 提升数据查询性能
- 🔒 **权限管理** - 多角色权限控制

## 技术栈

- **前端**: Remix (React) + TypeScript
- **后端**: Express.js
- **数据库**: MongoDB
- **缓存**: Redis
- **认证**: JWT
- **文件上传**: Multer

## 项目结构

```
.
├── client/                 # Remix 前端
│   ├── app/
│   │   ├── routes/         # 页面路由
│   │   ├── styles/         # 样式文件
│   │   └── utils/          # 工具函数
│   └── package.json
├── server/                 # Express 后端
│   ├── src/
│   │   ├── config/         # 配置（数据库、Redis）
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # MongoDB 数据模型
│   │   ├── routes/         # API 路由
│   │   ├── index.js        # 入口文件
│   │   └── seed.js         # 种子数据
│   └── package.json
├── package.json            # 根 package
└── .env.example            # 环境变量示例
```

## 快速开始

### 环境要求

- Node.js >= 18
- MongoDB >= 4.4
- Redis >= 6

### 安装依赖

```bash
npm install
```

### 环境配置

复制 `.env.example` 为 `.env` 并根据实际情况修改：

```bash
cp .env.example .env
```

主要配置项：
- `PORT`: 后端服务端口，默认 3001
- `MONGODB_URI`: MongoDB 连接地址
- `REDIS_URL`: Redis 连接地址
- `JWT_SECRET`: JWT 密钥
- `UPLOAD_DIR`: 文件上传目录

### 启动 MongoDB 和 Redis

确保本地 MongoDB 和 Redis 服务已启动，或使用 Docker：

```bash
# MongoDB
docker run -d -p 27017:27017 --name mongodb mongo

# Redis
docker run -d -p 6379:6379 --name redis redis
```

### 初始化种子数据

```bash
cd server
npm run seed
```

种子数据包含三个测试账号：
- **管理员**: admin / 123456
- **志愿者队长**: leader / 123456
- **运营人员**: operator / 123456

### 启动开发服务

在项目根目录执行：

```bash
npm run dev
```

或者分别启动：

```bash
# 启动后端
npm run dev:server

# 启动前端
npm run dev:client
```

- 前端地址: http://localhost:5173
- 后端地址: http://localhost:3001

### 生产构建

```bash
npm run build
```

## 主要功能模块

### 1. 志愿排班
- 按日期、状态筛选班次
- 查看班次详情和志愿者名单
- 添加/确认/取消志愿者报名
- 记录签到签退状态

### 2. 签到管理
- 查看签到记录
- 支持签到、签退操作
- 记录服务时长
- 支持状态标记（迟到、早退、缺席）

### 3. 反馈审核
- 多状态流转：待审核 → 审核中 → 已解决/已驳回
- 优先级标记
- 审核意见和处理方案
- 关闭前补充处理说明
- 关联原单追溯

### 4. 捐赠明细
- 现金、物资、服务三种类型
- 状态流转：待确认 → 已确认 → 已接收
- 支持公开/不公开设置
- 物资清单明细
- 关联原单追溯

### 5. 缺席处理
- 记录缺席类型（未到岗、迟到、早退、临时取消）
- 记录影响范围和影响程度
- 指定责任人和处理计划
- 替补志愿者安排
- 关闭前补充处理说明

### 6. 预警中心
- 多种预警类型：人数不足、缺席预警、紧急反馈等
- 严重程度分级：提示、警告、严重、紧急
- 确认、解决、忽略操作
- 关联相关记录

### 7. 统计仪表板
- 活动、志愿者、服务时长等核心指标
- 本周数据趋势图
- 待办事项提醒
- 预警统计

## API 接口

### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `GET /api/auth/profile` - 获取个人信息

### 活动
- `GET /api/activities` - 活动列表
- `GET /api/activities/public` - 公开活动列表
- `GET /api/activities/:id` - 活动详情
- `POST /api/activities` - 创建活动
- `PUT /api/activities/:id` - 更新活动

### 排班
- `GET /api/schedules` - 排班列表
- `GET /api/schedules/:id` - 排班详情
- `POST /api/schedules` - 创建排班
- `POST /api/schedules/:id/signup` - 报名班次
- `PUT /api/schedules/:id/volunteers/:volunteerId` - 更新志愿者状态

### 签到
- `GET /api/checkins` - 签到记录列表
- `GET /api/checkins/:id` - 签到详情
- `POST /api/checkins` - 签到
- `PUT /api/checkins/:id/checkout` - 签退

### 反馈
- `GET /api/feedbacks` - 反馈列表
- `GET /api/feedbacks/:id` - 反馈详情
- `POST /api/feedbacks` - 提交反馈
- `PUT /api/feedbacks/:id/review` - 审核
- `PUT /api/feedbacks/:id/handle` - 处理
- `PUT /api/feedbacks/:id/close` - 关闭

### 捐赠
- `GET /api/donations` - 捐赠列表
- `GET /api/donations/public` - 公开捐赠列表
- `GET /api/donations/:id` - 捐赠详情
- `POST /api/donations` - 登记捐赠
- `PUT /api/donations/:id/receive` - 接收捐赠
- `PUT /api/donations/:id/public` - 设置公开

### 缺席
- `GET /api/absences` - 缺席记录列表
- `GET /api/absences/:id` - 缺席详情
- `POST /api/absences` - 上报缺席
- `PUT /api/absences/:id/handle` - 处理
- `PUT /api/absences/:id/close` - 关闭

### 预警
- `GET /api/alerts` - 预警列表
- `GET /api/alerts/:id` - 预警详情
- `POST /api/alerts` - 创建预警
- `PUT /api/alerts/:id/acknowledge` - 确认
- `PUT /api/alerts/:id/resolve` - 解决
- `PUT /api/alerts/:id/dismiss` - 忽略

### 统计
- `GET /api/stats/dashboard` - 仪表板统计
- `GET /api/stats/weekly` - 周统计
- `GET /api/stats/public` - 公开统计

### 上传
- `POST /api/uploads/single` - 单文件上传
- `POST /api/uploads/multiple` - 多文件上传

## 数据模型

### User（用户）
- username, password, name, role, phone, email, team, status

### Volunteer（志愿者）
- name, phone, idCard, gender, age, team, skills, totalHours, status

### Activity（活动）
- title, description, type, location, startDate, endDate, status, photos, attachments

### Schedule（排班）
- activityId, date, shiftName, startTime, endTime, volunteers[], status

### CheckIn（签到）
- scheduleId, volunteerId, checkInTime, checkOutTime, status, hours

### Feedback（反馈）
- type, title, content, rating, status, priority, reviewComment, handlePlan, closeNote

### Donation（捐赠）
- donorName, type, amount, items, status, isPublic, publicNote

### Absence（缺席）
- volunteerId, scheduleId, type, reason, impactScope, impactLevel, responsiblePerson, handlePlan, closeNote

### Alert（预警）
- type, title, message, severity, status, relatedId, assignedTo

## 移动端适配

应用已做响应式适配：
- 桌面端：完整功能和数据展示
- 移动端：保留关键字段和操作按钮，简化复杂报表
- 侧边栏支持折叠，适配小屏幕

## 开发说明

### 缓存策略
使用 Redis 对常用查询进行缓存：
- 列表数据缓存 60-120 秒
- 公开数据缓存 300 秒
- 数据更新时自动清除相关缓存

### 权限角色
- **admin**: 所有权限
- **leader**: 排班、签到、反馈、捐赠、缺席、预警查看和处理
- **operator**: 活动管理、志愿者管理、运营相关功能

## License

MIT
