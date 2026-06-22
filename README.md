# 服务器告警变更审批系统

基于 Nuxt 3 + Nitro + Prisma + MySQL + Redis 构建的服务器告警变更审批管理系统。

## 功能特性

### 告警管理
- 告警上报、确认、处理状态跟踪
- 告警级别：INFO / WARNING / ERROR / CRITICAL
- 告警状态：待处理、已确认、处理中、变更中、回滚中、已完成、异常结束
- 告警筛选（状态、级别、关键字、日期范围）
- 告警数据导出 CSV

### 变更审批流
- 门店运维提交变更申请（含变更方案、回滚方案）
- 管理员审批（批准/驳回）
- 变更窗口管理（开启/关闭）
- 回滚执行
- **异常结束单独状态**，必须填写异常原因

### 操作日志
- 记录告警确认、状态变更、审批操作、窗口开关、回滚等所有关键动作
- **记录前后变化数据**（beforeData / afterData）
- 包含账号申请、设备巡检的操作记录
- 告警未恢复的所有动作全部留痕
- 日志支持按类型、日期筛选和 CSV 导出

### 通知提醒
- 实时站内通知（新告警、审批结果、异常结束等）
- 未读数量角标提醒
- Redis Pub/Sub 消息推送

### 权限管理
- **ADMIN（管理员）**：审批变更、开启变更窗口、标记异常、查看所有日志和用户
- **STORE_OPERATOR（门店运维）**：上报告警、确认告警、提交变更申请、查看本店数据

## 技术栈

- **前端**: Nuxt 3 + Vue 3 + TypeScript
- **服务端**: Nitro (Nuxt 内置)
- **ORM**: Prisma
- **数据库**: MySQL
- **缓存/消息**: Redis
- **认证**: JWT + HttpOnly Cookie
- **密码加密**: bcryptjs

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改：

```bash
cp .env.example .env
```

```env
DATABASE_URL="mysql://user:password@localhost:3306/alert_approval"
REDIS_HOST="127.0.0.1"
REDIS_PORT="6379"
REDIS_PASSWORD=""
JWT_SECRET="your-secret-key"
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 执行数据库迁移
npm run prisma:migrate

# 插入初始测试数据
npm run seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 测试账号

| 用户名 | 密码 | 角色 | 门店 |
|--------|------|------|------|
| admin | 123456 | 管理员 | - |
| operator01 | 123456 | 门店运维 | SH001 |
| operator02 | 123456 | 门店运维 | SH002 |

## 项目结构

```
├── server/
│   ├── api/                    # Nitro API 路由
│   │   ├── auth/               # 认证接口
│   │   ├── alerts/             # 告警接口
│   │   ├── changes/            # 变更审批接口
│   │   ├── logs/               # 操作日志接口
│   │   ├── notifications/      # 通知接口
│   │   ├── accounts/           # 账号申请接口
│   │   ├── devices/            # 设备巡检接口
│   │   └── users/              # 用户管理接口
│   ├── plugins/                # Nitro 插件 (Prisma, Redis)
│   └── utils/                  # 工具函数 (auth, logger, notification)
├── pages/                      # Nuxt 页面
│   ├── login.vue               # 登录页
│   ├── index.vue               # 告警中心首页
│   ├── alerts/[id].vue         # 告警详情
│   ├── changes/                # 变更管理
│   │   ├── index.vue
│   │   └── [id].vue
│   └── admin/                  # 管理后台
│       ├── index.vue
│       ├── approvals.vue       # 审批管理
│       ├── users.vue           # 用户管理
│       └── logs.vue            # 操作日志
├── composables/                # 组合式函数
│   ├── useAuth.ts
│   ├── useAlert.ts
│   ├── useChange.ts
│   └── useNotification.ts
├── layouts/
│   └── default.vue             # 主布局（含导航、通知）
├── middleware/
│   └── auth.global.ts          # 全局认证中间件
├── prisma/
│   ├── schema.prisma           # 数据模型
│   └── seed.mjs                # 初始数据
└── assets/css/main.css         # 全局样式
```

## 核心业务流程

### 告警闭环流程

```
告警上报(PENDING) → 确认(ACKNOWLEDGED) → 处理中(IN_PROGRESS)
     ↓                                    ↓
     └──→ 发起变更申请 → 审批 → 开启窗口(CHANGING) → 执行 → 完成
                                                      ↓
                                            需要时执行回滚(ROLLING_BACK)
                                                      ↓
                                         完成(COMPLETED) / 异常结束(ABNORMAL_ENDED)
```

### 变更审批流程

```
提交申请(PENDING) → 管理员批准(APPROVED) → 开启窗口(IMPLEMENTING)
          ↓                                              ↓
        驳回(REJECTED)                              关闭窗口/完成(COMPLETED)
                                                         ↓
                                                  需要时执行回滚(ROLLED_BACK)
                                                         ↓
                                            异常结束(ABNORMAL_ENDED, 需填写原因)
```

## 关键设计说明

### 异常结束 vs 正常完成
- 正常完成：`COMPLETED` 状态，表示告警/变更按预期解决
- **异常结束：`ABNORMAL_ENDED` 状态，必须提供 `abnormalReason` 原因字段**
- 两者在状态机中是互斥的终态，不可相互转换

### 操作日志的前后变化
所有关键状态变更均记录：
- `beforeData`: 变更前的数据快照
- `afterData`: 变更后的数据快照
- `diffChanges()` 工具函数自动提取差异字段

### 权限数据隔离
- 门店运维（STORE_OPERATOR）只能看到自己门店（storeCode）的告警
- 管理员（ADMIN）可查看全部数据
