# 匠心手作 - 手作课程报名和作品展示平台

基于 Vue 3 + Rails 8 的手作工作室管理系统，支持陶艺、银饰、皮具等课程的报名、作品展示、库存管理等功能。

## 功能特性

### 用户端
- 🏠 首页展示（热门课程、学员作品、分类导航）
- 📚 课程浏览（分类筛选、搜索、排期选择）
- 🎨 作品画廊（公开作品展示、详情查看）
- 👤 个人中心（我的报名、我的作品、账户设置）
- 📝 课程报名（选择排期、创建订单、付款流程）
- 📸 作品上传（学员上传作品、申请公开展示）

### 管理后台
- 📊 运营看板（数据概览、趋势图表、资源利用率）
- 📚 课程管理（课程CRUD、排期管理）
- 📝 报名管理（订单查询、状态流转、退款处理）
- 📦 材料管理（库存管理、补货、预警）
- 🎨 作品审核（审核通过/拒绝、授权管理）
- 👨‍🏫 老师管理
- 👥 学员管理
- 📋 审计日志（操作追溯、变更记录、筛选导出）

### 核心业务规则
- 材料包售罄时不能继续报名
- 作品公开展示需学员授权
- 所有操作可追溯到具体人和时间
- 报名支持状态流转（待付款→已付款→已完成/退款）

## 技术栈

### 后端
- **框架**: Ruby on Rails 8 (API模式)
- **数据库**: PostgreSQL
- **缓存/队列**: Redis + Sidekiq
- **认证**: Devise Token Auth
- **授权**: Pundit (基于角色的权限控制)
- **审计**: Audited (操作日志)
- **分页**: Kaminari

### 前端
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI组件**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **图表**: ECharts
- **样式**: TailwindCSS
- **HTTP客户端**: Axios

### 设计风格
- **主题**: 温暖文艺·匠心质感
- **主色调**: 赤陶色 (#D2694D)
- **辅助色**: 深木色 (#5C4033)、橄榄绿 (#6B705C)
- **背景色**: 米白色 (#F5F0E8)

## 项目结构

```
.
├── backend/                 # Rails API 后端
│   ├── app/
│   │   ├── controllers/     # API控制器
│   │   ├── models/          # 数据模型
│   │   ├── policies/        # Pundit 授权策略
│   │   ├── jobs/            # 后台任务
│   │   └── serializers/     # 序列化器
│   ├── config/
│   │   ├── routes.rb        # API路由
│   │   └── schedule.rb      # 定时任务配置
│   ├── db/
│   │   ├── migrate/         # 数据库迁移
│   │   └── seeds.rb         # 种子数据
│   └── Gemfile
│
└── frontend/                # Vue 3 前端
    ├── src/
    │   ├── views/           # 页面组件
    │   │   ├── admin/       # 管理后台页面
    │   │   └── profile/     # 个人中心页面
    │   ├── components/      # 通用组件
    │   ├── layouts/         # 布局组件
    │   ├── api/             # API封装
    │   ├── stores/          # Pinia状态
    │   ├── router/          # 路由配置
    │   ├── types/           # TypeScript类型
    │   └── utils/           # 工具函数
    └── package.json
```

## 快速开始

### 环境要求
- Ruby 3.2+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### 后端启动

```bash
cd backend

# 安装依赖
bundle install

# 配置数据库
# 修改 config/database.yml 中的数据库连接信息

# 创建数据库并执行迁移
rails db:create
rails db:migrate

# 加载种子数据
rails db:seed

# 启动服务 (端口 3001)
rails s -p 3001

# 启动 Sidekiq (处理后台任务)
sidekiq
```

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器 (端口 5173)
npm run dev
```

### 测试账号

种子数据中已创建以下测试账号：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 超级管理员 | super_admin@example.com | password123 |
| 管理员 | admin@example.com | password123 |
| 老师 | teacher1@example.com | password123 |
| 学员 | student1@example.com | password123 |

### 定时任务

使用 whenever gem 配置定时任务：

```bash
# 生成 crontab
whenever --update-crontab

# 查看当前 crontab
crontab -l
```

定时任务包括：
- 每天 9:00 - 发送课程开始提醒
- 每天 20:00 - 发送库存预警通知
- 每小时 - 清理超时未付款订单
- 每周一 10:00 - 发送周运营报告

## 数据模型

### 核心实体
- **User** - 用户（管理员/老师/学员）
- **Teacher** - 老师资料
- **Course** - 课程
- **Schedule** - 课程排期
- **MaterialKit** - 材料包（库存管理）
- **Enrollment** - 报名订单
- **Work** - 学员作品
- **Review** - 课程评价
- **AuditLog** - 审计日志

### 状态流转

**报名状态**:
```
pending (待付款) → paid (已付款) → completed (已完成)
    ↓                ↓
cancelled (已取消)  refund_requested (退款申请中) → refunded (已退款)
```

**作品审核状态**:
```
pending (待审核) → approved (已通过)
                      ↓
                 rejected (已拒绝)
```

## API 接口

### 认证
- `POST /api/v1/auth` - 注册
- `POST /api/v1/auth/sign_in` - 登录
- `DELETE /api/v1/auth/sign_out` - 登出

### 课程
- `GET /api/v1/courses` - 课程列表
- `GET /api/v1/courses/:id` - 课程详情
- `GET /api/v1/courses/:id/schedules` - 课程排期

### 报名
- `GET /api/v1/enrollments` - 报名列表
- `POST /api/v1/enrollments` - 创建报名
- `GET /api/v1/enrollments/my` - 我的报名
- `PATCH /api/v1/enrollments/:id/pay` - 付款
- `PATCH /api/v1/enrollments/:id/request_refund` - 申请退款

### 作品
- `GET /api/v1/works` - 作品列表（公开）
- `GET /api/v1/works/my` - 我的作品
- `POST /api/v1/works` - 上传作品
- `PATCH /api/v1/works/:id/approve` - 审核通过
- `PATCH /api/v1/works/:id/reject` - 审核拒绝

### 看板
- `GET /api/v1/dashboard/overview` - 看板概览数据
- `GET /api/v1/dashboard/enrollment_trends` - 报名趋势
- `GET /api/v1/dashboard/resource_utilization` - 资源利用率

### 审计日志
- `GET /api/v1/audit_logs` - 审计日志列表

## 验收要点

### 新增功能验证
1. 课程新增：在管理后台创建新课程，验证材料包关联和排期设置
2. 报名新增：学员端选择课程和排期，验证库存检查和订单创建
3. 作品新增：学员上传作品，申请公开展示

### 退回功能验证
1. 报名退款：申请退款 → 管理员批准，验证状态流转
2. 作品拒绝：审核作品时选择拒绝，验证退回原因记录
3. 订单取消：待付款订单超时自动取消

### 审计记录验证
1. 操作追溯：所有变更操作在审计日志中可查
2. 变更详情：记录修改前后的字段值对比
3. 操作人信息：记录操作人、IP、时间

## 开发约定

### 后端
- 控制器使用 Pundit 进行权限控制
- 所有模型包含 audited 配置
- 使用 State Machine 管理状态流转
- API 响应使用统一格式

### 前端
- 页面组件按路由结构组织
- API 调用统一封装在 `src/api/` 目录
- 使用 TypeScript 类型定义
- 移动端优先的响应式设计

## License

MIT
