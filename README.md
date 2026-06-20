# 医药批次调拨协同平台

> Medical Batch Allocation Collaboration Platform

基于 **ASP.NET Core 8 + React 18 + SQL Server + Redis** 构建的医药批次调拨协同业务后台系统。

---

## 一、功能模块一览

| 角色 | 功能模块 | 说明 |
|------|---------|------|
| **采购计划员** | 📊 数据看板 | 安全库存看板、高风险药品、分类库存汇总、统计卡片 |
| 采购计划员 | 🛒 补货建议 | 查看补货建议、风险等级、优先级、批量处理、生成调拨 |
| 采购计划员 | 🔄 调拨申请 | 调拨单申请、流转跟踪、批次管理、签收联动 |
| 采购计划员 | 🏭 供应商回复 | **重点追踪：安全库存、调拨申请、供应商回复状态、延误原因、办理时长** |
| 采购计划员 | ⚠️ 异常记录 | 交期延误原因、办理时长、负责人、风险等级 |
| **管理员** | 🔍 差异管理 | 数量/质量/批次差异，调查结果，解决措施，负责人指派 |
| 管理员 | 📦 签收管理 | 部分签收/全部签收/差异签收，自动创建差异记录 |
| 管理员 | 📈 缺货风险趋势 | 30天趋势折线图、按条件提醒阈值配置、明细告警 |
| 管理员 | 👤 系统管理 | 用户/仓库/药品管理 |

---

## 二、技术架构

```
┌─────────────────────────────────────────────────┐
│           Frontend (React 18 + Vite)             │
│  Ant Design 5 │ ECharts │ Zustand │ Axios        │
└────────────────────┬────────────────────────────┘
                     │ HTTP /api (proxy 5173→5000)
┌────────────────────▼────────────────────────────┐
│     Backend (ASP.NET Core 8 Web API)             │
│  Controllers → Services → Repositories → EF Core │
│  JWT Auth │ Swagger │ CORS │ AutoMapper          │
└───┬──────────────┬───────────────────┬───────────┘
    │              │                   │
    ▼              ▼                   ▼
┌───────┐   ┌──────────────┐   ┌──────────────┐
│ SQL   │   │  Redis Cache │   │  Identity /  │
│Server │   │  (IDistributed │   │  JWT Tokens │
└───────┘   └──────────────┘   └──────────────┘
```

### 后端分层

| 项目 | 路径 | 职责 |
|------|------|------|
| **Domain** | `backend/MedicalAllocation.Domain` | 实体、枚举、仓储接口 |
| **Application** | `backend/MedicalAllocation.Application` | DTO、服务接口、服务实现、AutoMapper映射 |
| **Infrastructure** | `backend/MedicalAllocation.Infrastructure` | DbContext、仓储实现、UnitOfWork |
| **API** | `backend/MedicalAllocation.API` | 控制器、Swagger、认证、CORS、DI配置 |

---

## 三、启动前准备

### 环境要求

- **.NET SDK 8.0+**  `dotnet --version` ≥ 8.0
- **Node.js 18+**  `node -v` ≥ 18.0
- **SQL Server**（推荐 LocalDB / SQL Express / Docker）
- **Redis**（可选，无Redis时仪表盘会降级为实时查询）

### 数据库连接

默认使用 **(localdb)\MSSQLLocalDB**，首次启动自动建库+种子数据。
如需修改，编辑：

