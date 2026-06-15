# 事项闭环台（周会事项复盘库）

面向行政负责人日常事务管理的全流程闭环平台，解决周会事项从创建、认领、推进到复盘结论归档的完整链路。

## 技术栈

- **前端**: Vue 3 + Vite + TypeScript + Pinia + Vue Router + Tailwind CSS
- **后端**: NestJS + TypeScript + Mongoose + JWT + Redis
- **数据库**: MongoDB
- **缓存**: Redis
- **部署**: Docker + Nginx

## 功能特性

### 核心模块
1. **首页** - 待办看板、异常明细、快捷操作
2. **事项管理** - 事项列表、详情、进度时间线
3. **运营后台** - 复盘结论整理、责任归属统计、逾期率统计
4. **配置管理** - 系统开关、复盘模板、部门管理、附件版本、变更记录
5. **用户管理** - 账号管理、角色分配

### 权限控制
- **项目经理(PM)**: 认领待办、补充进度、查看复盘结论
- **管理员**: 全部权限 + 用户管理 + 配置管理

### 特色功能
- 📊 事项全流程状态追踪
- ⏰ 自动逾期检测和预警
- 📝 操作日志完整留痕
- 📈 多维度统计分析
- 🔄 附件版本管理
- 🎯 责任归属清晰可追溯

## 快速开始

### 方式一：Docker 一键启动
```bash
docker-compose up -d
```
访问: http://localhost:8080

### 方式二：本地开发
```bash
# 安装依赖
npm install
cd server && npm install

# 启动数据库（需要 Docker）
docker-compose up -d mongodb redis

# 启动后端
cd server && npm run start:dev

# 启动前端（新终端）
npm run dev
```

访问: http://localhost:5173

### 默认账号
- 管理员: `admin` / `admin123`

## 项目结构

```
.
├── src/                    # 前端源码
│   ├── components/         # 通用组件
│   ├── layouts/            # 布局组件
│   ├── pages/              # 页面组件
│   ├── stores/             # Pinia 状态管理
│   ├── lib/                # API 服务层
│   ├── types/              # TypeScript 类型定义
│   └── router/             # 路由配置
├── server/                 # 后端源码
│   ├── src/
│   │   ├── modules/        # NestJS 模块
│   │   ├── schemas/        # Mongoose 数据模型
│   │   ├── common/         # 通用装饰器、守卫、类型
│   │   └── main.ts         # 入口文件
│   └── package.json
├── docker-compose.yml      # Docker 编排
└── README.md
```

## API 接口

### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/refresh` - 刷新 Token
- `GET /api/auth/profile` - 获取用户信息

### 事项
- `GET /api/items` - 获取事项列表
- `GET /api/items/:id` - 获取事项详情
- `POST /api/items` - 创建事项
- `PATCH /api/items/:id` - 更新事项
- `POST /api/items/:id/claim` - 认领事项
- `POST /api/items/:id/progress` - 补充进度

### 复盘
- `GET /api/reviews` - 获取复盘列表
- `POST /api/reviews` - 创建复盘
- `PATCH /api/reviews/:id` - 更新复盘
- `GET /api/reviews/statistics` - 获取统计数据

### 配置
- `GET /api/configs` - 获取配置
- `PATCH /api/configs/switches` - 更新开关
- `GET /api/configs/departments` - 获取部门
- `POST /api/configs/departments` - 创建部门
- `GET /api/configs/changelog` - 获取变更记录

### 用户管理
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PATCH /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户

## 设计规范

- **主色调**: 深靛蓝 `#1E3A5F`
- **强调色**: 琥珀色 `#F59E0B`
- **成功色**: 绿色 `#10B981`
- **警告色**: 红色 `#EF4444`
- **圆角**: 8px
- **字体**: 思源黑体
