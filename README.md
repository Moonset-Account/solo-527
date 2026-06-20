# 技术面试排课签到系统

一套完整的技术面试管理系统，支持分角色控制、操作记录、面试排课、测评管理、数据导出等功能。

## 技术栈

### 后端
- **框架**: NestJS 10.x
- **数据库**: MongoDB (Mongoose ODM)
- **缓存**: Redis (ioredis)
- **认证**: JWT + Passport
- **定时任务**: @nestjs/schedule
- **Excel 导出**: exceljs
- **数据加密**: bcryptjs

### 前端
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite 5.x
- **状态管理**: Pinia
- **路由**: Vue Router 4.x
- **UI 组件库**: Element Plus
- **图表**: ECharts
- **日期处理**: dayjs
- **HTTP 客户端**: Axios

## 功能模块

### 角色权限
- **管理员 (admin)**: 系统全权限，包括用户管理、档期管理、数据导出、提醒配置
- **面试官 (interviewer)**: 面试预约、快速测评、题库查询、签到记录、录用结果查看
- **HR (hr)**: 面试排课、数据导出、提醒配置

### 核心功能
1. **面试排课管理**
   - 预约面试（支持快速预约和详细预约）
   - 面试状态流转（待处理→已预约→已确认→已签到→进行中→已完成）
   - 签到功能
   - 档期冲突检测

2. **测评管理**
   - 快速测评流程
   - 多维度评分（技术能力、沟通能力、问题解决能力）
   - 自定义维度评分
   - 随机抽题
   - 录用建议

3. **题库管理**
   - 题目分类管理
   - 难度分级（简单/中等/困难/专家）
   - 多种题型（单选/多选/判断/简答/论述/编程）
   - 多条件检索

4. **讲师档期管理**
   - 档期 CRUD
   - 批量创建档期
   - 冲突检测
   - 状态管理（可预约/已预约/不可用）

5. **提醒系统**
   - 三级提醒：普通提示(INFO)、警告(WARNING)、阻断告警(BLOCKING)
   - 按讲师时间不足配置提醒规则
   - 普通提示和阻断告警分开展示
   - 定时任务自动检测

6. **数据导出**
   - 面试质量明细报表
   - 按日期范围、面试官、面试结果筛选
   - Excel 格式导出

7. **操作日志**
   - 所有关键操作记录
   - 支持按模块、操作类型、用户筛选
   - 记录 IP 地址和详细信息

8. **多条件检索**
   - 日期范围筛选
   - 状态筛选
   - 负责人筛选
   - 关键词搜索

## 项目结构

```
work-0330/
├── backend/                    # 后端项目
│   ├── src/
│   │   ├── auth/              # 认证模块
│   │   ├── users/             # 用户模块
│   │   ├── interviews/        # 面试模块
│   │   ├── assessments/       # 测评模块
│   │   ├── question-bank/     # 题库模块
│   │   ├── interviewers/      # 讲师档期模块
│   │   ├── reminders/         # 提醒模块
│   │   ├── exports/           # 导出模块
│   │   ├── operation-logs/    # 操作日志模块
│   │   ├── common/            # 公共枚举、DTO、装饰器
│   │   ├── redis/             # Redis 模块
│   │   ├── config/            # 配置模块
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # 前端项目
│   ├── src/
│   │   ├── api/               # API 封装
│   │   ├── components/        # 公共组件
│   │   ├── layouts/           # 布局组件
│   │   ├── router/            # 路由配置
│   │   ├── stores/            # 状态管理
│   │   ├── styles/            # 样式
│   │   ├── types/             # TypeScript 类型定义
│   │   ├── utils/             # 工具函数
│   │   ├── views/             # 页面组件
│   │   ├── App.vue
│   │   └── main.ts
│   ├── package.json
│   └── tsconfig.json
├── .env.example               # 环境变量示例
├── package.json               # 根 package.json (monorepo)
└── README.md
```

## 快速开始

### 环境要求
- Node.js >= 18.x
- MongoDB >= 4.4
- Redis >= 6.x

### 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd backend && npm install

# 安装前端依赖
cd ../frontend && npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

配置项说明：
- `MONGODB_URI`: MongoDB 连接地址
- `REDIS_HOST`: Redis 主机地址
- `REDIS_PORT`: Redis 端口
- `REDIS_PASSWORD`: Redis 密码（可选）
- `JWT_SECRET`: JWT 密钥
- `JWT_EXPIRES_IN`: JWT 过期时间
- `PORT`: 后端服务端口

