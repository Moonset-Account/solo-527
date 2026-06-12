# 财务费用申请审批流平台

## 项目简介

财务费用申请审批流平台是一个企业级的费用报销审批管理系统，旨在实现企业费用申请、审批、管理的全流程数字化。平台支持多级审批流程、灵活的规则配置、全面的审计追踪，帮助企业提升财务管理效率，降低运营成本。

## 技术栈

| 层级         | 技术栈                          | 版本   |
|--------------|---------------------------------|--------|
| 后端框架     | Spring Boot                     | 3.2.x  |
| 前端框架     | React                           | 18.x   |
| 数据库       | PostgreSQL                      | 15.x   |
| 缓存中间件   | Redis                           | 7.x    |
| 构建工具     | Maven / Vite                    | -      |
| 安全框架     | Spring Security + JWT           | -      |
| ORM框架      | Spring Data JPA                 | -      |
| 容器化       | Docker + Docker Compose         | -      |

## 功能特性

### 前台功能
- **费用申请提交**：支持多种费用类型申请，表单字段动态配置
- **附件上传**：支持多附件上传，格式校验，大小限制
- **我的申请**：查看本人提交的所有申请，实时追踪审批进度
- **历史记录**：完整的审批历史查看，包括每个节点的审批意见

### 后台功能
- **审批规则配置**：灵活配置审批流程、条件分支、审批人规则
- **额度管理**：按职位、部门、费用类型设置不同的审批额度
- **审批效率提醒**：超时自动提醒，审批效率统计分析
- **筛选功能**：多维度组合筛选，快速定位申请单

### 配置页功能
- **附件配置**：配置允许上传的文件类型、大小限制、数量限制
- **退回原因配置**：预设常用退回原因，支持自定义
- **资源占用配置**：配置系统资源阈值，监控系统运行状态
- **口径变更说明**：记录业务口径变更历史，便于追溯

### 异常处理
- **节点超时监控**：实时监控审批节点，超时自动预警
- **影响对象展示**：清晰展示超时节点影响的申请人和审批人
- **处理时限**：按节点类型配置不同的处理时限要求

### 权限控制
- **角色权限**：按角色区分功能权限和数据权限
- **权限粒度**：支持菜单级、按钮级、数据级权限控制

### 审计追踪
- **操作日志**：记录所有关键操作，包括操作人、操作时间、操作内容
- **数据变更**：追踪重要数据字段的变更历史
- **登录审计**：记录用户登录信息，包括IP、时间、设备

## 角色说明

| 角色             | 角色编码       | 职责说明                                                     |
|------------------|----------------|--------------------------------------------------------------|
| 系统管理员       | ADMIN          | 系统配置、用户管理、规则配置、数据维护、审计日志查看         |
| 财务经理         | FINANCE_MANAGER | 审批规则制定、额度管理、报表统计、超权限申请审批             |
| 审批人           | APPROVER       | 处理待审批申请，查看审批历史，审批意见填写                   |
| 申请人           | APPLICANT      | 提交费用申请，查看申请进度，补充材料，查看历史申请           |

## 快速开始

### Docker方式启动

1. 克隆项目到本地
```bash
git clone <repository-url>
cd work-0040
```

2. 启动所有服务
```bash
docker-compose up -d
```

3. 等待服务启动完成后访问：
- 前台地址：http://localhost:3000
- 后台地址：http://localhost:3000/admin
- API文档：http://localhost:8080/swagger-ui.html

4. 停止服务
```bash
docker-compose down
```

### 本地开发方式启动

#### 前置要求
- JDK 17+
- Node.js 18+
- Maven 3.8+
- PostgreSQL 15
- Redis 7

#### 后端启动

1. 进入后端目录
```bash
cd backend
```

2. 修改数据库配置（`src/main/resources/application.yml`）
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/finance_approval
    username: postgres
    password: your_password
  data:
    redis:
      host: localhost
      port: 6379
```

3. 编译并启动
```bash
mvn clean install
mvn spring-boot:run
```

后端服务将在 http://localhost:8080 启动

#### 前端启动

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

前端服务将在 http://localhost:3000 启动

## 默认账号密码

| 用户名       | 密码      | 角色             |
|--------------|-----------|------------------|
| admin        | admin123  | 系统管理员       |
| finance      | finance123| 财务经理         |
| approver     | approve123| 审批人           |
| applicant    | apply123  | 申请人           |

> **注意**：生产环境请务必修改默认密码！

## 项目结构说明

```
work-0040/
├── backend/                    # 后端项目
│   ├── src/
│   │   └── main/
│   │       ├── java/com/finance/approval/
│   │       │   ├── audit/         # 审计切面
│   │       │   ├── config/        # 配置类
│   │       │   ├── controller/    # 控制层
│   │       │   ├── dto/           # 数据传输对象
│   │       │   ├── entity/        # 实体类
│   │       │   ├── enums/         # 枚举类
│   │       │   ├── exception/     # 异常处理
│   │       │   ├── repository/    # 数据访问层
│   │       │   ├── security/      # 安全相关
│   │       │   ├── service/       # 业务逻辑层
│   │       │   └── util/          # 工具类
│   │       └── resources/
│   │           └── application.yml
│   └── pom.xml
├── frontend/                   # 前端项目
│   ├── src/
│   │   ├── api/                 # API接口
│   │   ├── components/          # 公共组件
│   │   ├── layouts/             # 布局组件
│   │   ├── pages/               # 页面组件
│   │   ├── router/              # 路由配置
│   │   ├── store/               # 状态管理
│   │   ├── types/               # TypeScript类型
│   │   └── utils/               # 工具函数
│   ├── package.json
│   └── vite.config.ts
├── docs/                       # 项目文档
│   ├── DEPLOYMENT.md           # 部署文档
│   ├── API_GUIDE.md            # API接口文档
│   ├── DATABASE.md             # 数据库设计文档
│   └── SECURITY.md             # 安全设计说明
├── docker-compose.yml          # Docker Compose配置
├── .gitignore                  # Git忽略文件
└── README.md                   # 项目说明
```

## API文档访问地址

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs
- **详细API文档**: 请参考 [docs/API_GUIDE.md](docs/API_GUIDE.md)

## 许可证

MIT License

Copyright (c) 2024 财务费用申请审批流平台

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
