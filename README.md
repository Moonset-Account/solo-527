# 小区装修施工通行系统

## 技术栈
- **前端**: SvelteKit (Svelte 4 + Vite)
- **后端**: Go + Fiber v2
- **数据库**: SQLite

## 功能模块

1. **施工申请表** - 业主提交施工队、工种、材料进场时间、噪音作业申请
2. **时段限制** - 节假日禁止噪音作业，系统自动校验
3. **门岗核验** - 扫码核验，显示允许施工的楼栋和时间段
4. **违规记录** - 违规后施工队后续申请自动进入人工复核
5. **通知任务** - 申请审核结果、新违规等系统通知
6. **审计查询** - 所有操作日志记录和查询

## 项目结构

```
question-096/
├── backend/                 # Go Fiber 后端
│   ├── database/           # 数据库初始化和操作
│   ├── models/             # 数据模型
│   ├── handlers/           # API 处理函数
│   ├── routes/             # 路由配置
│   ├── main.go             # 入口文件
│   └── server              # 编译后的可执行文件
├── frontend/               # SvelteKit 前端
│   ├── src/
│   │   ├── lib/            # 公共库 (API 封装)
│   │   ├── routes/         # 页面路由
│   │   └── app.html        # HTML 模板
│   ├── package.json
│   └── vite.config.js
└── 验收样例说明.md          # 验收测试用例
```

## 快速开始

### 1. 启动后端服务

```bash
cd backend
./server
```

或重新编译运行：

```bash
cd backend
go run main.go
```

后端服务运行在 `http://localhost:3001`

### 2. 启动前端开发服务器

```bash
cd frontend
npm install   # 首次运行需要安装依赖
npm run dev
```

前端服务运行在 `http://localhost:5173`

### 3. 访问系统

打开浏览器访问 `http://localhost:5173`

## 测试账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | admin | admin123 | 全部权限，包括审计查询 |
| 工程部 | engineer | engineer123 | 审核申请、处理违规、门岗核验 |
| 门岗 | gate | gate123 | 门岗核验、记录违规 |
| 业主 | owner | owner123 | 提交施工申请、查看自己的申请 |

## 核心业务规则

1. **节假日噪音禁止**: 节假日期间禁止噪音作业，提交时自动校验
2. **违规人工复核**: 施工队有违规记录后，后续申请自动进入人工复核队列
3. **违规锁定**: 违规记录未关闭前，该施工队不能申请新的噪音作业
4. **筛选保留**: 列表页进入详情后返回，原筛选条件和页码自动保留
5. **权限控制**: 不同角色有不同的菜单和操作权限

## API 接口

### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 退出
- `GET /api/auth/me` - 获取当前用户

### 施工申请
- `GET /api/applications` - 获取申请列表（支持筛选）
- `POST /api/applications` - 创建申请
- `GET /api/applications/:id` - 获取申请详情
- `PUT /api/applications/:id` - 更新申请
- `POST /api/applications/:id/review` - 审核申请（需工程师/管理员权限）

### 违规记录
- `GET /api/violations` - 获取违规列表
- `POST /api/violations` - 记录违规
- `POST /api/violations/:id/handle` - 处理违规

### 门岗核验
- `POST /api/gate/verify` - 核验二维码
- `GET /api/gate/records` - 获取核验记录

### 通知和审计
- `GET /api/notifications` - 获取通知列表
- `POST /api/notifications/:id/read` - 标记已读
- `GET /api/audit/logs` - 获取审计日志（需管理员权限）

### 公共数据
- `GET /api/teams` - 获取施工队列表
- `GET /api/holidays` - 获取节假日
- `GET /api/check-noise-date` - 检查日期是否允许噪音作业