> `backend/MedicalAllocation.API/appsettings.json` → `ConnectionStrings.DefaultConnection`

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=你的SQL地址;Database=MedicalAllocationDb;User Id=sa;Password=你的密码;TrustServerCertificate=True",
  "RedisConnection": "localhost:6379,abortConnect=false"
}
```

---

## 四、启动步骤

### 方式一：快速启动（推荐）

#### 1️⃣ 启动后端

```bash
cd backend
dotnet restore
dotnet run --project MedicalAllocation.API
```

后端启动后：
- 🌐 Swagger API 文档：http://localhost:5000/swagger
- 🗄️  首次启动自动执行 `EnsureCreated()` + 种子数据初始化

#### 2️⃣ 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端启动后自动打开：http://localhost:5173

---

### 方式二：使用 IDE

#### Visual Studio / Rider
1. 打开 `backend/MedicalAllocation.sln`
2. 设置 `MedicalAllocation.API` 为启动项目
3. 按 **F5** 启动

#### VS Code
1. 打开 `frontend` 文件夹 → `npm install` → `npm run dev`
2. 打开 `backend` 文件夹 → 选择 `.sln` → 点击运行

---

## 五、测试账号

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 🔴 **管理员** | `admin` | `123456` | 全部功能，差异管理+签收管理+风险趋势 |
| 🔵 **采购计划员** | `planner01` | `123456` | 看板/补货/调拨/供应商/异常，最常追踪功能 |
| 🔵 **采购计划员** | `planner02` | `123456` | 同上 |

> 后端不可用时，前端会自动降级为 **Mock 数据模式**，所有页面仍可正常预览交互。

---

## 六、重点功能说明

### ✅ 采购计划员入口（补货建议）
- 自动扫描库存低于安全库存的药品
- 按 `当前库存/安全库存` 比率计算风险等级（低/中/高/紧急）
- 自动计算补货建议量、预计缺货天数
- 支持批量标记已处理、一键生成调拨单

### ✅ 看板核心（安全库存）
- 顶部 **6 张统计卡片**：药品总数、低于安全库存、高风险、待审批调拨、待供应商回复、未关闭异常
- 安全库存表格：彩色进度条（≥1.0绿 ≥0.8黄 ≥0.5橙 <0.5红）
- 高风险药品 TOP10、分类库存饼图（ECharts）
- Redis 缓存 5 分钟，降低数据库压力

### ✅ 交接追踪重点字段
供应商回复 & 异常记录页重点突出：
| 字段 | 位置 | 说明 |
|------|------|------|
| **安全库存** | 看板/补货/详情弹窗 | 库存状态一目了然 |
| **调拨申请状态** | 调拨页/详情时间线 | 6 种状态流转 |
| **供应商回复状态** | 供应商Tab1 | 待回复/已回复/已确认/延误 |
| **交期延误原因** | 异常页表格红色加粗 | 延误详情 |
| **办理时长** | 供应商/异常表格蓝色高亮 | 小时数，未解决显示红色"-" |
| **负责人** | 异常/差异表格带头像 | 便于工作交接 |

### ✅ 管理员：差异 + 签收
- **差异管理**：6 种差异类型（短量/多量/损坏/过期/错批次/错药品）
- **签收管理**：调拨→运输→签收（完整/部分/差异）
- 签收数量不一致时**自动创建差异记录**
- 支持指派负责人、录入调查结果和解决措施

### ✅ 管理员：缺货风险趋势 + 条件提醒
- 近 30 天 4 条堆叠面积折线图（低/中/高/紧急）
- **提醒规则配置**：Switch开启后配置各风险等级阈值天数
- 按条件（风险等级、天数阈值、通知方式）自动高亮告警明细

---

## 七、后端 API 接口清单（Swagger 中查看完整）

| 控制器 | 路由前缀 | 说明 |
|--------|---------|------|
| AuthController | `/api/auth` | 登录、用户CRUD、密码修改、启禁 |
| DashboardController | `/api/dashboard` | 统计/安全库存/高风险/趋势/分类 |
| ReplenishmentController | `/api/replenishment` | 补货建议CRUD/处理/生成/批量 |
| AllocationController | `/api/allocation` | 调拨CRUD/审批/运输/签收/取消 |
| SupplierController | `/api/supplier` | 供应商+回复CRUD/状态/确认/延误 |
| ExceptionController | `/api/exception` | 异常CRUD/解决/指派/未关闭 |
| **DiscrepancyController** | `/api/discrepancy` | 差异CRUD/解决/指派/从调拨创建 |

---

## 八、项目结构

```
work-0359/
├── backend/
│   ├── MedicalAllocation.sln
│   ├── MedicalAllocation.API/          # Web API (Program.cs, Controllers)
│   ├── MedicalAllocation.Application/  # 业务层 (Services, DTOs, Interfaces)
│   ├── MedicalAllocation.Domain/       # 领域层 (Entities, Enums)
│   └── MedicalAllocation.Infrastructure/# 基础设施层 (DbContext, Repositories)
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── api/                         # axios封装+所有接口
        ├── layouts/                     # 主布局(侧栏+顶栏+内容)
        ├── pages/
        │   ├── Dashboard/               # 安全库存看板
        │   ├── Replenishment/           # 补货建议
        │   ├── Allocation/              # 调拨申请
        │   ├── Supplier/                # 供应商+回复
        │   ├── Exception/               # 异常记录
        │   └── Admin/
        │       ├── DiscrepancyManagement.jsx  # 差异管理
        │       ├── ReceiptManagement.jsx      # 签收管理
        │       ├── StockoutTrend.jsx          # 缺货趋势+提醒
        │       ├── UserManagement.jsx         # 用户管理
        │       ├── WarehouseManagement.jsx    # 仓库管理
        │       └── ProductManagement.jsx      # 药品管理
        ├── router/                      # 路由配置
        └── styles/                      # 全局样式
```

---

## 九、常见问题

### ❓ 数据库/Redis不可用，能否看效果？
✅ 可以！前端所有页面内置**Mock数据**，后端接口失败会自动降级。登录页使用提示账号即可。

### ❓ 后端启动报 SQL 连接错误？
- Windows：安装/启动 **SQL Server Express LocalDB**（VS安装器可选）
- Mac/Linux：使用 Docker 启动 SQL Server：
  ```bash
  docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=Passw0rd!" -p 1433:1433 mcr.microsoft.com/mssql/server
  ```
  然后将 `appsettings.json` 的连接字符串改为：
  `Server=localhost,1433;Database=MedicalAllocationDb;User Id=sa;Password=Passw0rd!;TrustServerCertificate=True`

### ❓ 如何看到真实数据？
1. 确保 SQL Server 可用，后端启动后种子数据自动写入（3用户/4仓库/5供应商/10药品）
2. 登录后进入「看板」→ 点击「生成补货建议」「生成趋势数据」按钮
3. 前后端端口：`5000` (后端) / `5173` (前端)，Vite代理已配置 `/api` → `http://localhost:5000`

---

## 十、下一步优化方向
- [ ] EF Core 数据库迁移（Add-Migration / Update-Database）
- [ ] 信号R实时通知（异常/告警推送到前端）
- [ ] Hangfire 定时任务：每日自动扫描补货建议
- [ ] Excel 导出：补货建议单、调拨明细、差异报表
- [ ] 细粒度权限：角色+菜单+按钮级权限控制
- [ ] 打印模板：调拨单、送货单、签收单

---

**启动后建议操作流程**：
1. 以 **planner01** 登录 → 看板查看安全库存 → 补货建议处理 → 生成调拨
2. 以 **admin** 登录 → 审批调拨 → 签收管理（模拟差异签收）→ 查看差异记录 → 配置缺货提醒
