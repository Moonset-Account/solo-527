# 亲子训练营社群打卡台

面向亲子教育培训机构的一站式社群运营管理系统，解决营期排期、打卡统计、掉队学员跟进、转化来源分析、交接班协作等痛点。

---

## ✨ 核心特性

| 模块 | 解决的问题 |
|------|----------|
| 📅 **营期管理** | 统一管理营期排期、课程资料、学员进度，无需在群公告/文档间切换 |
| ✅ **打卡台** | 按天统计打卡情况，日历可视化，自动识别补卡、缺卡 |
| 🏃 **掉队学员** | 系统自动识别连续缺卡学员，分配跟进任务，批量处理 |
| 📈 **转化统计** | 全渠道转化漏斗（线索→接触→试听→付费），支持多维筛选与历史追溯 |
| 🔄 **交接班视图** | 会员权益、打卡记录、待办、试看片段一页搞定，少跳转 |
| ⚠️ **课程过期联动** | 到期自动进入待办中心，影响订阅留存报表，不再只靠群提醒 |
| 📊 **留存报表** | 同期群（Cohort）分析、打卡趋势、到期预警、流失分析 |
| 📝 **操作日志** | 所有关键操作留痕，支持审计、排查、追溯 |
| ❌ **可读错误提示** | 接口异常时返回「原因 + 处理建议 + Trace ID」，方便一线继续跟进 |

---

## 🛠 技术栈

```
前端：
├── React 18 + TypeScript
├── Vite 5（构建工具）
├── Ant Design 5（UI 组件库）
├── React Router v6（路由）
├── Zustand（状态管理，替代 Redux，更轻）
├── Axios（请求封装，含全局错误处理）
└── ECharts（图表可视化）

后端：
├── Node.js + Express 4 + TypeScript
├── Prisma 5（ORM，数据模型/迁移/种子数据）
├── MySQL 8（数据库）
├── JWT（认证）+ bcryptjs（密码加密）
├── express-validator（参数校验）
└── morgan（请求日志）

架构特点：
├── RESTful API，统一响应格式 { code, message, data, suggestion, traceId }
├── 全局错误处理中间件，Prisma/JWT/业务错误统一映射为可读提示
├── 自动记录操作日志中间件（oldValue / newValue 追踪）
└── 前后端分离，Vite dev server 代理 /api 到后端
```

---

## 🚀 快速启动

### 1. 环境准备

```bash
# 必需
Node.js >= 18
MySQL >= 8.0
npm >= 9 或 pnpm >= 8
```

### 2. 安装依赖

```bash
# 一键安装根目录 + backend + frontend
npm run install:all
```

### 3. 配置数据库

```bash
# 1. 进入后端目录
cd backend

# 2. 复制环境变量
cp .env.example .env

# 3. 修改 .env 配置，填入你的 MySQL 连接信息
#    DATABASE_URL="mysql://用户名:密码@localhost:3306/training_camp?schema=public"
```

### 4. 初始化数据库

```bash
# 在 backend 目录下执行，或在根目录使用 npm run

# 生成 Prisma Client
npm run prisma:generate

# 创建数据库迁移（首次运行会自动创建 training_camp 数据库）
npm run prisma:migrate
# 会提示输入迁移名称，可填 init

# 填充演示数据（种子数据）
npm run prisma:seed
```

### 5. 启动开发服务器

```bash
# 回到项目根目录，一键同时启动前后端
cd ..
npm run dev

# 或单独启动
npm run dev:backend   # 后端：http://localhost:3001
npm run dev:frontend  # 前端：http://localhost:5173
```

### 6. 访问应用

打开浏览器访问 **http://localhost:5173**

---

## 👤 演示账号（种子数据）

| 账号 | 密码 | 角色 | 权限说明 |
|------|------|------|----------|
| `admin` | `123456` | **系统管理员** | 全部权限（含用户管理、操作日志） |
| `teacher1` | `123456` | **课程老师** | 营期/课程/打卡台/交接班查看 |
| `teacher2` | `123456` | **课程老师** | 同上，用于测试多人协作 |
| `operator1` | `123456` | **运营人员** | 会员/转化/待办/掉队/报表/交接班 |

> 首次登录建议使用 `admin` 体验完整功能

---

## 📁 项目结构

```
parent-child-training-camp/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # 数据模型定义（12张表）
│   │   └── seed.ts          # 种子数据
│   ├── src/
│   │   ├── config/          # 配置（JWT/环境变量）
│   │   ├── lib/             # 工具库（Prisma单例）
│   │   ├── middlewares/     # 中间件：认证/错误/校验/操作日志
│   │   ├── routes/          # 11 个 API 路由模块
│   │   ├── utils/           # 响应格式/自定义错误
│   │   ├── app.ts           # Express 应用配置
│   │   └── server.ts        # 服务器入口
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # 公共组件（路由守卫）
│   │   ├── layouts/         # 布局（主框架/菜单/顶栏）
│   │   ├── pages/           # 15个业务页面
│   │   ├── services/        # API 服务层
│   │   ├── store/           # Zustand 状态管理
│   │   ├── styles/          # 全局样式（状态组件设计）
│   │   ├── types/           # TypeScript 类型 + 标签映射
│   │   ├── utils/           # Axios 请求封装
│   │   ├── App.tsx          # 路由配置
│   │   └── main.tsx         # 入口
│   ├── vite.config.ts       # Vite 配置（代理 /api）
│   └── package.json
│
└── package.json             # 根目录脚本（concurrently 同时运行）
```

