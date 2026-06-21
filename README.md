# 心理咨询到店核销系统

服务调度员心理咨询到店核销工具，基于 ASP.NET Core + React + SQL Server + Redis 构建。

## 功能特性

### 预约管理
- 来访者预约咨询师并填写咨询原因
- 预约时间冲突自动检测
- 支持取消预约
- 预约状态实时跟踪

### 到店核销
- 支持预约号快速查询与核销
- 多种核销方式（手动、扫码、自助、工作人员协助）
- 负责人确认后自动同步到到店率
- 爽约记录管理，支持豁免

### 后台管理
- 服务项目管理（增删改查、隐私权限）
- 用户管理（角色、权限级别）
- 咨询师管理（擅长领域、服务项目关联）
- 候补队列管理（优先级、通知）
- 临时关店管理

### 退款管理
- 退款申请、审核、完成全流程
- 退款状态自动提醒
- 交易流水号记录

### 提醒机制
- 预约前一天自动提醒
- 爽约提醒
- 退款状态更新通知
- 候补队列通知
- 临时关店通知

### 统计报表
- 每日预约、到店、爽约统计
- 到店率计算
- 营收统计
- 跨部门核对（到店率、临时关店、最近处理记录）

### 统一错误处理
- 所有接口返回统一格式
- 错误信息清晰可读，避免让一线人员猜测原因
- 详细的操作指导说明

## 技术栈

### 后端
- ASP.NET Core 8.0
- Entity Framework Core 8.0
- SQL Server
- Redis (StackExchange.Redis)
- BCrypt.Net-Next（密码哈希）
- 分层架构（Domain / Application / Infrastructure / API）

### 前端
- React 18
- TypeScript
- Vite
- Ant Design 5
- React Router v6
- Axios
- Day.js

## 项目结构

```
.
├── Counseling.sln
├── database/
│   └── InitDatabase.sql          # 数据库初始化脚本
├── src/
│   ├── Counseling.Api/            # API 层（控制器、中间件）
│   ├── Counseling.Application/    # 应用层（服务、DTO）
│   ├── Counseling.Domain/         # 领域层（实体、接口、枚举）
│   └── Counseling.Infrastructure/ # 基础设施层（EF Core、Redis、仓储）
└── ClientApp/                     # React 前端
    ├── src/
    │   ├── components/            # 公共组件
    │   ├── layouts/               # 布局组件
    │   ├── pages/                 # 页面组件
    │   ├── services/              # API 服务
    │   └── types/                 # 类型定义
    └── package.json
```

## 快速开始

### 环境要求
- .NET 8.0 SDK
- Node.js 18+
- SQL Server 2019+
- Redis 6+

### 1. 数据库初始化

```bash
# 使用 SQL Server Management Studio 或 sqlcmd 执行初始化脚本
sqlcmd -S localhost -U sa -P YourPassword123! -i database/InitDatabase.sql
```

### 2. 配置连接字符串

修改 `src/Counseling.Api/appsettings.json`：

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=CounselingDB;User Id=sa;Password=YourPassword123!;TrustServerCertificate=True;",
    "RedisConnection": "localhost:6379,abortConnect=false"
  }
}
```

### 3. 启动后端

```bash
cd src/Counseling.Api
dotnet restore
dotnet run
```

API 将运行在 `http://localhost:5000`

Swagger 文档：`http://localhost:5000/swagger`

### 4. 启动前端

```bash
cd ClientApp
npm install
npm run dev
```

前端将运行在 `http://localhost:3000`

## 默认账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | 123456 | 管理员 | 系统管理员，拥有所有权限 |
| receptionist | 123456 | 前台 | 前台接待，核销操作 |
| client1 | 123456 | 来访者 | 测试用户 |

> 注意：初始密码为示例，生产环境请务必修改！

## API 接口列表

