# 联合办公房源看房预约管理系统

## 技术栈

- **后端**: ASP.NET Core 8.0 Web API
- **前端**: React 18 + TypeScript + Vite + Ant Design 5
- **数据库**: SQL Server (EF Core 8)
- **缓存**: Redis (IDistributedCache)
- **日志**: Serilog
- **导出**: EPPlus (Excel)

## 项目结构

```
backend/
├── CoworkingBooking.Api/          # Web API 层
│   ├── Controllers/               # API 控制器
│   ├── Program.cs                 # 启动入口
│   ├── DatabaseSeeder.cs          # 种子数据
│   └── appsettings.json           # 配置文件
├── CoworkingBooking.Application/  # 应用层
│   ├── Common/                    # 通用响应模型
│   ├── DTOs/                      # 数据传输对象
│   └── Interfaces/                # 服务接口
├── CoworkingBooking.Domain/       # 领域层
│   ├── Entities/                  # 实体模型
│   └── Enums/                     # 枚举定义
└── CoworkingBooking.Infrastructure/  # 基础设施层
    ├── Data/                      # DbContext
    ├── Middleware/                # 异常处理中间件
    └── Services/                  # 服务实现

frontend/                          # React 前端
├── src/
│   ├── pages/
│   │   ├── front/                 # 前台页面
│   │   └── admin/                 # 后台管理页面
│   ├── layouts/                   # 布局组件
│   ├── services/                  # API 服务
│   ├── store/                     # 状态管理 (Zustand)
│   ├── types/                     # TypeScript 类型
│   └── utils/                     # 工具函数
```

## 功能模块

### 1. 登录权限与角色
- 超级管理员 (SuperAdmin)
- 财务专员 (Finance)
- 顾问经理 (ConsultantManager)
- 顾问 (Consultant)
- 房东托管经理 (LandlordManager)
- 客户 (Customer)

### 2. 前台功能
- 房源查询与筛选（类型/状态/价格/面积）
- 房源详情展示（价格、设施、介绍）
- 在线看房预约
- 我的预约（含跟进记录查看）
- 我的租约合同
- 我的账单

### 3. 后台管理
- **工作台**: 数据概览、最近预约和订单
- **看房预约**: 列表、详情（基本信息+跟进记录+处理操作区）、分配顾问、状态更新、添加跟进、标记爽约、导出
- **爽约管理**: 独立列表（与普通预约分离）、详情、房东托管经理处理（原因+结果+处罚）、保留处理记录
- **房源管理**: 增删改查、房态/价格维护、多价格方案
- **租约合同**: 创建、签署、终止、详情、导出、自动生成账单
- **账单管理**: 创建、收款、财务统计、导出
- **订单履约**: 创建订单、支付、履约进度跟踪、异常处理、导出
- **操作日志**: 全量操作记录、筛选、导出（仅超级管理员）

### 4. 关键特性
- 接口异常：技术细节写日志 + Serilog 文件记录，页面返回业务友好提示
- 爽约流程：独立管理入口，房东托管经理处理后保留原因、结果、处罚
- 订单履约：与合同/预约关联，全流程跟踪
- 角色权限：基于 ASP.NET Core Identity + JWT + 角色授权
- 导出功能：预约、合同、账单、订单、日志均支持 Excel 导出

## 启动方式

### 后端

```bash
cd backend
# 1. 修改 appsettings.json 中的数据库和 Redis 连接字符串
# 2. 运行（自动创建数据库和种子数据）
dotnet run --project CoworkingBooking.Api
# Swagger 地址: http://localhost:5000/swagger
```

### 前端

```bash
cd frontend
npm install
npm run dev
# 访问: http://localhost:5173
```

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 超级管理员 | admin | Admin@123 |
| 财务专员 | finance | Finance@123 |
| 顾问经理 | manager | Manager@123 |
| 顾问 | consultant | Consult@123 |
| 房东托管经理 | landlord | Landlord@123 |
