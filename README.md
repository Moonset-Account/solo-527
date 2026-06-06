# 商业摄影棚档期和器材租赁系统

基于 Next.js + Supabase 构建的摄影棚管理系统，支持棚位、灯光、相机和押金管理。

## 核心功能

### 1. 日历排期
- 月视图日历展示所有预约
- 点击日期/订单查看详情
- 颜色区分不同订单状态

### 2. 器材库存锁定
- 下单时自动锁定器材时段
- `check_equipment_availability()` 数据库函数检查可用性
- 未归还器材不能被下一单预约
- 状态：可用/使用中/维护/损坏/丢失

### 3. 订单管理流程
- 客户下单：选择套餐/棚位/时段/器材
- 店员确认订单和器材清单
- 拍摄助理登记领用和归还
- 拍摄当天临时加器材，自动重新计算押金

### 4. 押金流水
- 收取/退还/调整三种交易类型
- 每笔交易记录创建人、时间、备注
- 临时加器材自动生成押金收取记录

### 5. 损坏记录
- 关联订单和责任人
- 记录严重程度（轻微/中等/严重/报废）
- 维修费用和处理状态跟踪
- 支持照片上传

### 6. 合同附件
- 上传和查看合同文件
- 签署状态跟踪
- 客户只能查看自己订单的合同

### 7. 通知中心
- 站内通知 + 邮件/短信渠道
- 通知失败自动进入重试队列
- 最多 5 次重试，指数退避
- 管理后台可手动触发重试

### 8. 权限控制
- **客户**：只能查看自己的订单、合同、付款状态
- **店员**：可管理所有订单、器材、通知
- **管理员**：所有权限
- 器材采购价仅内部可见

## 快速开始

### 1. 配置 Supabase
```bash
cp .env.example .env.local
```
填写以下环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 2. 创建数据库表
在 Supabase SQL 编辑器中运行 `supabase/schema.sql`

### 3. 安装依赖并启动
```bash
npm install
npm run dev
```

## 项目结构

```
src/
├── app/
│   ├── admin/              # 管理后台
│   ├── calendar/           # 日历排期
│   ├── dashboard/          # 首页仪表盘
│   ├── equipment/          # 器材管理
│   ├── notifications/      # 通知中心
│   ├── orders/             # 订单管理
│   │   ├── [id]/           # 订单详情
│   │   └── new/            # 新建订单
│   ├── api/
│   │   └── notifications/
│   │       └── process/    # 通知队列处理 API
│   ├── layout.tsx          # 根布局
│   └── page.tsx            # 首页
├── components/             # UI 组件
│   ├── AuthForm.tsx        # 登录注册表单
│   ├── Calendar.tsx        # 日历组件
│   ├── Dashboard.tsx       # 仪表盘
│   ├── Navbar.tsx          # 导航栏
│   └── StatusBadge.tsx     # 状态标签
├── lib/
│   ├── auth.tsx            # 认证上下文
│   ├── notification-service.ts  # 通知服务
│   ├── order-service.ts    # 订单服务
│   ├── supabase/           # Supabase 客户端
│   └── utils.ts            # 工具函数
└── types/
    └── database.ts         # 数据库类型定义
```

## 数据库设计

### 核心表
- `profiles` - 用户资料（关联 auth.users）
- `studios` - 棚位
- `equipment` - 器材（含采购价字段，内部可见）
- `packages` - 套餐
- `orders` - 订单
- `order_equipment` - 订单器材关联（含领用/归还状态）
- `deposit_transactions` - 押金流水
- `damage_records` - 损坏记录
- `contracts` - 合同附件
- `notifications` - 通知
- `notification_queue` - 通知发送队列（重试机制）

### 关键数据库函数
- `check_equipment_availability()` - 检查器材时段可用性
- `check_studio_availability()` - 检查棚位时段可用性
- `generate_order_number()` - 自动生成订单号

## 关键业务规则

1. **器材归还校验**：未归还的器材在 overlapping 时段内不可被预约
2. **临时加器材**：拍摄当天添加器材自动更新订单金额和押金，并生成流水
3. **通知可靠性**：所有通知都进入队列，失败自动重试
4. **数据隔离**：客户只能访问自己的订单和相关数据
5. **价格保密**：器材采购价通过 RLS 策略仅员工可见

## 配置通知服务

编辑 `src/lib/notification-service.ts` 中的 `sendEmail` 和 `sendSms` 函数，集成实际的服务提供商：

- 邮件：Resend、SendGrid、阿里云邮件
- 短信：阿里云短信、腾讯云短信、Twilio

## API 路由

- `POST /api/notifications/process` - 手动触发通知队列处理

## 开发说明

- 使用 TypeScript 确保类型安全
- Tailwind CSS 构建界面
- Supabase RLS 实现行级权限控制
- Server Actions 处理服务端逻辑

## 部署

1. 在 Vercel 或其他平台部署 Next.js 应用
2. 配置环境变量
3. （可选）设置 cron job 定期调用 `/api/notifications/process` 处理失败通知
