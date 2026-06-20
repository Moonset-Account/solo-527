# 装修线索客户画像库系统

## 项目简介
基于 Spring Boot + React + PostgreSQL + Redis 的装修线索客户管理系统，包含客户画像、销售漏斗、公海池、异常记录等功能。

## 技术栈

### 后端
- Spring Boot 3.2.0
- Spring Security + JWT
- MyBatis-Plus 3.5.5
- PostgreSQL
- Redis
- Lombok

### 前端
- React 18
- React Router 6
- Ant Design 5
- Zustand (状态管理)
- Axios
- Day.js
- Vite

## 项目结构

```
work-0363/
├── backend/                    # 后端项目
│   ├── src/main/java/com/decoration/crm/
│   │   ├── config/            # 配置类
│   │   ├── controller/        # 控制器
│   │   ├── dto/               # 数据传输对象
│   │   ├── entity/            # 实体类
│   │   ├── mapper/            # Mapper接口
│   │   ├── security/          # 安全相关
│   │   ├── service/           # 服务层
│   │   ├── service/impl/      # 服务实现
│   │   ├── util/              # 工具类
│   │   └── exception/         # 异常处理
│   └── src/main/resources/
│       ├── application.yml    # 应用配置
│       └── mapper/            # MyBatis映射文件
├── frontend/                   # 前端项目
│   ├── src/
│   │   ├── api/               # API接口
│   │   ├── components/        # 公共组件
│   │   ├── pages/             # 页面
│   │   │   └── admin/         # 管理端页面
│   │   ├── store/             # 状态管理
│   │   ├── utils/             # 工具函数
│   │   ├── styles/            # 样式
│   │   ├── App.jsx            # 应用入口
│   │   └── main.jsx           # 渲染入口
│   └── package.json
└── database/
    └── schema.sql             # 数据库脚本
```

## 功能模块

### 1. 用户认证与权限
- 登录/登出
- JWT Token认证
- 角色权限（ADMIN/SALES/DESIGNER/MANAGER）
- Redis Token存储

### 2. 线索客户管理
- 线索列表（支持搜索、筛选）
- 线索详情
- 新增/编辑/删除线索
- 客户画像（标签、等级、状态）
- 负责人分配

### 3. 标签管理
- 标签CRUD
- 标签分类
- 标签颜色

### 4. 报价版本管理
- 多版本报价
- 当前版本标记
- 报价详情

### 5. 公海池
- 公海线索列表
- 领取线索
- 公海规则配置

### 6. 流失原因管理
- 流失原因CRUD
- 分类管理
- 启用/禁用

### 7. 跟进记录
- 跟进记录列表
- 添加跟进
- 下次跟进时间

### 8. 备注与附件
- 备注管理
- 附件上传/下载
- 修改历史

### 9. 销售漏斗看板
- 数据统计
- 销售漏斗图
- 转化率展示

### 10. 异常记录
- 异常列表
- 异常处理
- 超时原因记录
- 处理耗时统计
- 责任人管理

### 11. 用户管理
- 用户CRUD
- 角色分配
- 状态管理

## 快速开始

### 环境要求
- JDK 17+
- Node.js 16+
- PostgreSQL 12+
- Redis 6+
- Maven 3.6+

### 数据库准备

1. 创建数据库
```sql
CREATE DATABASE decoration_crm;
```

2. 执行数据库脚本
```bash
psql -U postgres -d decoration_crm -f database/schema.sql
```

### 后端启动

1. 配置数据库和Redis连接
编辑 `backend/src/main/resources/application.yml`

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/decoration_crm
    username: postgres
    password: your_password
  data:
    redis:
      host: localhost
      port: 6379
      password: your_password
```

2. 启动应用
```bash
cd backend
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080/api` 启动

### 前端启动

1. 安装依赖
```bash
cd frontend
npm install
```

2. 启动开发服务器
```bash
npm run dev
```

前端服务将在 `http://localhost:3000` 启动

### 默认账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | 123456 | ADMIN | 系统管理员 |
| sales1 | 123456 | SALES | 销售张三 |
| sales2 | 123456 | SALES | 销售李四 |
| designer1 | 123456 | DESIGNER | 设计师王五 |
| manager1 | 123456 | MANAGER | 经理赵六 |

> 注意：首次启动时，DataInitializer 会自动重置 admin 用户的密码为 123456

## API接口

### 认证相关
- POST /api/auth/login - 登录
- POST /api/auth/logout - 登出
- GET /api/auth/me - 获取当前用户

### 线索相关
- GET /api/leads - 线索列表
- GET /api/leads/{id} - 线索详情
- POST /api/leads - 创建线索
- PUT /api/leads/{id} - 更新线索
- DELETE /api/leads/{id} - 删除线索
- PUT /api/leads/{id}/owner - 分配负责人
- PUT /api/leads/{id}/level - 更新等级
- PUT /api/leads/{id}/status - 更新状态
- GET /api/leads/{id}/tags - 获取标签
- POST /api/leads/{id}/tags - 添加标签
- DELETE /api/leads/{id}/tags - 移除标签
- POST /api/leads/{id}/claim - 从公海领取
- POST /api/leads/{id}/release - 释放到公海
- POST /api/leads/{id}/lost - 标记流失

### 其他接口
- 标签管理: /api/tags
- 报价版本: /api/quotations
- 流失原因: /api/lost-reasons
- 公海规则: /api/public-sea-rules
- 备注: /api/remarks
- 附件: /api/attachments
- 修改历史: /api/change-logs
- 跟进记录: /api/follow-ups
- 异常记录: /api/exceptions
- 看板: /api/dashboard
- 用户: /api/users

## 角色权限说明

| 功能 | ADMIN | MANAGER | SALES | DESIGNER |
|------|-------|---------|-------|----------|
| 查看线索 | ✓ | ✓ | ✓ | ✓ |
| 创建线索 | ✓ | ✓ | ✓ | - |
| 编辑线索 | ✓ | ✓ | ✓ | - |
| 删除线索 | ✓ | ✓ | - | - |
| 分配负责人 | ✓ | ✓ | - | - |
| 标签管理 | ✓ | ✓ | - | - |
| 用户管理 | ✓ | - | - | - |
| 公海规则管理 | ✓ | ✓ | - | - |
| 流失原因管理 | ✓ | ✓ | - | - |
| 看板数据 | ✓ | ✓ | ✓ | ✓ |
| 异常处理 | ✓ | ✓ | - | - |
