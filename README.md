# 📚 亲子训练营会员学习站 · 运营管理系统

> 基于 React + TanStack Router + Hono + PostgreSQL + Drizzle 的全栈训练营运营管理工具

## ✨ 功能特性

### 🏕️ 训练营运营
- **营期管理**：快速创建、编辑营期，查看营期状态、学员人数、售价
- **章节管理**：维护课程章节，支持设置试看片段、排序、发布状态
- **资料管理**：营期公共资料 + 章节配套资料，支持多种类型文件
- **营期详情页**：一站式查看章节安排、学员名单、打卡记录、报名进度

### 👥 会员管理
- **会员列表**：支持按时间、状态、转化来源、销售、掉队状态等多维度过滤
- **会员详情**：完整学习进度追踪，章节学习明细
- **掉队预警**：自动检测学习掉队学员（进度落后预期>20%），生成待办提醒

### ✅ 打卡管理
- **打卡审核**：审核学员打卡内容，通过/拒绝并填写审核意见
- **过滤条件**：时间范围、状态、处理人、营期、关键词搜索
- **审核记录完整可追溯**

### 💰 退款管理
- **退款规则配置**：按营期配置多档退款规则（天数+退款比例）
- **退款申请处理**：同意/拒绝/完成，自动更新会员状态
- **状态流转清晰**：待处理→已同意/已拒绝→已完成

### 🎁 会员权益
- **权益发放**：折扣券、赠品、服务、其他类型
- **使用追踪**：标记使用状态，查看过期时间
- **权益价值统计**：总发放价值一目了然

### 📋 待办事项系统
- **自动生成**：学员掉队自动生成高优先级待办
- **手动创建**：打卡审核、退款审核、自定义任务
- **逾期提醒**：自动高亮逾期待办，看板一目了然
- **状态管理**：待处理→处理中→已完成/已取消

### 📊 数据报表
- **完课率报表**：营期完课率趋势图、各营对比柱状图
- **掉队学员直接影响完课率**：真实反映教学效果
- **打卡统计**：打卡趋势、状态分布、审核人效率
- **转化来源分析**：饼图+表格，TOP销售排名

### 📥 数据导出（CSV）
**支持 6 大类导出，全部支持多条件过滤：**

| 导出类型 | 核心过滤条件 |
|---------|------------|
| 会员明细 | 时间、状态、转化来源、销售、营期、是否掉队 |
| 转化来源明细 | 时间、营期、转化来源（按来源细分） |
| 打卡记录明细 | 时间、状态、处理人、营期 |
| 退款明细 | 时间、状态、处理人、营期 |
| 权益明细 | 时间、类型、使用状态 |
| 待办事项明细 | 时间、状态、优先级、处理人、营期、类型 |

---

## 🛠️ 技术栈

