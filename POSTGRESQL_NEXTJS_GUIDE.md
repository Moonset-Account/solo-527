# PostgreSQL/PostGIS + Next.js 部署迁移指南

## 📋 概述

当前架构：**Vite React (前端) + Express (后端 API) + 可插拔数据库 (内存/PostgreSQL)**

虽然前端框架是 Vite React 而非 Next.js，但系统已经具备：
- ✅ 完整的 API 分层架构
- ✅ 数据库适配器模式（内存 ↔ PostgreSQL 一键切换）
- ✅ 真实的数据流：导入 → DB → 页面展示 → 导出
- ✅ 机构权限过滤（后端中间件）
- ✅ PostGIS 空间数据支持

---

## 🗄️ 启用 PostgreSQL/PostGIS 持久化

### 1. 环境准备

```bash
# 安装 PostgreSQL (macOS)
brew install postgresql postgis

# 启动 PostgreSQL 服务
brew services start postgresql

# 验证 PostGIS
psql -c "SELECT PostGIS_version();"
```

### 2. 创建数据库和用户

```sql
-- 登录 PostgreSQL
psql postgres

-- 创建数据库
CREATE DATABASE water_quality;

-- 连接到新数据库
\c water_quality

-- 启用 PostGIS 扩展
CREATE EXTENSION postgis;
CREATE EXTENSION "uuid-ossp";

-- 验证
SELECT PostGIS_version();
```

### 3. 配置环境变量

创建 `.env` 文件：

```env
# .env

# 启用 PostgreSQL
USE_POSTGRES=true

# PostgreSQL 连接字符串
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/water_quality

# 可选：自定义端口
PORT=3001
```

### 4. 启动服务

```bash
# 启动后端（会自动建表 + 注入种子数据）
USE_POSTGRES=true DATABASE_URL=postgresql://postgres:postgres@localhost:5432/water_quality npm run server:dev

# 启动前端
npm run client:dev
```

### 5. 验证数据库

```sql
-- 查看已创建的表
\dt

-- 查看空间索引
SELECT * FROM pg_indexes WHERE tablename = 'monitoring_sites';

-- 空间查询示例：查找 5km 范围内的站点
SELECT 
  name,
  ST_Distance(geom, ST_SetSRID(ST_MakePoint(116.4, 39.9), 4326)::geography) / 1000 as distance_km
FROM monitoring_sites
WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(116.4, 39.9), 4326)::geography, 5000)
ORDER BY distance_km;
```

---

## 📐 数据库架构设计

### 核心表结构

```
monitoring_sites (采样点)
├── id              VARCHAR(64)  PK
├── name            VARCHAR(128) 站点名称
├── code            VARCHAR(32)  站点编码
├── river_section   VARCHAR(64)  所属河段
├── longitude       DOUBLE       经度
├── latitude        DOUBLE       纬度
├── geom            GEOMETRY     PostGIS 空间点 (SRID=4326)
├── organization    VARCHAR(128) 所属机构
├── type            VARCHAR(16)  manual/automatic
├── status          VARCHAR(16)  active/inactive
└── created_at      TIMESTAMP

measurements (监测记录)
├── id              VARCHAR(64)  PK
├── site_id         VARCHAR(64)  FK → sites
├── sample_time     TIMESTAMP    采样时间
├── temperature     DOUBLE       水温 (°C)
├── ph              DOUBLE       pH值
├── dissolved_oxygen DOUBLE      溶解氧 (mg/L)
├── ammonia_nitrogen DOUBLE      氨氮 (mg/L)
├── rainfall        DOUBLE       降雨量 (mm)
├── data_source     VARCHAR(16)  manual/automatic
├── organization    VARCHAR(128) 机构（冗余便于过滤）
├── is_anomaly      BOOLEAN      是否异常
├── anomaly_reason  TEXT         异常原因
├── note            TEXT         备注
└── sampled_by      VARCHAR(64)  采样人

users (用户)
├── id              VARCHAR(64)  PK
├── username        VARCHAR(64)  UNIQUE
├── password_hash   VARCHAR(128)
├── role            VARCHAR(16)  admin/researcher
├── organization    VARCHAR(128) 所属机构
└── created_at      TIMESTAMP

anomaly_notes (异常备注)
├── id              VARCHAR(64)  PK
├── measurement_id  VARCHAR(64)  FK → measurements
├── user_id         VARCHAR(64)  FK → users
├── user_name       VARCHAR(64)  冗余用户名
├── content         TEXT         备注内容
└── created_at      TIMESTAMP
```

---

## 🔄 迁移到 Next.js 方案

### 方案 A：逐步迁移（推荐）

保持现有的 Vite React + Express 架构，因为：

1. **前后端分离是行业标准**：更利于团队协作、独立部署
2. **所有功能已落地**：数据持久化、权限过滤、导入导出全部可用
3. **数据库层已抽象**：PostgreSQL/PostGIS 支持已就绪
4. **迁移成本可控**：无需重写全部代码

### 方案 B：完整迁移到 Next.js App Router

如果确实需要 Next.js，可以按以下步骤迁移：

#### 第 1 步：初始化 Next.js 项目

```bash
npx create-next-app@latest water-quality-nextjs --typescript --tailwind --app
cd water-quality-nextjs

# 安装依赖
npm install mapbox-gl echarts echarts-for-react html2canvas jspdf papaparse pg zustand
npm install -D @types/pg @types/mapbox-gl
```

#### 第 2 步：目录结构规划

