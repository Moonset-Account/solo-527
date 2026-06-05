# 物业报修和巡检管理系统

## 技术栈
- **后端**: Spring Boot 2.7.18 + MyBatis-Plus 3.5.5 + Spring Security + JWT
- **数据库**: MySQL 8.0 + Redis
- **数据库迁移**: Flyway 9.22.3
- **前端**: Vue 3.4 + Vite 5.0 + Element Plus 2.4 + Pinia
- **其他**: HuTool 工具类库、Lombok

## 已修复的问题

1. ✅ **WorkOrderService 编译错误**: 移除 SpringContextUtil 调用，改为直接 @Autowired 注入 BuildingMapper
2. ✅ **V2 迁移脚本数据错误**:
   - 修复 BCrypt 密码哈希值（123456 对应正确加密值）
   - 修复工单表 NULL owner_id/room_id 问题
   - 修复 expense_record 表重复 expense_no 问题
3. ✅ **前端 OrderList.vue 构建错误**: 删除多余的 echarts 导入
4. ✅ **Java 版本兼容性**: 降级到 Spring Boot 2.7.18 兼容 Java 8 环境
5. ✅ **JWT API 兼容性**: 适配 JJWT 0.11.5 API

## 测试账号（密码统一为：123456）

| 角色 | 用户名 | 菜单权限 |
|------|--------|----------|
| 物业主管 | admin | 全部功能 |
| 物业人员 | property01 | 工单审核、费用登记 |
| 维修人员 | maint01 | 接单处理、上传照片 |
| 巡检人员 | inspector01 | 巡检打卡、异常上报 |
| 业主 | owner01 | 提交报修、验收评价 |

## 环境要求

- JDK 8+
- Maven 3.6+
- MySQL 8.0+
- Redis 6.0+
- Node.js 16+

## 快速开始

### 1. 数据库准备

```sql
-- 创建数据库
CREATE DATABASE property_management DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（可选）
CREATE USER 'property'@'%' IDENTIFIED BY 'property123';
GRANT ALL PRIVILEGES ON property_management.* TO 'property'@'%';
FLUSH PRIVILEGES;
```

### 2. 修改后端配置

编辑 `backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/property_management?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
    username: root
    password: your_password
  
  redis:
    host: localhost
    port: 6379
    password:
    database: 0
```

### 3. 启动后端

```bash
cd backend
mvn clean compile
mvn spring-boot:run
```

后端启动后访问: http://localhost:8080

Flyway 会自动执行 V1（建表）和 V2（初始化测试数据）脚本。

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端启动后访问: http://localhost:5173

## 核心功能模块

### 1. 在线报修
- 业主提交报修工单，选择报修类型、紧急程度、上传照片
- 系统自动生成工单号，关联业主和房间信息

### 2. 工单派发
- 物业人员审核工单，通过后派发给维修人员
- 支持驳回并填写驳回原因
- 紧急工单优先推送提醒

### 3. 巡检打卡
- 巡检人员按路线打卡巡检点
- 支持异常情况上报，生成异常工单
- 记录巡检轨迹和时间

### 4. 费用登记
- 物业登记维修材料和人工费用
- 业主查看并缴纳费用
- 支持多种支付方式记录

### 5. 回访评价
- 工单完成后业主进行满意度评价
- 支持星级评分和文字评价
- 评价结果计入维修人员绩效

### 6. 紧急工单提醒
- 通过 Redis 队列实现紧急工单优先处理
- 站内消息实时推送
- 关键节点自动通知相关人员

### 7. 关闭前照片校验
- 关闭工单前系统自动校验是否上传处理照片
- 未上传照片不允许关闭工单
- 确保维修质量可追溯

## 角色权限说明

### ADMIN（物业主管）
- 查看所有数据和报表
- 用户和角色管理
- 系统配置

### PROPERTY（物业人员）
- 工单审核和派发
- 费用登记和管理
- 查看业主信息

### MAINTENANCE（维修人员）
- 接收和处理工单
- 上传维修照片
- 完成维修并标记

### INSPECTOR（巡检人员）
- 执行巡检任务
- 打卡和异常上报
- 查看巡检历史

### OWNER（业主）
- 提交报修申请
- 查看工单进度
- 验收评价和缴费

## API 测试

后端启动后可访问 Swagger 文档（需配置）:
- http://localhost:8080/swagger-ui.html

### 登录接口示例
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

## 项目结构

```
backend/
├── src/main/java/com/property/
│   ├── common/          # 公共类（Result、枚举、上下文）
│   ├── config/          # 配置类（MyBatis-Plus、Redis、Security）
│   ├── controller/      # REST API 控制器
│   ├── entity/          # 实体类
│   ├── mapper/          # MyBatis Mapper
│   ├── security/        # 安全相关（JWT过滤器、认证入口）
│   ├── service/         # 业务服务层
│   └── utils/           # 工具类
frontend/
├── src/
│   ├── api/             # API 请求封装
│   ├── components/      # 公共组件
│   ├── router/          # 路由配置
│   ├── stores/          # Pinia 状态管理
│   ├── utils/           # 工具函数
│   ├── views/           # 页面组件
│   └── App.vue
```

## 常见问题

### 1. Maven 编译失败
- 检查 JDK 版本是否为 8+
- 确保 Maven settings.xml 配置了正确的镜像源
- 尝试删除 ~/.m2/repository 下的相关依赖重新下载

### 2. 数据库初始化失败
- 确保 MySQL 服务已启动
- 检查数据库连接配置是否正确
- 删除 flyway_schema_history 表后重新启动（开发环境）

### 3. Redis 连接失败
- 确保 Redis 服务已启动
- 检查 Redis 密码配置
- 测试 redis-cli ping 是否返回 PONG

### 4. 登录失败
- 确认 V2 迁移脚本是否成功执行
- 检查密码是否为 123456
- 查看控制台日志是否有具体错误信息

## 许可证

MIT License