### 后端
- **框架**：[Hono](https://hono.dev/) - 轻量高性能 Web 框架
- **数据库**：PostgreSQL 16
- **ORM**：[Drizzle ORM](https://orm.drizzle.team/) - 类型安全、SQL-like
- **验证**：Zod + @hono/zod-validator
- **导出**：json2csv

### 前端
- **框架**：React 18 + TypeScript
- **路由**：[TanStack Router](https://tanstack.com/router) - 类型安全路由
- **状态管理**：[TanStack Query](https://tanstack.com/query) - 服务端状态
- **UI 组件**：Ant Design 5
- **图表**：Apache ECharts + echarts-for-react

### 项目结构
```
work-0207/
├── apps/
│   ├── api/                      # Hono 后端服务
│   │   ├── src/
│   │   │   ├── db/               # 数据库相关
│   │   │   │   ├── schema.ts     # Drizzle Schema（14张表）
│   │   │   │   ├── index.ts      # DB 连接
│   │   │   │   └── seed.ts       # 初始化种子数据
│   │   │   ├── routes/           # API 路由
│   │   │   │   ├── camps.ts      # 营期 API
│   │   │   │   ├── chapters.ts   # 章节 API
│   │   │   │   ├── members.ts    # 会员 API（含掉队检测）
│   │   │   │   ├── checkins.ts   # 打卡 API
│   │   │   │   ├── refunds.ts    # 退款 API
│   │   │   │   ├── benefits.ts   # 权益 API
│   │   │   │   ├── todos.ts      # 待办 API
│   │   │   │   ├── stats.ts      # 统计报表 API
│   │   │   │   ├── export.ts     # 导出 API（6种导出）
│   │   │   │   └── users.ts      # 用户 API
│   │   │   ├── lib/utils.ts      # 工具函数
│   │   │   └── index.ts          # Hono 入口
│   │   └── drizzle.config.ts     # Drizzle 配置
│   │
│   └── web/                      # React 前端
│       └── src/
│           ├── components/layout/  # 布局组件
│           ├── pages/              # 页面组件（12个页面）
│           ├── services/api.ts     # API 服务层
│           ├── lib/constants.ts    # 常量、工具函数
│           └── routes.ts           # TanStack Router 配置
│
├── packages/shared/              # 共享类型定义
│   └── src/index.ts
│
├── docker-compose.yml            # PostgreSQL 启动
├── package.json                  # Monorepo 配置
└── .env.example                  # 环境变量示例
```

---

## 🚀 快速开始

### 1. 启动数据库（Docker）
```bash
docker-compose up -d
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 检查并修改 .env 中的 DATABASE_URL
```

### 3. 安装依赖
```bash
npm install
```

### 4. 生成并执行数据库迁移
```bash
npm run db:generate   # 生成迁移文件
npm run db:migrate    # 执行迁移
```

### 5. 初始化测试数据（强烈推荐）
```bash
npm run db:seed
```

> ✅ 种子数据包含：3个营期、9个章节、5个学员、10条打卡记录、2笔退款申请、4项权益、5条待办事项，以及完整的用户体系。

### 6. 启动开发服务（前端+后端）
```bash
npm run dev
```

- 🌐 前端：http://localhost:5173
- 🔌 后端 API：http://localhost:3001
- 🗄️ Drizzle Studio：`npm run db:studio`

### 7. 测试账号

| 角色 | 邮箱 |
|-----|------|
| 管理员 | admin@example.com |
| 运营 | liyingyun@example.com |
| 运营 | wangzhujiao@example.com |
| 学员 | zhangxm@example.com 等5个 |

> 系统尚未接入登录鉴权，可直接进入使用。生产环境需自行接入。

---

## 🗄️ 数据库设计（14张表）

### 核心业务表
| 表名 | 说明 |
|-----|------|
| `users` | 用户表（管理员/运营/学员三种角色） |
| `training_camps` | 训练营营期表 |
| `chapters` | 章节表（支持试看、发布状态、排序） |
| `chapter_materials` | 章节配套资料表 |
| `camp_materials` | 营期公共资料表 |
| `members` | 会员表（入营记录，含转化来源、掉队标记、学习进度） |
| `member_progress` | 章节学习进度明细表 |
| `checkin_records` | 打卡记录表 |
| `refund_rules` | 退款规则表 |
| `refund_requests` | 退款申请表 |
| `member_benefits` | 会员权益表 |
| `todos` | 待办事项表（4种类型：掉队预警/打卡审核/退款审核/自定义） |

---

## ⚡ 核心业务流程

### 🔍 学员掉队自动预警机制
```
1. 会员更新学习进度时，触发 updateFallingBehind()
2. 计算：实际进度 vs 预期进度（按营期时间线线性插值）
3. 若 实际进度 + 20% < 预期进度 → 标记 is_falling_behind = true
4. 自动创建待办事项：
   - 类型：fall_behind_warning
   - 优先级：high
   - 处理人：营期负责人
   - 截止时间：3天后
5. 直接拉低完课率报表数据
```

### 📤 数据导出流程
```
1. 前端设置筛选条件（时间、状态、处理人、营期、转化来源等）
2. 调用 /api/export/xxx 接口（CSV格式，HTTP下载）
3. 后端根据条件查询 SQL，使用 CASE WHEN 将枚举翻译为中文
4. 通过 json2csv 生成标准 CSV 文件
5. 设置 Content-Disposition 触发浏览器下载
```

---

## 📝 常用命令速查

```bash
# 项目
npm run dev              # 启动前端+后端
npm run build            # 构建前后端

# 数据库
npm run db:generate      # 生成迁移
npm run db:migrate       # 执行迁移
npm run db:seed          # 填充种子数据
npm run db:studio        # Drizzle Studio（图形化操作数据）
```

---

## 🔧 可扩展方向

- [ ] 接入鉴权（Clerk / Auth.js / JWT）
- [ ] 学员端小程序/H5（打卡、看课）
- [ ] 微信消息推送（掉队提醒、打卡审核结果）
- [ ] 短信/邮件通知
- [ ] 更丰富的图表、Excel 导出（xlsx）
- [ ] 数据看板权限分级
- [ ] 营期模板复制功能
