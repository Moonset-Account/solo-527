# 社团活动管理后台系统

一个功能完整的社团活动审核与管理后台，基于 Next.js + Supabase + PostgreSQL + Tailwind CSS 构建。

## 功能特性

### 核心业务流程
- **活动发布与报名管理**：社团负责人可以发布活动，设置名额限制，管理报名名单
- **签到管理**：支持二维码签到、手动签到，实时查看签到数据
- **活动参与提醒**：自动提醒功能，批量发送活动通知
- **消息提醒**：站内消息系统，支持多种消息类型和触达记录

### 关联业务模块
- **宿舍报修**：报修工单系统，可与活动关联，追踪处理人和处理时间
- **二手交易**：二手物品交易平台，支持与活动关联
- **身份审核**：学生认证、社团负责人认证、部门认证等多级身份审核

### 复盘与核对
- **活动复盘**：查看活动的完整生命周期，包括报名、签到、关联记录等
- **跨部门核对**：按部门维度统计和核对活动数据
- **责任追溯**：定位责任人和处理时间，查看最近处理记录
- **座位违约**：记录未到场、迟到等违约行为

### 系统管理
- **权限控制**：多级角色权限（管理员、部门负责人、社团负责人、普通成员）
- **数据导出**：支持 Excel/CSV/PDF 格式导出各类数据
- **审计日志**：完整的操作记录和审计追踪

## 技术栈

- **前端框架**：Next.js 14 (App Router)
- **UI 框架**：Tailwind CSS
- **类型系统**：TypeScript
- **后端服务**：Supabase (PostgreSQL + Auth + Storage)
- **图标库**：Lucide React
- **工具库**：date-fns, clsx, tailwind-merge
- **数据导出**：xlsx

## 项目结构

```
src/
├── app/                      # Next.js App Router 页面
│   ├── activities/           # 活动管理
│   ├── check-in/             # 签到管理
│   ├── dashboard/            # 仪表盘
│   ├── login/                # 登录页
│   ├── messages/             # 消息中心
│   ├── registrations/        # 报名管理
│   ├── repairs/              # 宿舍报修
│   ├── review/               # 复盘核对
│   ├── second-hand/          # 二手交易
│   ├── settings/             # 系统设置
│   ├── verifications/        # 身份审核
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 根布局
│   └── page.tsx              # 首页（重定向到仪表盘）
├── components/               # 组件
│   ├── layout/               # 布局组件
│   └── ui/                   # UI 基础组件
├── lib/                      # 工具库
│   ├── supabase/             # Supabase 客户端
│   ├── types/                # TypeScript 类型定义
│   └── utils.ts              # 工具函数
supabase/
└── schema.sql                # 数据库 Schema
```

## 数据库设计

### 核心表
- `user_profiles` - 用户资料表
- `clubs` - 社团表
- `activities` - 活动表
- `registrations` - 报名表
- `check_in_records` - 签到记录表
- `messages` - 消息表
- `repair_requests` - 报修请求表
- `second_hand_items` - 二手物品表
- `identity_verifications` - 身份认证表
- `seat_violations` - 座位违约表
- `audit_logs` - 审计日志表

### 关键特性
- 完整的 RLS (Row Level Security) 策略
- 所有表都关联到用户 ID
- 支持软删除和状态追踪
- 完整的索引优化

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local.example` 为 `.env.local` 并填入你的 Supabase 配置：

```bash
cp .env.local.example .env.local
```

### 3. 设置数据库

在 Supabase 控制台执行 `supabase/schema.sql` 中的 SQL 语句创建数据表和策略。

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 主要页面说明

| 页面 | 路径 | 说明 |
|------|------|------|
| 仪表盘 | `/dashboard` | 数据概览、快捷入口 |
| 活动管理 | `/activities` | 活动列表、创建、审核 |
| 活动详情 | `/activities/[id]` | 活动详情、报名名单、签到记录 |
| 报名管理 | `/registrations` | 所有报名记录管理 |
| 签到管理 | `/check-in` | 签到码、手动签到、签到统计 |
| 消息中心 | `/messages` | 系统消息、通知、提醒 |
| 宿舍报修 | `/repairs` | 报修工单、处理流程 |
| 二手交易 | `/second-hand` | 物品发布、交易管理 |
| 身份审核 | `/verifications` | 认证申请、审核流程 |
| 复盘核对 | `/review` | 活动复盘、跨部门核对 |
| 系统设置 | `/settings` | 个人设置、权限、导出 |

## 权限角色

- **超级管理员 (admin)**：系统所有功能
- **部门负责人 (department_head)**：本部门活动审核、数据查看
- **社团负责人 (club_leader)**：本社团活动发布、报名管理
- **普通成员 (member)**：活动报名、个人中心

## License

MIT
