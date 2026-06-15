# 周会事项提醒中心

将线下周会跟踪流程数字化的企业内部管理平台，覆盖待办派发、认领跟进、进度补充、催办提醒、责任归属统计与全流程审计追踪。

## ✨ 核心特性

### 前台工作台（普通用户）
- **我的待办卡片列表**：按状态分类的卡片式视图，高频字段显性化（进度条、截止倒计时、状态、优先级）
- **进度内联补充**：无需跳转新页面，点击"补充进度"卡片原地展开编辑（进度滑块 + 说明文字）
- **延期原因快速录入**：同卡片内展开延期原因表单，支持录入原因和预计完成日期
- **详情抽屉**：点击卡片滑出右侧抽屉，按 Tab 切换查看：
  - 🔀 流程节点时间轴（全节点流转记录）
  - 📝 进度补充历史
  - ⚠️ 延期原因说明
  - 🔔 催办记录
  - 📄 关联的会议纪要
- **待认领事项池**：快速认领未指定责任人的周会待办

### 后台管理（行政负责人 / 管理员）
- **事项管理**：派发新待办、批量催办、单条催办、变更责任人
- **催办提醒配置**：待催办清单自动过滤（逾期 + 临近截止），日程提醒规则配置（每日/每周/自定义）
- **统计中心**：
  - 总览 4 大核心指标（总待办/完成率/延期率/平均处理时长）
  - 责任归属明细表：按人员/部门维度的完成率、延期率排名
  - 状态趋势图：近 8 周折线图（进行中/已完成/已延期）
  - 记录导出：支持 CSV / Excel 格式，按日期+人员+状态筛选
- **日志审计**：全量操作记录，重点高亮**责任人变更**类操作，支持 diff 展示（oldValue → newValue）
- **用户管理**（仅系统管理员）：用户增删改查、角色变更（USER/ADMIN_LEAD/ADMIN）、启用禁用

### 权限体系
| 角色 | 说明 | 核心权限 |
|---|---|---|
| `USER` | 普通用户 | 认领待办、补充进度、录入延期原因、查看自己的事项 |
| `ADMIN_LEAD` | 行政负责人 | 派发待办、发送催办、变更责任人、统计查看、记录导出、日志查看 |
| `ADMIN` | 系统管理员 | 全部权限 + 用户管理（增删改 + 角色分配） |

### 审计追踪
所有涉及责任人变更的操作（派发/变更/催办）均写入 `TaskLog` 表：
- `oldValue` / `newValue` 字段 JSON 格式记录变更前后差异
- 记录操作人、IP 地址、User-Agent
- 日志仅 ADMIN/ADMIN_LEAD 可见，USER 仅看到自己的操作记录

## 🛠 技术栈

| 层级 | 技术 | 说明 |
|---|---|---|
| 前端 | **Next.js 14 (App Router)** + React 18 + TypeScript | SSR + CSR 混合，类型安全 |
| 样式 | **TailwindCSS 3** + shadcn 风格组件体系 | 深蓝主色 + 琥珀橙强调色，胶囊按钮，卡片布局 |
| 状态管理 | **TanStack Query (React Query)** + Zustand | 服务端状态缓存 + 轻量全局状态 |
| 表单校验 | **Zod** + 原生表单事件 | 服务端/客户端双重校验 |
| 后端 | **Next.js Route Handlers** | 文件系统 API，无需独立服务 |
| ORM | **Prisma 5** | 类型安全的数据库访问 |
| 数据库 | **PostgreSQL 16** | 关系型数据存储 |
| 缓存/会话 | **Redis 7 (ioredis)** | Session 存储（8h TTL + 自动续期）、提醒队列 |
| 认证 | **Session + Cookie** | HttpOnly/Secure/SameSite=Lax，密码 bcrypt 哈希 |
| 图表 | **Recharts** | 统计可视化 |
| 导出 | **json2csv** + **exceljs** | CSV/Excel 双格式 |
| 图标 | **lucide-react** | 统一线性图标 |

## 📁 项目结构

