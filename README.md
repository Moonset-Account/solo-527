# 社区共享工具借还系统

一个功能完整的社区工具共享管理系统，支持移动端使用和管理后台。

## 技术栈

- **前端**: Vue 3 + Vite + Pinia + Vant (移动端) + Element Plus (后台)
- **后端**: Node.js + Express + Sequelize + SQLite
- **认证**: JWT
- **定时任务**: node-cron

## 功能特性

### 移动端 (居民/志愿者)
- 🔐 用户登录/注册、实名认证
- 🔍 工具浏览、分类筛选
- 📷 扫码借还
- 📅 在线预约借用
- 📸 拍照上传归还凭证
- 📴 离线操作、联网后自动同步
- 🔔 逾期提醒、归还通知
- 🛠️ 损坏申报
- 💰 押金管理

### 管理后台 (志愿者/管理员)
- 📊 数据概览仪表盘
- ✅ 借用申请审核
- 📦 工具库存管理
- 📅 预约日历视图
- ⏰ 逾期管理
- 🔧 维修管理
- 👥 用户认证管理
- 📝 审计日志

### 核心规则
- ❌ 同一件工具不能重复预约（时间冲突自动校验）
- ⚠️ 贵重工具需管理员审核
- 🔒 按角色隐藏敏感字段
- ⏰ 自动逾期检测和提醒

## 快速开始

### 1. 安装依赖
```bash
npm run install:all
```

### 2. 初始化数据库（种子数据）
```bash
npm run seed
```

### 3. 启动开发服务器
```bash
npm run dev
```

- 前端: http://localhost:5173
- 后端API: http://localhost:3001

### 4. 运行端到端测试
```bash
npm run test:e2e
```

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 志愿者 | volunteer | volunteer123 |
| 居民 | resident1 | resident123 |
| 居民 | resident2 | resident123 |

## 项目结构

```
.
├── client/                 # 前端项目
│   ├── src/
│   │   ├── api/           # API接口
│   │   ├── views/
│   │   │   ├── mobile/    # 移动端页面
│   │   │   └── admin/     # 管理后台页面
│   │   ├── store/         # Pinia状态管理
│   │   ├── router/        # 路由配置
│   │   └── utils/         # 工具函数
│   └── package.json
├── server/                 # 后端项目
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # 路由
│   │   ├── middleware/    # 中间件
│   │   ├── jobs/          # 定时任务
│   │   └── seeders/       # 种子数据
│   └── package.json
└── tests/                  # 端到端测试
```

## 生产部署

1. 复制环境变量配置
```bash
cp server/.env.example server/.env
```

2. 修改配置（特别是JWT_SECRET）
3. 构建前端
```bash
npm run build
```
4. 启动服务
```bash
npm start
```
