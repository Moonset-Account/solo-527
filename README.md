# 居民议题闭环看板系统

基于 **Nuxt 3 + Nitro + Prisma + MySQL + Redis** 的居民议题闭环管理系统，覆盖议题从发起 → 投票 → 整改 → 复查 → 公示 → 归档的完整生命周期，配套超时待办自动生成、巡逻覆盖同步、异常日志追溯、操作时间线等能力，减少口头确认，关键信息一次看全。

---

## 一、功能矩阵

| 模块 | 入口 | 能力 |
|---|---|---|
| 议题公示 | `/` | 已公示议题列表、搜索筛选、统计卡片、现场/设施照片 |
| 参与投票 | `/vote` | 凭议题编号 + 手机号投票；赞成/反对/弃权；可改投覆盖；投票概况统计 |
| 居民查询 | `/resident` | 凭手机号查询参与/反映过的议题；点击进入详情或直接下载 Excel 单据 |
| 议题详情 | `/issue/:id` | **一张页看全结果公示 + 投票 + 整改 + 复查 + 网格事件 + 时间线**，减少跳转 |
| 后台管理 | `/admin` | 议题创建、高级筛选、状态流转、跳转处置、单据下载 |
| 后台处置 | `/admin/issue/:id` | 编辑、公示、整改措施（可完成）、复查、关联网格事件（可处置 + 计入巡逻）、投票、操作时间线 |
| 待办中心 | `/todos` | 手动/自动扫描超时生成待办；超时待办自动标记、自动同步巡逻统计 |
| 统计巡检 | `/stats` | 总量/状态/分类分布 + 巡逻覆盖统计按日/网格维度 |
| 异常日志 | `/logs` | 按单据编号、Trace ID、状态、时间定位接口异常，含请求体/调用栈详情 |

