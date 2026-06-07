# 企业培训完成率仪表盘 - 项目结构

## 技术栈
- **前端框架**: Remix + React 18 + TypeScript
- **后端服务**: Express
- **数据存储**: PostgreSQL
- **缓存层**: Redis (ioredis)
- **图表库**: Recharts
- **样式**: Tailwind CSS
- **日期处理**: Day.js

## 目录结构

```
question-160/
├── app/                           # 应用主目录
│   ├── components/                # UI 组件
│   │   ├── AnomalySummary.tsx     # 异常摘要组件
│   │   ├── Card.tsx               # 通用卡片容器
│   │   ├── CertificateTrend.tsx   # 证书发放趋势图
│   │   ├── CompletionFunnel.tsx   # 完成率漏斗图
│   │   ├── DepartmentComparison.tsx # 部门对比图
│   │   ├── ExportButton.tsx       # 数据导出按钮
│   │   ├── FilterBar.tsx          # 多维度筛选器
│   │   └── QuizDistribution.tsx   # 测验分数分布图
│   ├── config/                    # 配置文件
│   │   ├── db.server.ts           # PostgreSQL 连接池
│   │   └── redis.server.ts        # Redis 连接 + 缓存工具
│   ├── data/                      # 数据相关
│   │   └── mockData.ts            # 演示用模拟数据
│   ├── metrics/                   # 指标定义
│   │   └── definitions.ts         # 指标口径定义文件
│   ├── routes/                    # Remix 路由
│   │   ├── _index.tsx             # 仪表盘主页
│   │   ├── api.export.ts          # 数据导出 API
│   │   └── api.metrics.ts         # 指标查询 API
│   ├── types/                     # TypeScript 类型定义
│   │   └── index.ts               # 全局类型
│   ├── root.tsx                   # Remix 根组件
│   └── tailwind.css               # 全局样式
├── scripts/                       # 数据脚本
│   ├── aggregate-metrics.ts       # 指标聚合脚本
│   ├── clean-data.ts              # 数据清洗脚本
│   ├── export-task.ts             # 导出任务脚本
│   ├── init-db.ts                 # 数据库初始化
│   ├── schema.sql                 # 数据库 Schema
│   └── seed-data.ts               # 测试数据生成
├── server/                        # Express 服务器
│   └── index.ts                   # 服务入口
├── package.json
├── tsconfig.json
├── remix.config.js
├── tailwind.config.ts
├── postcss.config.js
└── .env.example
```

## 核心模块说明

### 1. 数据管道 (scripts/)
- **schema.sql**: 10 张核心表定义
- **clean-data.ts**: 7 条数据清洗规则，事务化执行
- **aggregate-metrics.ts**: 5 类指标聚合查询
- **export-task.ts**: CSV/JSON 格式导出

### 2. 指标口径 (app/metrics/definitions.ts)
定义了 13 个核心指标：
- 漏斗类：报名人数、签到率、课程完成率、首次通过率、补考通过率、证书获得率
- 测验类：分数分布
- 部门类：部门完成率对比
- 证书类：发放趋势
- 异常类：低完成率、高未签到率、高补考率

### 3. 核心视图 (app/components/)
1. **异常摘要** - 按类型分组展示异常，含严重程度标识
2. **完成率漏斗** - 6 步转化路径（报名→签到→完成→首次通过→补考通过→证书）
3. **测验分布** - 5 个分数段柱状图
4. **部门对比** - 3 指标柱状图 + 明细表
5. **证书趋势** - 堆叠面积图（区分首次/补考）

### 4. 筛选维度 (FilterBar)
- 部门、课程、班期、讲师、岗位
- 通过 URL search params 保留筛选上下文
- 支持一键清除筛选

### 5. 缓存策略
- Redis 缓存键按维度参数生成
- 支持 SHORT/MEDIUM/LONG/DAY 多级 TTL
- 自动缓存穿透保护

## 运行方式

### 演示模式（默认）
项目默认使用模拟数据运行，无需数据库：
```bash
npm install
npm run dev
```
访问 http://localhost:3000 即可查看演示效果

### 连接真实数据
1. 配置 `.env` 文件（参考 `.env.example`）
2. 启动 PostgreSQL 和 Redis
3. 初始化数据库：`npm run db:init`
4. 生成测试数据：`npm run db:seed`
5. 数据清洗：`npm run data:clean`
6. 修改 `app/routes/_index.tsx` 中 `USE_MOCK_DATA = false`
7. 启动服务：`npm run dev`

### 可用脚本
```bash
npm run dev          # 开发模式
npm run build        # 构建生产版本
npm start            # 生产模式
npm run db:init      # 初始化数据库
npm run db:seed      # 生成测试数据
npm run data:clean   # 数据清洗
npm run data:aggregate  # 手动聚合指标
npm run export:run   # 执行导出任务
```