### 启动服务

```bash
# 启动后端服务 (http://localhost:3000)
npm run dev:backend

# 启动前端服务 (http://localhost:5173)
npm run dev:frontend
```

### 构建生产版本

```bash
# 构建后端
npm run build:backend

# 构建前端
npm run build:frontend
```

## 演示账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@example.com | admin123 |
| 面试官 | interviewer1@example.com | 123456 |
| HR | hr1@example.com | 123456 |

## API 文档

后端服务启动后，可通过以下方式查看 API：
- 基础路径: `http://localhost:3000/api`

### 主要 API 端点

#### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出

#### 用户
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PATCH /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户

#### 面试
- `GET /api/interviews` - 获取面试列表
- `GET /api/interviews/:id` - 获取面试详情
- `POST /api/interviews` - 创建面试
- `POST /api/interviews/quick` - 快速创建面试
- `PATCH /api/interviews/:id/status` - 更新面试状态
- `POST /api/interviews/:id/checkin` - 签到
- `POST /api/interviews/:id/cancel` - 取消面试

#### 测评
- `GET /api/assessments` - 获取测评列表
- `POST /api/assessments` - 创建测评
- `GET /api/assessments/interview/:id` - 获取面试的测评

#### 题库
- `GET /api/question-bank` - 获取题目列表
- `GET /api/question-bank/random` - 随机抽题
- `POST /api/question-bank` - 创建题目

#### 档期
- `GET /api/schedules` - 获取档期列表
- `POST /api/schedules` - 创建档期
- `POST /api/schedules/batch` - 批量创建档期
- `PATCH /api/schedules/:id` - 更新档期
- `DELETE /api/schedules/:id` - 删除档期

#### 提醒
- `GET /api/reminders/my` - 获取我的提醒
- `GET /api/reminders/blocking` - 获取阻断告警
- `GET /api/reminders/unread-count` - 获取未读数量
- `PATCH /api/reminders/:id/read` - 标记已读
- `GET /api/reminders/configs` - 获取提醒配置
- `PATCH /api/reminders/configs/:id` - 更新提醒配置

#### 导出
- `GET /api/exports/interviews` - 导出面试数据

#### 操作日志
- `GET /api/operation-logs` - 获取操作日志列表

## 核心设计

### 角色权限控制

系统采用双重权限控制：

1. **路由级权限**：通过路由守卫检查用户角色
2. **按钮级权限**：通过 `hasRole()` 方法在模板中控制显示

```typescript
// 后端装饰器示例
@Roles(Role.ADMIN, Role.HR)
@UseGuards(JwtAuthGuard, RolesGuard)
@Post()
create(@Body() createDto: CreateInterviewDto) {
  return this.interviewsService.create(createDto);
}

// 前端模板示例
<el-menu-item v-if="userStore.hasRole(['admin', 'hr'])" index="/exports">
  数据导出
</el-menu-item>
```

### 提醒分级设计

通过 `ReminderType` 枚举严格区分三级提醒：

```typescript
export enum ReminderType {
  INFO = 'info',        // 普通提示
  WARNING = 'warning',  // 警告
  BLOCKING = 'blocking' // 阻断告警
}
```

- **普通提示**：仅作信息告知，不影响操作
- **阻断告警**：必须处理后才能进行后续操作，在页面顶部独立展示

### 多条件检索

统一的 `SearchDto` 支持组合查询：

```typescript
export class SearchDto {
  startDate?: string;
  endDate?: string;
  status?: string;
  ownerId?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}
```

前端提供通用 `SearchFilter` 组件，可复用在所有列表页面。

### 操作记录

所有关键操作自动记录日志，包含：
- 用户 ID 和角色
- 操作类型
- 模块
- 目标记录 ID
- 详细信息（JSON 格式）
- IP 地址
- 时间戳

## 部署建议

### 生产环境配置

1. **MongoDB**：使用副本集保证高可用
2. **Redis**：配置持久化和密码认证
3. **Nginx**：作为反向代理，配置 HTTPS
4. **PM2**：管理 Node.js 进程

### Docker 部署

可参考以下 Dockerfile 配置：

```dockerfile
# 后端 Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

## 许可证

MIT License