### 关键特性对应需求
1. **少跳转，一次看全**：详情页用两列布局把投票、整改、复查、网格事件、时间线、导出按钮全部放在同一页（[issue/[id].vue](file:///Volumes/TraeProjects/trae-solo-generated-projects/work-0351/pages/issue/%5Bid%5D.vue)、[admin/issue/[id].vue](file:///Volumes/TraeProjects/trae-solo-generated-projects/work-0351/pages/admin/issue/%5Bid%5D.vue)）。
2. **减少口头确认**：
   - 每个议题都可 **一键导出 Excel 单据**（[export-xlsx.get.ts](file:///Volumes/TraeProjects/trae-solo-generated-projects/work-0351/server/api/issues/%5Bid%5D/export-xlsx.get.ts)）。
   - 所有操作写入 **操作时间线**（[Timeline.vue](file:///Volumes/TraeProjects/trae-solo-generated-projects/work-0351/components/Timeline.vue)），交接时可追溯。
3. **超时 → 待办 → 巡逻统计同步**：[scan-timeout.post.ts](file:///Volumes/TraeProjects/trae-solo-generated-projects/work-0351/server/api/jobs/scan-timeout.post.ts) 扫描超期的整改/议题，生成待办并把数量同步写入 `PatrolStat`，处置网格事件勾选"计入巡逻覆盖"也会累加。
4. **接口异常可定位**：全局 [error-handler.ts](file:///Volumes/TraeProjects/trae-solo-generated-projects/work-0351/server/middleware/error-handler.ts) 捕获所有异常写入 `ApiException`，记录 **traceId / 单据编号 / 时间 / 状态码 / 错误消息 / 调用栈 / 请求体**，响应头自动回传 `x-trace-id`。
5. **操作记录时间线**：所有写接口调用 [recordOperationLog](file:///Volumes/TraeProjects/trae-solo-generated-projects/work-0351/server/utils/operation-log.ts) 按议题维度写入，交接可续接处理上下文。

---

## 二、快速开始

### 1. 环境要求
- Node.js ≥ 18
- MySQL ≥ 8
- Redis ≥ 6（可选，未启动也可运行，访问 Redis 时会失败但不影响核心功能）

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
```bash
cp .env.example .env
```
编辑 `.env`：
```
DATABASE_URL="mysql://用户名:密码@localhost:3306/resident_issue?useSSL=false"
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
REDIS_PASSWORD=""
```
> 需先在 MySQL 中手动创建空数据库 `resident_issue`（UTF8MB4）。

### 4. 初始化数据库
```bash
npm run prisma:generate   # 生成 Prisma Client 类型
npm run prisma:push       # 把 schema 推到 MySQL（开发环境推荐）
```
如需迁移管理可改用 `prisma migrate dev`。

### 5. 启动开发
```bash
npm run dev
# → http://localhost:3000
```
首次使用：访问 `/admin` → "+ 新建议题" → 创建几条样例 → 到投票、整改、复查、处置把流程走通。

### 6. 生产构建
```bash
npm run build
npm run preview
```

---

## 三、核心数据模型（Prisma Schema）

详见 [prisma/schema.prisma](file:///Volumes/TraeProjects/trae-solo-generated-projects/work-0351/prisma/schema.prisma)：

- `Resident` — 居民（手机号唯一，反映/投票时自动 upsert）
- `Issue` — 议题单据，核心表，状态 `PENDING→VOTING→RECTIFYING→REVIEWING→DONE`
- `Vote` — 投票（issueId+residentId 联合唯一，重复投票自动覆盖）
- `Rectification` — 整改措施（可多条，单独完成状态）
- `Review` — 复查结果（PASS/FAIL/IMPROVE，可评分 1-5，PASS 时自动把议题置 DONE 并公示）
- `Photo` — 照片多态关联（议题/整改/复查）
- `GridEvent` — 关联网格事件，处置时可勾选计入巡逻覆盖
- `Todo` — 待办，超时自动生成时 `fromTimeout=true`，并同步到 `PatrolStat.timeoutTodoCount`
- `PatrolStat` — 按 `date+gridNo` 唯一的巡逻覆盖统计表
- `OperationLog` — 操作时间线，所有写接口自动记录
- `ApiException` — 接口异常日志，配合 traceId 排查

---

## 四、API 概览（Nitro）

### 议题
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/issues` | 后台列表，支持 keyword/status/category/priority/community/page/size |
| POST | `/api/issues` | 新建议题，可带设施照片 URL、投票/整改截止时间 |
| GET | `/api/issues/:id` | 后台详情（一次返回投票/整改/复查/照片/网格事件/待办/时间线）|
| PUT | `/api/issues/:id` | 编辑议题，改状态/负责人/公示等 |
| POST | `/api/issues/:id/vote` | 居民投票，按 residentPhone 自动 upsert 居民 |
| POST | `/api/issues/:id/rectify` | 添加整改措施，可带整改照片 |
| POST | `/api/issues/:id/review` | 复查；PASS 时议题 → DONE + 自动公示 |
| POST | `/api/issues/:id/grid-event` | 关联网格事件 |
| GET | `/api/issues/:id/export-xlsx` | 下载 Excel 单据（6 个 Sheet）|

### 处置
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/rectifications/:rectId/complete` | 标记整改完成 |
| POST | `/api/grid-events/:eventId/handle` | 网格事件处置，`patrolCovered=true` 时叠加巡逻覆盖统计 |

### 公开接口（居民端用）
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/public/issues?phone=&keyword=&page=` | 已公示议题；带 phone 时同时包含该居民作为反映人的未公示议题 |
| GET | `/api/public/issues/:code` | 居民查看详情 |

### 待办/统计/日志
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/todos?from=timeout&done=0/1` | 待办列表 |
| POST | `/api/todos/:todoId/complete` | 完成待办 |
| POST | `/api/jobs/scan-timeout` | **关键**：扫描整改超时、议题截止超时 → 生成 Todo → 同步 PatrolStat.timeoutTodoCount |
| GET | `/api/stats/summary` | 首页/统计总览卡片数据 |
| GET | `/api/stats/patrol?startDate&endDate&gridNo` | 巡逻覆盖统计列表 |
| GET | `/api/logs/operations?issueId=` | 操作时间线（也已内嵌详情接口）|
| GET | `/api/exceptions?issueCode=&traceId=&date=` | 异常日志列表，可按单据排查 |

> 接口安全说明：当前版本为内网部署形态，未做 JWT 鉴权。如需对外暴露，可在 `server/middleware/` 新增 `auth.ts` 做路由级权限判断。

---

## 五、定时巡检建议

`POST /api/jobs/scan-timeout` 本身是幂等的（已生成过的超时不会重复建），建议外部 crontab 每 30 分钟调用一次：
```bash
curl -X POST http://localhost:3000/api/jobs/scan-timeout
```
即可实现"处置超时自动形成待办并同步到巡逻覆盖统计"，全程无需人工介入。

---

## 六、目录结构
```
assets/css/main.css      Tailwind + 时间线样式
components/              AppHeader, IssueCard, PhotoGrid, Timeline
composables/useApi.ts    统一请求封装、常量（状态颜色/标签、操作员记忆）
pages/                   8 个页面：index / vote / issue/:id / resident / admin* / todos / stats / logs
prisma/schema.prisma     数据模型
server/
  api/                   30 个左右 Nitro 路由，按资源分层
  middleware/error-handler.ts  全局异常 → 写 ApiException + 回传 traceId
  utils/                 prisma / redis / response / operation-log 封装
types/index.ts           全量 TS 类型
```

---

## 七、常见问题
**Q: 照片存到哪里？**
A: 当前表单设计是传 URL（建议先把图片上传到对象存储/内部图床拿到 URL 后再填入）。如果要改成后端直传，可在 `server/api/uploads.post.ts` 新增一个 Nitro 路由接收 multipart 并存到本地/OSS 后回 URL。

**Q: Redis 没用上？**
A: 预留了 `server/utils/redis.ts`，可在热点接口（如 `/api/stats/summary`、`/api/public/issues`）里用 Redis 做二级缓存；当前先保证核心链路可用。

**Q: 如何接入 PDF 下载？**
A: 已在 `package.json` 里装 `jspdf / jspdf-autotable`，可复用 `export-xlsx.get.ts` 的聚合数据，新增一个 `export-pdf.get.ts` 即可。

**Q: Trace ID 怎么用？**
A: 每次响应头都会带 `x-trace-id`，把 ID 粘到 `/logs` 页面里搜，就能定位那次请求的所有上下文（路径、参数、报错栈、关联单据号）。
