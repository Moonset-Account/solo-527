# 跨部门需求审批流系统

## 项目概述

跨部门需求审批流系统，用于管理企业内部跨部门的需求提交流程，实现需求提交、审批、协作效率追踪等一体化管理。

## 技术栈

### 后端
- **框架**: Spring Boot 3.2.0
- **数据库**: PostgreSQL
- **缓存**: Redis
- **安全**: Spring Security + JWT
- **ORM**: Spring Data JPA
- **导出**: Apache POI (Excel)

### 前端
- **框架**: React 18
- **构建工具**: Vite 5
- **UI组件**: Ant Design 5
- **路由**: React Router v6
- **状态管理**: Zustand
- **HTTP**: Axios

## 功能特性

### 核心功能
1. **需求管理**
   - 需求提交、编辑、删除
   - 需求分类、优先级管理
   - 需求负责人分配

2. **审批工作流**
   - 多节点审批流程
   - 节点通过/驳回操作
   - 节点卡住标记
   - 审批意见记录

3. **重复需求合并**
   - 自动检测相似需求
   - 一键合并重复需求

4. **延期管理**
   - 延期申请与记录
   - 责任部门标记
   - 延期原因跟踪

5. **协作效率查询**
   - 部门效率批量查询
   - 节点处理时长统计
   - 卡住节点监控

6. **导出功能**
   - 搜索结果导出 (Excel)
   - Redis 缓存去重，避免运营重复导出同一批数据

7. **权限控制**
   - 管理员 (ADMIN): 系统全局管理权限
   - 部门主管 (DEPT_MANAGER): 本部门需求管理与审批权限
   - 普通员工 (NORMAL): 提交和查看本人需求

8. **操作日志**
   - 全操作留痕
   - 节点卡住动作日志
   - 状态变更追踪

9. **搜索与排序**
   - 多条件筛选搜索
   - 多字段排序
   - 搜索结果可继续排序和导出

## 项目结构

```
.
├── backend/                 # 后端 Spring Boot 项目
│   ├── src/
│   │   └── main/
│   │       ├── java/com/approval/workflow/
│   │       │   ├── ApprovalWorkflowApplication.java
│   │       │   ├── config/          # 配置类
│   │       │   ├── controller/      # 控制器层
│   │       │   ├── service/         # 服务层
│   │       │   ├── repository/      # 数据访问层
│   │       │   ├── entity/          # 实体类
│   │       │   ├── dto/             # 数据传输对象
│   │       │   ├── enums/           # 枚举类
│   │       │   ├── security/        # 安全相关
│   │       │   ├── exception/       # 异常处理
│   │       │   └── util/            # 工具类
│   │       └── resources/
│   │           └── application.yml  # 应用配置
│   └── pom.xml
├── frontend/                # 前端 React 项目
│   ├── src/
│   │   ├── api/             # API 接口
│   │   ├── components/      # 公共组件
│   │   ├── layouts/         # 布局组件
│   │   ├── pages/           # 页面组件
│   │   ├── store/           # 状态管理
│   │   ├── utils/           # 工具函数
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── database/                # 数据库脚本
    └── init.sql
```

## 快速开始

### 环境要求
- JDK 17+
- Node.js 16+
- PostgreSQL 12+
- Redis 6+

### 数据库准备

1. 创建数据库
```sql
CREATE DATABASE approval_workflow;
```

2. 执行初始化脚本（可选，JPA会自动建表）
```bash
psql -d approval_workflow -f database/init.sql
```

### 后端启动

1. 进入后端目录
```bash
cd backend
```

2. 修改配置
编辑 `src/main/resources/application.yml`，配置数据库和 Redis 连接信息。

3. 启动应用
```bash
./mvnw spring-boot:run
```
或使用 Maven
```bash
mvn spring-boot:run
```

后端服务默认运行在 `http://localhost:8080/api`

### 前端启动

1. 进入前端目录
```bash
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

前端服务默认运行在 `http://localhost:3000`

### 默认账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | ADMIN | 系统管理员 |
| tech_manager | 123456 | DEPT_MANAGER | 技术部主管 |
| product_manager | 123456 | DEPT_MANAGER | 产品部主管 |
| operation_manager | 123456 | DEPT_MANAGER | 运营部主管 |
| zhangsan | 123456 | NORMAL | 普通员工（运营部） |
| lisi | 123456 | NORMAL | 普通员工（技术部） |

## API 接口

### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册

### 需求管理
- `GET /api/requirements/{id}` - 获取需求详情
- `POST /api/requirements` - 创建需求
- `PUT /api/requirements/{id}` - 更新需求
- `POST /api/requirements/search` - 搜索需求
- `POST /api/requirements/{id}/submit` - 提交审批
- `POST /api/requirements/{id}/assign` - 分配负责人
- `POST /api/requirements/merge` - 合并需求
- `POST /api/requirements/{id}/close` - 关闭需求
- `GET /api/requirements/{id}/duplicates` - 获取相似需求

### 审批节点
- `GET /api/requirements/{id}/nodes` - 获取审批节点
- `POST /api/requirements/nodes/{nodeId}/approve` - 通过节点
- `POST /api/requirements/nodes/{nodeId}/reject` - 驳回节点
- `POST /api/requirements/nodes/{nodeId}/stuck` - 标记卡住

### 部门管理
- `GET /api/departments` - 获取部门列表
- `POST /api/departments` - 创建部门
- `PUT /api/departments/{id}` - 更新部门

### 延期管理
- `POST /api/delays` - 创建延期记录
- `GET /api/delays/requirement/{id}` - 获取需求延期记录
- `POST /api/delays/search` - 搜索延期记录
- `POST /api/delays/batch` - 按部门批量查询
- `POST /api/delays/stats` - 延期统计

### 统计分析
- `GET /api/statistics/overview` - 总览统计
- `GET /api/statistics/dept/{id}` - 部门统计
- `POST /api/statistics/dept/batch` - 多部门批量统计
- `GET /api/statistics/user/{id}` - 用户统计

### 导出
- `POST /api/export/requirements` - 导出需求
- `POST /api/export/requirements/batch` - 按ID批量导出
- `POST /api/export/check-duplicate` - 检查是否已导出

### 操作日志
- `GET /api/operation-logs` - 获取所有日志
- `GET /api/operation-logs/requirement/{id}` - 获取需求日志
- `GET /api/operation-logs/type/{type}` - 按类型获取日志
- `GET /api/operation-logs/operator/{id}` - 按操作人获取日志

## 核心设计说明

### 工作流设计
- 工作流定义包含多个节点，按顺序执行
- 每个节点可分配到具体用户、部门或角色
- 支持节点通过、驳回、跳过、卡住状态

### 权限设计
- 管理员：拥有所有权限
- 部门主管：可管理本部门需求，审批对应节点
- 普通员工：可提交需求，查看自己的需求

### 导出去重机制
- 使用 Redis 缓存导出记录
- 根据查询条件生成唯一键
- 同一筛选条件的数据在 TTL 内只能导出一次
- 可通过 check-duplicate 接口提前检查

### 操作日志
- 所有关键操作均记录日志
- 记录操作前后状态
- 支持按需求、操作人、类型等多维度查询

## 开发说明

### 后端开发
- 遵循 MVC 三层架构
- 使用 JPA 进行数据持久化
- 使用 Specification 实现动态查询
- 全局异常统一处理

### 前端开发
- 使用函数式组件 + Hooks
- 使用 Zustand 进行状态管理
- 页面组件与业务逻辑分离
- 响应式设计
