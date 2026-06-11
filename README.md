# 青禾课程运营台

面向课程主理人的职场课程售卖与运营管理后台。

## 技术栈

- **后端**: Spring Boot 3.x + Java 17 + Spring Data JPA + Spring Security + JWT
- **前端**: React 18 + Ant Design 5 + TypeScript + Vite + Zustand
- **数据库**: PostgreSQL 16
- **缓存**: Redis 7

## 项目结构

```
qinghe-course-platform/
├── backend/          # Spring Boot 后端
│   ├── src/main/java/com/qinghe/course/
│   │   ├── entity/        # 17个实体类
│   │   ├── repository/    # JPA Repository
│   │   ├── service/       # 业务服务层
│   │   ├── controller/    # REST API
│   │   ├── common/        # 通用封装
│   │   ├── config/        # 配置类
│   │   └── security/      # JWT 认证
│   └── pom.xml
├── frontend/         # React 前端
│   └── src/
│       ├── api/           # API 封装
│       ├── components/    # 通用组件
│       ├── pages/         # 页面
│       ├── store/         # 状态管理
│       └── utils/         # 工具
├── docker-compose.yml
└── README.md
```

## 快速启动

### 前置要求

- JDK 17+
- Maven 3.8+
- Node.js 18+
- Docker & Docker Compose

### 1. 启动基础设施（PostgreSQL + Redis）

```bash
docker-compose up -d
```

### 2. 启动后端

```bash
cd backend

# 方式一：使用系统 maven
mvn spring-boot:run

# 方式二：先生成 mvnw 再运行（推荐）
mvn wrapper:wrapper
./mvnw spring-boot:run
```

后端默认端口：`8080`，API 前缀：`/api`

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端默认地址：`http://localhost:5173`

## 默认账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 超级管理员 | `admin` | `admin123` | 运营后台全部权限 |
| 运营专员 | `operator` | `operator123` | 运营后台全部权限 |
| 学员 | `student` | `student123` | 学员端（购买课程、学习） |
| 学员 | `student2` | `student123` | 学员端 |

> 首次启动时会自动初始化以上账号和测试数据（课程、班级、订单、退款等）。

## 功能模块

### 学员端（STUDENT 角色）
- 课程购买（支持优惠券、选择班级）
- 继续学习（记录学时、查看进度）
- 我的订单

### 运营端（ADMIN / OPERATOR 角色）
- **课程管理**：课程 CRUD、状态管理
- **班级配置**：班级 CRUD、招生管理、讲师分配
- **优惠管理**：优惠券 CRUD、固定金额/折扣比例
- **完课率统计**：按班级统计、平均完课率、CSV 导出
- **营期资料**：资料上传下载、排序管理
- **作业点评**：作业提交、评分、点评意见
- **分销佣金**：佣金记录、结算管理
- **退款异常**：退款审核、异常提醒发送、**自动课时回写**

### 通用能力
- **操作面板**：每个业务对象支持 4 个标签页
  - 附件：上传下载
  - 备注：添加历史备注
  - 修改历史：字段变更记录
  - 状态流转：状态变更记录 + 处理人 + 备注
- **搜索筛选**：关键字 + 状态 + 时间段
- **安全认证**：JWT Token、角色权限控制

## 关键业务逻辑

### 退款异常处理流程
1. 用户提交退款申请
2. 系统记录当前已消耗课时
3. 超过 3 天未处理 → 自动标记为异常，发送提醒（定时任务每小时检查）
4. 运营审核通过 → **自动回写课时消耗数据** → 记录状态流转
5. 运营审核拒绝 → 记录拒绝原因

### 完课率计算
- 个人完课率 = 已学课时 / 总课时 × 100%
- 班级平均完课率 = 所有学员完课率的平均值
- 支持按班级查看详情和导出 CSV

## API 概览

| 模块 | 路径 | 说明 |
|------|------|------|
| 认证 | `/api/auth/*` | 登录、注册、获取当前用户 |
| 课程 | `/api/courses/*` | 课程 CRUD + 搜索 |
| 班级 | `/api/classes/*` | 班级 CRUD + 搜索 + 完课率 |
| 订单 | `/api/orders/*` | 订单列表、创建、支付 |
| 学习 | `/api/learning/*` | 学习进度、更新学时 |
| 优惠券 | `/api/coupons/*` | 优惠券 CRUD + 搜索 |
| 退款 | `/api/refunds/*` | 退款申请、审核、提醒 |
| 作业 | `/api/assignments/*` | 作业、提交、点评 |
| 分销 | `/api/distribution/*` | 佣金、结算 |
| 资料 | `/api/class-materials/*` | 营期资料 |
| 操作面板 | `/api/panel/*` | 附件/备注/历史/状态流 |
