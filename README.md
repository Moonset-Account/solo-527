# 合规清单台 - 数据合规风险看板

企业级数据合规风险看板，实现风险识别、评估、整改全流程闭环管理。

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **类型系统**: TypeScript
- **样式**: TailwindCSS
- **API 层**: tRPC 10
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: Clerk
- **状态管理**: React Query + Zustand
- **表单**: React Hook Form + Zod
- **UI 组件**: 自定义组件库 (基于 Radix UI)

## 功能模块

### 1. 检查清单管理 (业务部门)
- 业务部门填写合规检查清单
- 支持 6 大类别：数据隐私、数据安全、合同合规、监管合规、访问控制、数据留存
- 每个类别包含 5 个标准检查问题
- 支持草稿保存、提交审核、标记异常项

### 2. 风险闭环看板 (全流程)
- 风险列表入口，支持多维度筛选（状态、等级、部门）
- 风险等级评定：低、中、高、严重
- 状态流转：草稿 → 已提交 → 审核中 → 整改中 → 已闭环
- 到期提醒和逾期标识
- 风险评估：可能性 + 影响程度评分矩阵

### 3. 法务管理端
- **风险等级维护**: 法务可调整风险等级
- **整改建议**: 配置整改措施和完成期限
- **证据附件**: 上传和管理证据文件
- **复核意见**: 添加审查意见（通过/驳回/待处理）
- **责任部门**: 指定责任部门和负责人
- **到期提醒**: 设置整改截止日期

### 4. 合同版本管理
- 合同版本追踪，支持创建新版本
- 审查意见维护，支持多轮审查
- 与风险闭环关联，实现端到端合规管理

### 5. 公益律师端
- 权限越权提醒接收和处理
- 支持状态流转：待处理 → 已确认 → 调查中 → 已解决 → 已关闭
- 关闭结果自动回流到风险闭环看板
- 关联风险项自动标记为"已闭环"

## 角色权限

| 角色 | 权限 |
|------|------|
| **业务部门 (BUSINESS)** | 填写检查清单、查看提交记录、创建风险、上传证据 |
| **法务 (LEGAL)** | 风险评估、等级评定、整改建议、证据管理、复核意见、合同管理、发送越权提醒 |
| **公益律师 (PRO_BONO_LAWYER)** | 接收和处理越权提醒、更新处理状态、关闭提醒 |
| **管理员 (ADMIN)** | 全部权限、用户管理、角色分配 |

## 快速开始

### 1. 环境配置

复制环境变量模板并填写：

```bash
cp .env.example .env
```

需要配置的变量：

```env
# PostgreSQL 数据库连接
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/compliance-db?schema=public"

# Clerk 认证
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
CLERK_WEBHOOK_SECRET=your_webhook_secret

# 应用 URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. 数据库设置

```bash
# 安装依赖
npm install

# 生成 Prisma Client
npm run db:generate

# 推送数据库 schema
npm run db:push
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 生产构建

```bash
npm run build
npm start
```

## 项目结构

