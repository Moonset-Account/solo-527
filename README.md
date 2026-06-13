# 工程材料采购审批系统

## 项目概述

基于 React + Ant Design + Express + MySQL + Prisma 构建的工程材料采购审批流系统。

## 功能模块

### 1. 采购需求管理
- 采购需求列表（搜索、筛选、分页）
- 新建/编辑采购需求
- 物料明细管理（动态增删改）
- 附件上传/删除
- 提交审批

### 2. 审批中心
- 待我审批列表
- 全部审批记录
- 审批通过/驳回
- 审批意见填写

### 3. 审批层级配置
- 审批层级增删改查
- 金额范围配置
- 审批角色配置
- 启用/禁用层级

### 4. 价格波动管理
- 价格波动提醒列表（待复盘/已复盘）
- 价格复盘（结论、建议、说明）
- 历史价格查询
- 价格复盘记录

### 5. 事后追踪
- 采购需求查询
- 原始单据追踪（基本信息、物料明细、附件、审批记录）
- 到货确认记录
- 价格趋势分析图表

### 6. 付款差异与风险看板
- 付款差异提醒（待处理/已处理）
- 付款差异处理
- 供应商风险看板（分布图、风险等级统计）
- 供应商风险详情
- 处理完成自动写入供应商风险

### 7. 批量操作
- 批量更新（范围预览确认、字段级错误提示）
- 批量操作日志
- 失败记录详情（字段级错误）

### 8. 供应商管理
- 供应商列表（搜索、筛选）
- 供应商增删改查
- 风险等级管理

## 技术栈

### 前端
- React 18
- Ant Design 5
- React Router 6
- Axios
- ECharts
- Day.js
- Vite

### 后端
- Express.js
- Prisma ORM
- MySQL
- JWT 认证
- Multer（文件上传）
- bcryptjs（密码加密）

## 项目结构

```
.
├── backend/                    # 后端项目
│   ├── prisma/
│   │   ├── schema.prisma      # 数据库模型定义
│   │   └── seed.js            # 种子数据
│   ├── src/
│   │   ├── controllers/       # 控制器
│   │   ├── middleware/        # 中间件
│   │   ├── routes/            # 路由
│   │   ├── utils/             # 工具函数
│   │   └── app.js             # 入口文件
│   ├── .env                   # 环境变量
│   └── package.json
├── frontend/                   # 前端项目
│   ├── src/
│   │   ├── layouts/           # 布局组件
│   │   ├── pages/             # 页面组件
│   │   ├── services/          # API 服务
│   │   ├── utils/             # 工具函数
│   │   ├── App.jsx            # 根组件
│   │   └── main.jsx           # 入口文件
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## 快速开始

### 前置要求
- Node.js >= 18
- MySQL >= 8.0

### 1. 数据库准备
创建 MySQL 数据库：
```sql
CREATE DATABASE procurement_db DEFAULT CHARACTER SET utf8mb4;
```

### 2. 后端启动
```bash
cd backend

# 安装依赖
npm install

# 修改 .env 中的数据库连接信息
# DATABASE_URL="mysql://用户名:密码@localhost:3306/procurement_db"

# 生成 Prisma Client
npm run prisma:generate

# 同步数据库表结构
npm run prisma:push

# 初始化种子数据
npm run prisma:seed

# 启动开发服务器
npm run dev
```

后端服务运行在 http://localhost:3001

### 3. 前端启动
```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务运行在 http://localhost:3000

### 4. 测试账号
| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 123456 | 管理员 |
| pm01 | 123456 | 项目经理 |
| procurement | 123456 | 采购经理 |
| finance | 123456 | 财务 |

## API 接口说明

### 认证
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户

### 采购需求
- `GET /api/purchase-requests` - 列表
- `GET /api/purchase-requests/:id` - 详情
- `POST /api/purchase-requests` - 创建
- `PUT /api/purchase-requests/:id` - 更新
- `POST /api/purchase-requests/:id/submit` - 提交审批
- `DELETE /api/purchase-requests/:id` - 删除
- `POST /api/purchase-requests/attachments` - 上传附件
- `DELETE /api/purchase-requests/attachments/:id` - 删除附件

### 审批
- `GET /api/approvals/levels` - 审批层级列表
- `POST /api/approvals/levels` - 新增审批层级
- `PUT /api/approvals/levels/:id` - 更新审批层级
- `DELETE /api/approvals/levels/:id` - 删除审批层级
- `GET /api/approvals/my` - 我的审批
- `POST /api/approvals/:id/approve` - 通过
- `POST /api/approvals/:id/reject` - 驳回

### 价格
- `GET /api/price/history` - 历史价格
- `POST /api/price/history` - 添加价格记录
- `GET /api/price/alerts` - 价格波动提醒
- `POST /api/price/alerts/:id/review` - 价格复盘
- `GET /api/price/reviews` - 复盘记录

### 追踪
- `GET /api/tracking/price-trend` - 价格趋势
- `GET /api/tracking/delivery-confirmations` - 到货确认列表
- `POST /api/tracking/delivery-confirmations` - 新增到货确认
- `GET /api/tracking/original-documents` - 原始单据
- `GET /api/tracking/purchase-requests` - 采购需求查询

### 付款与风险
- `GET /api/payment/alerts` - 付款差异提醒
- `POST /api/payment/alerts` - 创建付款差异
- `POST /api/payment/alerts/:id/resolve` - 处理付款差异
- `GET /api/payment/risk-board` - 供应商风险看板
- `GET /api/payment/risk-board/:id` - 供应商风险详情

### 批量操作
- `GET /api/batch/logs` - 批量操作日志
- `GET /api/batch/logs/:id` - 批量操作详情
- `POST /api/batch/preview` - 批量更新预览
- `POST /api/batch/update` - 批量更新

### 供应商
- `GET /api/suppliers` - 列表
- `GET /api/suppliers/:id` - 详情
- `POST /api/suppliers` - 创建
- `PUT /api/suppliers/:id` - 更新
- `DELETE /api/suppliers/:id` - 删除

## 核心业务流程

### 采购审批流程
1. 项目负责人提交采购需求（含物料明细、附件）
2. 系统根据金额自动匹配审批层级
3. 各级审批人依次审批（通过/驳回）
4. 审批通过后进入执行阶段

### 价格波动预警
1. 提交采购需求时自动对比历史价格
2. 波动超过阈值（默认5%）自动生成价格波动提醒
3. 相关人员进行价格复盘
4. 记录复盘结论和处理建议

### 付款差异处理
1. 财务录入付款差异信息
2. 采购经理处理差异并填写说明
3. 处理完成自动写入供应商风险看板
4. 根据差异率调整供应商风险等级

### 批量更新
1. 选择需要批量更新的记录
2. 选择更新字段和值
3. 预览更新范围和内容
4. 确认后执行批量更新
5. 失败记录显示字段级错误详情