---

## 🗄️ 数据库模型（Prisma Schema）

| 模型 | 说明 | 关键字段 |
|------|------|----------|
| **User** | 后台用户 | role: ADMIN/TEACHER/OPERATOR |
| **Member** | 会员（家长） | level: TRIAL/BASIC/PREMIUM/VIP, isLagging 掉队标记 |
| **MemberBenefit** | 会员权益 | 次数、有效期、已使用 |
| **Camp** | 营期 | status: UPCOMING/ONGOING/COMPLETED, totalDays |
| **Course** | 课程资料 | type: VIDEO/AUDIO/PDF/LIVE/HOMEWORK, hasTrial 试看标记 |
| **MemberCamp** | 会员-营期关系 | 多对多，含完成进度 |
| **CheckIn** | 打卡记录 | status: PENDING/COMPLETED/LATE/MISSED，dayIndex 第几天 |
| **ConversionSource** | 转化来源 | channel: WECHAT_GROUP/REFERRAL/OFFLINE 等8种 |
| **ConversionLog** | 转化漏斗日志 | stage: LEAD→CONTACTED→TRIAL→CONVERTED |
| **FallingBehind** | 掉队学员追踪 | lagDays 缺卡天数，跟进状态 |
| **Todo** | 待办中心 | type: COURSE_EXPIRE/LAGGING_STUDENT/FOLLOW_UP/CUSTOM |
| **OperationLog** | 操作日志 | action 枚举 + oldValue/newValue + traceId |
| **SubscriptionRetention** | 留存报表 | 日统计数据 |

---

## 🎯 功能模块详解

### 1. 营期与课程
- 营期列表：状态筛选、进度条可视化、快速添加学员
- 营期详情：概览卡片 + 课程资料卡片网格 + 学员表格 + 试看预览抽屉
- 新建/编辑：Modal 弹窗形式，不跳转页面

### 2. 打卡台
- 营期选择器切换，顶部 4 个统计卡（总进度/今日/补卡/缺卡）
- 学员列表：连续打卡徽章、进度条、快速打卡按钮
- 打卡详情 Modal：完成率环形图 + 日历网格 + 单天打卡表单

### 3. 会员中心（交接班重点）
- **会员列表**：顶部统计 Tags + 多条件筛选（等级/来源/即将到期） + 预警 Popover
- **会员详情**（核心页面，少跳转设计）：
  - 顶部状态预警 Alert：过期/即将到期/掉队/连续中断 → 带快捷操作按钮
  - 左侧：基本信息；右侧：权益列表 + 未完成待办 + **试看片段卡片 Row**
  - 下方 4 个 Tabs：营期概览（进度+打卡色块） / 打卡日历 / 掉队跟进 Timeline / 操作历史
  - 所有编辑操作均为 Modal/Drawer，**无需离开页面**

### 4. 交接班视图
- 顶部 6 个统计卡 + 今日数据汇总
- 三栏布局：紧急待办 / 掉队学员 / 即将到期会员
- 点击会员卡片弹出**快速处理 Drawer**：同页展示权益、打卡、试看、待办、历史
- 一键建立跟进待办、一键查看完整档案

### 5. 待办中心
- 看板统计（待处理/处理中/已完成/已过期/今日到期/完成率）
- 多维筛选：状态/优先级/类型/指派人/是否我的/是否过期
- 表格行按优先级着色（紧急红→高橙→中蓝→低灰）
- 详情 Drawer：关联会员一键跳转

### 6. 掉队学员管理
- 自动检测：`batchMissed` 接口扫描缺卡日，按连续天数分级
- 批量操作：勾选学员批量跟进、批量建待办
- 跟进状态流转：待处理 → 跟进中 → 已联系 → 已恢复
- 详情页：学员信息 + 待办列表 + 备注记录

### 7. 转化来源统计
- 漏斗图：线索 → 接触 → 试听 → 付费 各阶段转化率
- 来源明细表：按来源统计线索数/转化数/转化率
- 转化日志：按来源/渠道/阶段/关键词/时间多维筛选，可追溯

### 8. 订阅留存报表
- 30/60/90 天周期切换
- 6 个核心指标（累计订阅/新增/活跃/即将到期/已过期/续费率）
- 留存率看板：D1/D3/D7/D14/D30 各自百分比+进度条+健康基准说明
- 打卡趋势柱状图（每日/补卡/缺卡 分层）
- 未来 30 天到期计划 + 预计续费/流失预测
- 同期群（Cohort）分析表 + 每日留存明细 + 营期维度对比