```
.
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 认证相关页面
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── alerts/                   # 越权提醒模块
│   │   ├── [id]/
│   │   ├── new/
│   │   └── page.tsx
│   ├── api/                      # API 路由
│   │   ├── trpc/[trpc]/route.ts
│   │   └── webhook/clerk/route.ts
│   ├── checklists/               # 检查清单模块
│   │   ├── [id]/
│   │   └── page.tsx
│   ├── contracts/                # 合同管理模块
│   │   ├── [id]/
│   │   ├── new/
│   │   └── page.tsx
│   ├── dashboard/                # 仪表板
│   │   └── page.tsx
│   ├── risks/                    # 风险看板模块
│   │   ├── [id]/
│   │   ├── new/
│   │   └── page.tsx
│   ├── settings/                 # 设置页面
│   ├── users/                    # 用户管理 (管理员)
│   ├── layout.tsx                # 根布局
│   └── page.tsx                  # 首页
├── components/
│   ├── layout/                   # 布局组件
│   │   ├── app-layout.tsx
│   │   ├── header.tsx
│   │   └── sidebar.tsx
│   ├── providers/                # Context Providers
│   │   └── trpc-provider.tsx
│   └── ui/                       # 基础 UI 组件
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── table.tsx
│       └── textarea.tsx
├── lib/                          # 工具库
│   ├── auth.ts                   # 认证工具
│   ├── constants.ts              # 常量配置
│   ├── prisma.ts                 # Prisma 客户端
│   ├── trpc.ts                   # tRPC 客户端
│   └── utils.ts                  # 通用工具函数
├── prisma/                       # Prisma schema
│   └── schema.prisma
├── server/                       # tRPC 服务端
│   ├── routers/
│   │   ├── _app.ts
│   │   ├── alert.ts
│   │   ├── checklist.ts
│   │   ├── contract.ts
│   │   ├── risk.ts
│   │   └── user.ts
│   └── trpc.ts                   # tRPC 配置和中间件
├── .env.example
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 数据模型

### 核心实体

1. **User** - 用户，关联 Clerk
2. **Checklist** - 检查清单
3. **ChecklistItem** - 检查项
4. **Risk** - 风险项
5. **RiskAssessment** - 风险评估记录
6. **Evidence** - 证据附件
7. **ReviewOpinion** - 复核意见
8. **RectificationPlan** - 整改计划
9. **Contract** - 合同
10. **ContractReview** - 合同审查意见
11. **Alert** - 越权提醒

### 状态流转

```
风险状态:
DRAFT (草稿) → SUBMITTED (已提交) → UNDER_REVIEW (审核中) → RECTIFICATION (整改中) → CLOSED (已闭环)
                                                         ↓
                                                    ESCALATED (已升级)

提醒状态:
OPEN (待处理) → ACKNOWLEDGED (已确认) → INVESTIGATING (调查中) → RESOLVED (已解决) → CLOSED (已关闭)

关闭提醒 → 自动更新关联风险为 CLOSED
```

## API 文档

tRPC 路由：

### checklist
- `checklist.list` - 获取清单列表
- `checklist.get` - 获取清单详情
- `checklist.create` - 创建清单
- `checklist.update` - 更新清单
- `checklist.updateItem` - 更新检查项
- `checklist.submit` - 提交审核
- `checklist.review` - 法务审核
- `checklist.stats` - 获取统计数据

### risk
- `risk.list` - 获取风险列表
- `risk.get` - 获取风险详情
- `risk.create` - 创建风险
- `risk.update` - 更新风险 (法务)
- `risk.updateStatus` - 更新状态
- `risk.addAssessment` - 添加风险评估
- `risk.addEvidence` - 上传证据
- `risk.addReviewOpinion` - 添加复核意见
- `risk.addRectificationPlan` - 添加整改计划
- `risk.stats` - 获取统计数据

### contract
- `contract.list` - 获取合同列表
- `contract.get` - 获取合同详情
- `contract.create` - 创建合同
- `contract.update` - 更新合同
- `contract.addReview` - 添加审查意见
- `contract.createNewVersion` - 创建新版本

### alert
- `alert.list` - 获取提醒列表
- `alert.get` - 获取提醒详情
- `alert.create` - 创建提醒 (法务)
- `alert.updateStatus` - 更新状态 (公益律师)
- `alert.assign` - 分配提醒
- `alert.stats` - 获取统计数据

### user
- `user.me` - 获取当前用户
- `user.list` - 获取用户列表 (管理员)
- `user.updateRole` - 更新角色 (管理员)
- `user.updateDepartment` - 更新部门
- `user.updateProfile` - 更新个人信息
- `user.getLegalUsers` - 获取法务用户列表
- `user.getProBonoLawyers` - 获取公益律师列表

## 部署

### Vercel

1. 连接 GitHub 仓库
2. 配置环境变量
3. 配置 PostgreSQL 数据库 (推荐 Supabase, Neon 等)
4. 配置 Clerk 应用和 Webhook

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 安全特性

- 基于 Clerk 的企业级身份认证
- 基于角色的访问控制 (RBAC)
- tRPC 过程级权限中间件
- SQL 注入防护 (Prisma ORM)
- XSS 防护 (React 默认转义)
- Webhook 签名验证 (Svix)

## 支持与反馈

- 项目地址: [GitHub Repository]
- 问题反馈: [Issues]

## License

MIT