```
src/
├── app/
│   ├── (auth)/login/              # 登录页（路由组：未登录访问）
│   ├── (dashboard)/               # 路由组：需要登录访问
│   │   ├── layout.tsx             # 侧边栏 + 顶部栏 + 主内容
│   │   ├── dashboard/page.tsx     # 前台工作台（我的待办）
│   │   └── admin/                 # 后台管理
│   │       ├── page.tsx           #   管理首页
│   │       ├── tasks/             #   事项管理 + 新建
│   │       ├── reminders/         #   催办提醒配置
│   │       ├── statistics/        #   统计中心
│   │       ├── logs/              #   日志审计
│   │       └── users/             #   用户管理（仅ADMIN）
│   ├── api/                       # API 路由
│   │   ├── auth/route.ts + me/
│   │   ├── tasks/                 # 待办 CRUD + 动作端点
│   │   │   ├── [id]/claim
│   │   │   ├── [id]/progress
│   │   │   ├── [id]/delay
│   │   │   ├── [id]/reassign
│   │   │   ├── [id]/remind
│   │   │   └── export
│   │   ├── statistics/            # 统计 + 趋势
│   │   ├── logs/                  # 日志查询
│   │   └── users/                 # 用户管理
│   ├── globals.css                # Tailwind + 自定义组件类
│   ├── layout.tsx                 # 根 Layout (Providers)
│   └── page.tsx                   # 重定向
│
├── components/
│   ├── layout/                    # AppSidebar, Topbar
│   ├── providers/                 # QueryClient, Session, Toast
│   └── tasks/                     # TaskCard, TaskDetailDrawer, StatusTabs
│
├── server/
│   ├── lib/                       # prisma, redis, auth (session/hash)
│   └── services/                  # 业务逻辑层
│       ├── task.service.ts        #   待办核心服务
│       ├── user.service.ts        #   用户服务
│       ├── statistics.service.ts  #   统计 + 导出
│       └── log.service.ts         #   日志服务
│
├── lib/utils.ts                   # 通用工具 + 常量映射
├── types/index.ts                 # 共享类型定义
└── middleware.ts                  # 路由鉴权中间件

prisma/
├── schema.prisma                  # 数据模型定义
└── seed.ts                        # 演示数据植入脚本
```

## 🚀 快速开始

### 前置依赖
- Node.js ≥ 18
- PostgreSQL ≥ 14
- Redis ≥ 6

### 1. 安装依赖
```bash
pnpm install
```

### 2. 配置环境变量
复制 `.env.example` 为 `.env`，修改数据库连接：
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/weekly_meeting?schema=public"
REDIS_URL="redis://localhost:6379"
SESSION_SECRET="请替换为随机长字符串"
```

### 3. 初始化数据库
```bash
# 生成 Prisma Client
pnpm prisma:generate

# 执行数据库迁移
pnpm prisma:migrate --name init

# 植入演示数据
pnpm prisma:seed
```

### 4. 启动开发服务器
```bash
pnpm dev
# 访问 http://localhost:3000
```

## 🔐 演示账号

| 账号 | 密码 | 角色 | 说明 |
|---|---|---|---|
| `admin` | `admin123` | 系统管理员 | 全部权限 + 用户管理 |
| `lead` | `lead123` | 行政负责人 | 催办/统计/变更责任人 |
| `zhangsan` | `user123` | 普通用户 | 产品研发部 |
| `lisi` | `user123` | 普通用户 | 市场运营部（有延期事项） |
| `wangwu` | `user123` | 普通用户 | 人力资源部 |

## 🗄 核心数据模型

```
User ──< Task (creator / assignee)
       Task ──< TaskProgress (进度补充)
       Task ──< ProcessNode  (流程节点流转)
       Task ──< DelayReason  (延期原因)
       Task ──< Reminder     (催办记录)
       Task ──< TaskLog      (操作审计日志)
       Task >── MeetingMinutes (关联会议纪要)
```

索引设计覆盖高频查询：`(status)`、`(assigneeId, status)`、`(priority)`、`(dueDate)`、`(createdAt)`。

## 📝 用户体验设计要点

1. **减少跳转**：进度补充、延期录入均在**卡片内展开**，详情使用**右侧抽屉**而非新页面
2. **高频字段显性化**：进度条、截止倒计时、状态徽章、催办次数始终可见于卡片第一屏
3. **彩色视觉通道**：左侧色条标识优先级，状态徽章差异化配色，延期事项加琥珀色外环
4. **内联+抽屉双模式**：简单更新（进度/延期）在卡片内完成，深度查看（流程/纪要）用抽屉
5. **少弹窗**：除新建用户等破坏性操作外，尽量避免模态阻断交互

## 📄 License

内部项目，仅供企业内部使用。