### 9. 用户管理（仅管理员）
- 角色权限：管理员 / 课程老师 / 运营人员
- 账号状态：启用/停用开关
- 用户详情：信息 + 近期操作日志

### 10. 操作日志（仅管理员）
- 表格视图 + 时间线视图双模式切换
- 按操作类型/对象类型/操作人/关联会员/时间范围筛选
- 操作分布快速筛选卡
- 详情 Drawer：变更前后对比（oldValue/newValue）+ 扩展信息 JSON + Trace ID

---

## ⚠️ 错误处理机制（核心需求）

### 统一响应格式

```json
{
  "code": 404,
  "message": "该会员不存在或已被删除",
  "data": null,
  "suggestion": "请检查会员ID是否正确，或返回列表刷新后重试",
  "traceId": "REQ-20240115-143052-abc123"
}
```

### 常见错误码与处理建议

| 错误码 | 提示 | 自动处理建议 |
|--------|------|------------|
| 400 参数错误 | 「提交信息不完整」 + 具体字段 | 高亮错误字段，检查必填项 |
| 401 未登录 | 登录状态已过期 | 自动跳转登录页，提示重新登录 |
| 403 无权限 | 当前角色无此操作权限 | 联系管理员开通，或切换账号 |
| 404 不存在 | 对象不存在或已删除 | 刷新页面，检查 ID 是否正确 |
| 409 冲突 | 名称已重复 | 修改名称后重试，或检查是否误删 |
| 422 校验失败 | 业务规则不满足 | 按提示调整，如「该手机号已注册」 |
| 500 服务器异常 | 系统内部错误 | 记录 Trace ID 联系技术支持，稍后重试 |
| 503 服务不可用 | 数据库连接超时 | 请稍后重试或检查网络 |

### 前端展示

- `request.ts` 拦截器统一拼接 `message + suggestion`，以 Ant Design `message.error` 展示
- 重要操作错误显示带 `suggestion-box` CSS 样式的 Alert 框，包含原因+建议+Trace ID
- Trace ID 可复制供技术人员排查

---

## 🔄 业务联动（自动触发）

### 课程过期 → 待办 + 报表
```
会员状态变为 EXPIRED
    ↓
自动创建 Todo（type=COURSE_EXPIRE，priority=HIGH）
    ↓
记录到 SubscriptionRetention.expiredToTodo 字段
    ↓
待办中心看板统计 / 留存报表过期→待办列 / 交接班提醒 三处同步更新
```

### 连续缺卡 → 掉队学员 + 可选待办
```
调用 batchMissed 接口（建议每日定时）
    ↓
检查 MemberCamp，计算连续 MISSED 天数
    ↓
>= 3 天：创建 FallingBehind 记录 + Member.isLagging = true
    ↓
可选：自动创建 LAGGING_STUDENT 类型待办
    ↓
掉队学员管理 / 交接班 / 待办中心 三处同步
```

### 操作 → 自动日志
```
路由中使用 operationLogger 中间件
    ↓
自动记录：操作人、操作类型、对象类型/ID/名称
    ↓
UPDATE 操作自动记录 oldValue 和 newValue（JSON）
    ↓
生成唯一 traceId，返回给前端用于错误追踪
```

---

## 🧪 常用命令速查

| 命令 | 说明 |
|------|------|
| `npm run install:all` | 安装根目录+前后端所有依赖 |
| `npm run dev` | 同时启动前后端开发服务器 |
| `npm run prisma:migrate` | 创建并执行数据库迁移（Schema 变更后用） |
| `npm run prisma:seed` | 重新填充种子数据（会清空现有数据） |
| `npm run build:frontend` | 构建前端生产版本 |
| `npm run build:backend` | 编译后端 TypeScript |

---

## 📌 上线前注意事项

1. **修改 JWT_SECRET**：生产环境务必使用强随机字符串
2. **修改默认密码**：种子数据的演示账号请重置密码或删除
3. **配置 HTTPS**：生产环境使用 Nginx 反向代理，启用 HTTPS
4. **定时任务**：建议用 `node-cron` 或外部服务：
   - 每日 01:00 调用 `POST /api/checkins/batch-missed` 检测掉队
   - 每日 02:00 调用订阅留存统计任务
5. **数据库备份**：生产环境定期备份 MySQL
6. **错误监控**：建议接入 Sentry，利用 traceId 全链路追踪

---

## 🤝 常见问题

**Q: 启动后端报错 `PrismaClientInitializationError: Can't reach database server`**
A: 检查 MySQL 是否启动、用户名密码是否正确、数据库 `training_camp` 是否已创建（首次 migrate 会自动创建）

**Q: 登录后跳转白屏**
A: 按 F12 打开控制台，查看 Network 面板 `/api/auth/me` 请求返回。若 401 则检查 JWT_SECRET 是否前后端一致。

**Q: 种子数据执行失败**
A: 先执行 `prisma migrate reset` 重置数据库（⚠️ 会清空数据），再 `prisma db seed`

**Q: 打卡台数据为空**
A: 先在「营期列表」选择营期 → 添加学员 → 再到「打卡台」操作

---

## 📄 License

内部项目，团队内部使用
