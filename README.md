# 健身房私教课管理系统

基于 Spring Boot + React 的中小型健身房私教课管理系统，专为健身房合伙人、前台、教练打造，解决私教课包、团课、会员冻结混在Excel里容易算错的问题。

## 功能特性

### 核心业务
- **会员管理**: 会员档案、体测记录、剩余课时追踪、会员二维码
- **教练管理**: 教练档案、专长、级别、业绩统计（教练只能看自己的）
- **课包管理**: 私教课包、团课课包、价格配置、有效期管理
- **团课管理**: 团课排期、名额限制、预约情况
- **预约排班**: 私教课/团课预约、时间冲突检测、扫码签到
- **课时扣减**: 上课完成自动扣减课时，记录可追溯
- **请假冻结**: 会员冻结申请、冻结期间无法预约、自动解冻
- **续费漏斗**: 课时不足会员预警、续费率统计
- **会员提醒**: 课前自动提醒、到期提醒、续费提醒

### 管理后台
- **数据看板**: 实时统计、教练业绩排行、超时预警、资源空闲状态
- **权限控制**: RBAC 角色权限（管理员/店长/教练/前台/会员）
- **统一校验**: 所有操作在后台统一校验，避免前台算错

### 移动端支持
- **响应式表单**: 适配手机端的预约、签到表单
- **扫码功能**: 扫码查询会员、扫码签到
- **拍照上传**: 体测照片、凭证拍照上传
- **离线支持**: 离线保存预约记录，联网后自动同步补提交

### 基础设施
- **登录鉴权**: JWT Token 认证，支持多端登录
- **表单校验**: 前后端双重校验
- **后台任务**: 定时提醒、自动标记旷课、过期状态更新
- **消息通知**: 系统内通知，可扩展短信/微信
- **文件上传**: 图片、文档上传存储
- **Docker 部署**: 一键容器化部署
- **基础监控**: Actuator + Prometheus 指标监控

## 技术栈

### 后端
- Spring Boot 3.2
- Spring Security + JWT
- Spring Data JPA
- MySQL 8.0 / H2 (开发)
- Redis (缓存)
- Lombok
- SpringDoc OpenAPI

### 前端
- React 18 + TypeScript
- Vite
- Ant Design 5
- React Router
- Zustand (状态管理)
- Axios
- Recharts (图表)
- Day.js

## 快速开始

### 方式一: Docker 一键启动 (推荐)

```bash
docker-compose up -d
```

访问:
- 前端: http://localhost
- 后端API: http://localhost:8080/api
- Swagger文档: http://localhost:8080/api/swagger-ui.html
- 监控面板: http://localhost:9090

### 方式二: 本地开发

#### 启动后端

```bash
cd backend
mvn spring-boot:run
```

后端运行在 http://localhost:8080

#### 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 http://localhost:3000

## 默认账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | 系统管理员 | 全部权限 |
| manager | manager123 | 店长/合伙人 | 查看所有数据、报表 |
| coach1 | coach123 | 教练 | 只能看自己的预约和业绩 |
| coach2 | coach123 | 教练 | 只能看自己的预约和业绩 |
| reception | reception123 | 前台 | 会员管理、预约操作 |

## 权限矩阵

| 功能 | 管理员 | 店长 | 教练 | 前台 |
|------|--------|------|------|------|
| 数据看板 | ✅ | ✅ | ❌ | ❌ |
| 会员管理 | ✅ | ✅ | ✅(只读) | ✅ |
| 预约管理 | ✅ | ✅ | ✅(自己的) | ✅ |
| 教练管理 | ✅ | ✅ | ❌ | ❌ |
| 业绩统计 | ✅ | ✅ | ✅(仅自己) | ❌ |
| 系统配置 | ✅ | ❌ | ❌ | ❌ |

## 核心业务流程

### 预约流程
1. 前台/教练查询会员（手机号/扫码）
2. 查看会员剩余课时
3. 选择教练、时间、课包
4. 系统校验：会员状态非冻结、课时充足、教练时间不冲突
5. 创建预约成功，发送通知
6. 上课前自动提醒会员
7. 到店扫码签到
8. 课程完成，自动扣减课时

### 会员冻结流程
1. 提交冻结申请（开始/结束日期、原因）
2. 冻结期间：会员状态变为 FROZEN，无法预约
3. 系统每日检查，到期自动解冻
4. 解冻后恢复正常预约

### 课时扣减规则
- 课程状态变为「已完成」时自动扣减
- 取消预约不扣减（团课需提前一定时间）
- 所有扣减记录可追溯，对应具体预约

## 项目结构

```
.
├── backend/                 # 后端 Spring Boot 项目
│   ├── src/main/java/com/gym/
│   │   ├── common/          # 公共模块（枚举、实体基类、安全、响应、异常）
│   │   ├── config/          # 配置类（安全、数据初始化）
│   │   ├── entity/          # JPA 实体
│   │   ├── repository/      # 数据访问层
│   │   ├── service/         # 业务逻辑层
│   │   ├── controller/      # 控制器
│   │   └── task/            # 定时任务
│   └── pom.xml
├── frontend/                # 前端 React 项目
│   ├── src/
│   │   ├── api/             # API 封装
│   │   ├── pages/           # 页面组件
│   │   ├── layouts/         # 布局组件
│   │   ├── store/           # 状态管理
│   │   └── ...
│   └── package.json
├── monitoring/              # 监控配置
│   └── prometheus.yml
└── docker-compose.yml       # Docker 编排
```

## API 设计

所有 API 统一前缀 `/api`，响应格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

主要接口：
- `POST /auth/login` - 登录
- `GET /dashboard/stats` - 看板数据
- `GET/POST/PUT /members` - 会员管理
- `GET/POST/PUT /bookings` - 预约管理
- `POST /files/upload` - 文件上传

## 移动端访问

- 管理后台: 响应式设计，手机浏览器可直接访问
- 快速预约页: `/m/booking` 专门为前台移动端优化
- 离线模式: 断网时预约数据保存到 localStorage，联网自动同步

## 监控

- Health Check: `/api/actuator/health`
- 指标: `/api/actuator/metrics`
- Prometheus: `/api/actuator/prometheus`

## 开发说明

### 新增业务模块
1. entity 包下创建实体类，继承 BaseEntity
2. repository 包下创建 Repository 接口
3. service 包下创建业务逻辑
4. controller 包下创建 API 接口，添加权限注解

### 新增权限角色
1. 在 RoleEnum 中添加角色枚举
2. 在 DataInitializer 中初始化对应账号
3. Controller 上使用 `@PreAuthorize` 注解控制权限

## License

MIT
