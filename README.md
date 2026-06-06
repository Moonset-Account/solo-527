# 社区冷链药品交接系统

用于卫生服务站的疫苗和冷藏药品交接管理系统。

## 技术栈

- **前端**: SvelteKit
- **后端**: Go Fiber
- **数据库**: SQLite

## 功能特性

- ✅ 批号管理 - 按批号、箱号、温度记录和接收人入库
- ✅ 交接签名 - 电子签名确认交接
- ✅ 温度附件 - 支持上传温度记录文件
- ✅ 过期提醒 - 即将过期药品自动提醒
- ✅ 权限控制 - 管理员、护士、接种员角色
- ✅ 离线缓存 - 支持离线操作和数据缓存
- ✅ 异常抽屉 - 温度超标、签收缺失、即将过期统一展示
- ✅ 隔离机制 - 温度超标批次自动隔离，仅管理员可恢复
- ✅ 发放失败处理 - 记录失败原因、处理人、下一次复核时间

## 快速开始

### 后端启动

```bash
cd backend
go mod tidy
go run cmd/main.go
```

后端服务运行在 `http://localhost:3001`

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端运行在 `http://localhost:5173`

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| nurse1 | nurse123 | 护士 |
| nurse2 | nurse123 | 护士 |
| vaccinator1 | vac123 | 接种员 |

## 项目结构

```
├── backend/                 # Go 后端
│   ├── cmd/
│   │   └── main.go         # 入口文件
│   ├── internal/
│   │   ├── models/         # 数据模型
│   │   ├── handlers/       # API 处理器
│   │   ├── middleware/     # 中间件
│   │   ├── database/       # 数据库初始化
│   │   └── utils/          # 工具函数
│   └── go.mod
└── frontend/               # SvelteKit 前端
    ├── src/
    │   ├── routes/         # 页面路由
    │   └── lib/
    │       ├── components/ # 组件
    │       ├── stores/     # 状态管理
    │       ├── types/      # 类型定义
    │       └── utils/      # 工具函数
    └── package.json
```

## API 接口

### 认证
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户

### 批次管理
- `POST /api/batches/receive` - 药品入库
- `GET /api/batches` - 获取批次列表
- `GET /api/batches/:id` - 获取批次详情
- `POST /api/batches/isolate` - 隔离批次
- `POST /api/batches/:id/restore` - 恢复批次（管理员）
- `GET /api/batches/abnormal` - 获取异常批次

### 交接管理
- `POST /api/handover` - 创建交接
- `GET /api/handover` - 获取交接记录
- `GET /api/handover/:id` - 获取交接详情
- `POST /api/handover/failure` - 处理发放失败

### 附件
- `POST /api/batches/attachments` - 上传温度附件
- `GET /api/batches/:batchId/attachments` - 获取批次附件
- `GET /api/attachments/:id/download` - 下载附件

### 统计
- `GET /api/stats/today` - 获取今日统计