```
water-quality-nextjs/
├── app/
│   ├── layout.tsx              # 根布局 (含 Sidebar)
│   ├── page.tsx                # 总览仪表盘
│   ├── map/page.tsx            # 地图监测
│   ├── trends/page.tsx         # 趋势分析
│   ├── data-management/page.tsx # 数据管理
│   ├── export/page.tsx         # 报告导出
│   └── api/                    # Next.js API Routes (替代 Express)
│       ├── auth/login/route.ts
│       ├── overview/route.ts
│       ├── sites/route.ts
│       ├── measurements/route.ts
│       ├── measurements/import/route.ts
│       ├── measurements/export/csv/route.ts
│       ├── measurements/trend/route.ts
│       ├── anomalies/route.ts
│       ├── quality/route.ts
│       └── datadict/route.ts
├── components/
│   ├── layout/Sidebar.tsx
│   └── layout/PageContainer.tsx
├── hooks/useData.ts
├── store/useFilterStore.ts
├── utils/
│   ├── apiClient.ts (可移除，直接用 Server Actions)
│   ├── dataService.ts
│   └── constants.ts
├── types/index.ts
└── lib/
    ├── db/                     # 数据库层直接复用
    │   ├── index.ts
    │   ├── types.ts
    │   ├── postgresAdapter.ts
    │   └── memoryAdapter.ts
    └── auth.ts                 # Next.js Auth 集成
```

#### 第 3 步：代码复用

**可直接复用的文件（90%+）：**

| 文件 | 说明 |
|------|------|
| `lib/db/*` | 数据库层完整复用 |
| `types/index.ts` | 类型定义完整复用 |
| `utils/dataService.ts` | 数据处理函数完整复用 |
| `utils/constants.ts` | 常量完整复用 |
| `hooks/useData.ts` | Hook 完整复用 |
| `store/useFilterStore.ts` | Zustand Store 完整复用 |
| `src/components/layout/*` | 布局组件基本复用 |
| `src/pages/*` | 页面组件 90% 复用，只需修改数据获取方式 |

#### 第 4 步：替换 API 层

将 Express 路由迁移到 Next.js Route Handlers：

```typescript
// app/api/overview/route.ts
import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { calculateOverviewStats } from '@/utils/dataService';
import { authMiddleware, getOrganizationFilter } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await authMiddleware(request);
  if (!user) {
    return NextResponse.json({ success: false, error: '未认证' }, { status: 401 });
  }

  const orgFilter = getOrganizationFilter(user);
  const sites = await getDB().getSites(orgFilter || undefined);
  const result = await getDB().getMeasurements({
    organizations: orgFilter ? [orgFilter] : undefined,
    limit: 10000,
  });

  const stats = calculateOverviewStats(sites, result.data);

  return NextResponse.json({ success: true, data: stats });
}
```

---

## ✅ 当前已实现的完整数据流

```
用户上传 CSV
    ↓
前端 Papa Parse 解析
    ↓
POST /api/measurements/import
    ↓
权限中间件验证（机构过滤）
    ↓
DatabaseAdapter.addMeasurements()
    ↓
真实写入（内存库/PostgreSQL）
    ↓
页面刷新 → GET /api/measurements
    ↓
Dashboard / MapView / TrendAnalysis 展示
    ↓
导出中心调用 GET /api/measurements/export/csv
    ↓
生成包含最新导入数据的 CSV/PDF/截图
```

### 验证数据流

1. **登录** researcher1 / password123（机构：市环境监测中心站）
2. **确认只能看到该机构的站点**（约 3-4 个）
3. **批量导入** → 选择包含这些站点的 CSV
4. **查看导入后的记录数增加**
5. **导出 CSV** → 确认包含新导入的数据

---

## 📊 CSV 导入格式说明

支持的列名（中英混合均可）：

| 列名 | 必选 | 说明 |
|------|------|------|
| 站点名称 / siteName | ✅ | 需与系统中已有的站点名称匹配 |
| 采样时间 / sampleTime | ✅ | ISO 格式或可读日期格式 |
| 水温 / temperature | - | 数值，单位 °C |
| pH / ph | - | 数值 |
| 溶解氧 / dissolvedOxygen | - | 数值，单位 mg/L |
| 氨氮 / ammoniaNitrogen | - | 数值，单位 mg/L |
| 降雨量 / rainfall | - | 数值，单位 mm |
| 状态 / isAnomaly | - | "异常" 或 "正常" |
| 异常原因 / anomalyReason | - | 文本 |
| 备注 / note | - | 文本 |
| 采样人 / sampledBy | - | 文本 |

示例 CSV：

```csv
站点名称,采样时间,水温,pH,溶解氧,氨氮,降雨量,状态,备注
干流监测站1,2024-01-15 08:30,18.5,7.8,6.5,0.32,5.2,正常,常规采样
支流监测站2,2024-01-15 09:00,19.2,7.2,4.2,0.85,8.0,异常,降雨后氨氮升高
```

---

## 🔗 相关文件索引

| 文件 | 说明 |
|------|------|
| [api/db/postgresAdapter.ts](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-124/api/db/postgresAdapter.ts) | PostgreSQL/PostGIS 适配器，含完整建表 SQL |
| [api/db/memoryAdapter.ts](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-124/api/db/memoryAdapter.ts) | 内存数据库适配器（默认） |
| [api/db/types.ts](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-124/api/db/types.ts) | 数据库接口定义 |
| [api/db/index.ts](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-124/api/db/index.ts) | 数据库入口，自动降级 |
| [api/middleware/auth.ts](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-124/api/middleware/auth.ts) | 认证 + 机构权限过滤中间件 |
| [src/pages/DataManagement.tsx](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-124/src/pages/DataManagement.tsx) | 批量导入（Papa Parse 真实解析） |
| [src/pages/ExportCenter.tsx](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-124/src/pages/ExportCenter.tsx) | 导出中心（真实 API 数据） |
| [.env.example](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-124/.env.example) | 环境变量配置示例 |