### 预约管理
- `GET /api/appointments` - 分页查询预约列表
- `GET /api/appointments/{id}` - 获取预约详情
- `GET /api/appointments/no/{appointmentNo}` - 按预约号查询
- `POST /api/appointments` - 创建预约
- `PUT /api/appointments/{id}` - 更新预约
- `POST /api/appointments/{id}/cancel` - 取消预约
- `GET /api/appointments/check-availability` - 检查时段可用性

### 到店核销
- `POST /api/checkin` - 到店核销
- `GET /api/checkin/{id}` - 获取核销记录
- `POST /api/checkin/{id}/confirm` - 确认核销
- `POST /api/checkin/no-show` - 标记爽约
- `POST /api/checkin/no-show/{id}/waive` - 豁免爽约

### 服务项目
- `GET /api/serviceitems` - 获取所有服务项目
- `GET /api/serviceitems/active` - 获取启用的服务项目
- `POST /api/serviceitems` - 新增服务项目
- `PUT /api/serviceitems/{id}` - 更新服务项目
- `DELETE /api/serviceitems/{id}` - 删除服务项目

### 用户管理
- `GET /api/users` - 获取所有用户
- `GET /api/users/{id}` - 获取用户详情
- `POST /api/users` - 新增用户
- `PUT /api/users/{id}` - 更新用户
- `DELETE /api/users/{id}` - 删除用户

### 候补队列
- `GET /api/waitlist` - 获取候补列表
- `POST /api/waitlist` - 加入候补
- `POST /api/waitlist/{id}/notify` - 发送通知
- `POST /api/waitlist/{id}/deactivate` - 设为失效

### 退款管理
- `GET /api/refunds` - 获取退款列表
- `POST /api/refunds` - 申请退款
- `POST /api/refunds/{id}/process` - 审核退款
- `POST /api/refunds/{id}/complete` - 完成退款

### 统计报表
- `GET /api/statistics/daily` - 每日统计
- `GET /api/statistics/range` - 日期范围统计
- `GET /api/statistics/attendance-rate` - 到店率
- `GET /api/statistics/cross-department` - 跨部门核对数据

### 消息提醒
- `GET /api/reminders/user/{userId}` - 获取用户消息
- `GET /api/reminders/user/{userId}/unread-count` - 未读消息数
- `POST /api/reminders/{id}/read` - 标记已读
- `POST /api/reminders/user/{userId}/read-all` - 全部已读

### 临时关店
- `GET /api/storeclosures` - 获取关店记录
- `POST /api/storeclosures` - 新增关店
- `DELETE /api/storeclosures/{id}` - 删除关店

## 统一响应格式

所有 API 接口返回统一格式：

```json
{
  "success": true,
  "message": "操作成功",
  "code": 200,
  "data": {}
}
```

### 错误码说明

| Code | 说明 |
|------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

错误消息都经过人性化处理，一线人员可以直接理解问题原因并采取相应行动。

## 隐私权限说明

系统支持四级隐私权限：

| 级别 | 名称 | 说明 |
|------|------|------|
| 0 | 公开 | 所有人可见 |
| 1 | 内部 | 内部工作人员可见 |
| 2 | 保密 | 管理层可见 |
| 3 | 受限 | 最高管理员可见 |

服务项目和用户数据都可以设置隐私级别，确保敏感信息安全。

## 到店率计算

到店率 = 到店人数 / 总预约数 × 100%

- 到店人数包含：已到店、已完成状态的预约
- 总预约数包含：所有状态的预约（不含已删除）
- 负责人确认核销后自动同步统计

## 开发说明

### 添加新的 API 接口

1. 在 Domain 层定义实体和仓储接口
2. 在 Application 层定义 DTO 和服务接口
3. 在 Infrastructure 层实现仓储
4. 在 Application 层实现服务
5. 在 API 层添加控制器

### Redis 缓存键约定

- `user:{id}` - 用户信息
- `users:role:{roleId}` - 按角色的用户列表
- `service:{id}` - 服务项目
- `services:active` - 启用的服务列表
- `appointment:{id}` - 预约详情
- `reminders:unread:{userId}` - 未读消息数
- `stats:daily:{date}` - 每日统计
- `closures:{date}` - 当日关店记录

## License

MIT
