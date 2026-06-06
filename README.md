# 陶瓷工作室窑炉排烧平台

## 技术栈
- 后端：Spring Boot 3.2 + JPA + PostgreSQL + Spring Security + JWT
- 前端：React 18 + Ant Design 5 + Vite
- 数据库迁移：Flyway

## 项目结构
```
question-098/
├── backend/                    # Spring Boot 后端
│   ├── src/main/java/com/ceramic/kiln/
│   │   ├── entity/            # 实体类
│   │   ├── repository/        # 数据访问层
│   │   ├── service/           # 业务逻辑层
│   │   ├── controller/        # REST API 控制器
│   │   ├── dto/               # 数据传输对象
│   │   ├── security/          # 安全认证
│   │   ├── exception/         # 异常处理
│   │   └── config/            # 配置类
│   └── src/main/resources/
│       ├── db/migration/      # Flyway 数据库迁移脚本
│       └── application.yml    # 应用配置
└── frontend/                  # React 前端
    ├── src/
    │   ├── pages/             # 页面组件
    │   ├── components/        # 公共组件
    │   ├── api/               # API 封装
    │   └── styles/            # 样式
    └── package.json
```

## 快速启动

### 1. 数据库准备
```sql
CREATE DATABASE ceramic_kiln;
```

### 2. 启动后端
```bash
cd backend
mvn spring-boot:run
```
后端默认端口：8080

### 3. 启动前端
```bash
cd frontend
npm install
npm run dev
```
前端默认端口：3000

### 默认账号
- 用户名：admin
- 密码：admin

## 核心模块

### 1. 作品登记
- 外部人员通过 `/external/submit` 提交作品（仅填写必要信息）
- 内部人员审核、备注、派发
- 支持状态流转：待审核 → 已审核 → 已排窑 → 已出窑

### 2. 窑次编排
- 创建窑次，指定窑炉、温区、烧成曲线
- 审批/撤回窑次
- 安排作品入窑，自动校验温区冲突
- 窑次容量管理

### 3. 曲线模板
- 低温/中温/高温烧成曲线管理
- 支持 JSON 格式的曲线段数据

### 4. 出窑记录
- 记录出窑质量状态
- 上传出窑照片，关联学员作品
- 照片按作品维度查看

### 5. 破损赔付
- 破损登记，关联作品和学员
- 赔付类型：重制/退款/折扣
- 审批流程

### 6. 筛选条件保存
- 所有列表页支持保存自定义筛选条件
- 支持设置默认筛选
- 按用户隔离

## 核心业务规则

### 温区冲突校验
- 作品入窑时检查泥料温区与窑次温区是否一致
- 检查釉料温区与窑次温区是否一致
- 不一致时抛出 `TEMPERATURE_ZONE_CONFLICT` 异常

### 状态流转控制
- 草稿 → 已审批（窑次）
- 已审批 → 烧制中 → 已完成（窑次）
- 只有已审批的窑次才能安排作品
- 烧制中的窑次不能撤回

## 验收测试路径

### 路径1：新增（验证API权限和参数校验）
```bash
# 外部人员提交作品（无需登录）
curl -X POST http://localhost:8080/api/external/artworks \
  -H "Content-Type: application/json" \
  -d '{"studentName":"测试学员","studentPhone":"13800000000","clayCode":"CLAY_ZS","name":"测试花瓶"}'

# 内部用户登录获取token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# 未登录访问内部API（应该返回401）
curl -X GET http://localhost:8080/api/artworks
```

### 路径2：审批（验证状态流转和权限）
```bash
# 创建窑次（内部）
curl -X POST http://localhost:8080/api/kiln-runs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"kilnId":1,"firingCurveId":1,"temperatureZone":"HIGH","maxCapacity":50}'

# 审批窑次
curl -X POST http://localhost:8080/api/kiln-runs/{id}/approve \
  -H "Authorization: Bearer <token>"

# 审核作品
curl -X POST http://localhost:8080/api/artworks/{id}/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"pass":true,"notes":"审核通过"}'
```

### 路径3：撤回（验证反向操作和约束）
```bash
# 撤回窑次（应该清空已安排的作品）
curl -X POST http://localhost:8080/api/kiln-runs/{id}/withdraw \
  -H "Authorization: Bearer <token>"

# 从窑次中撤回单个作品
curl -X POST http://localhost:8080/api/artworks/{id}/withdraw \
  -H "Authorization: Bearer <token>"

# 温区冲突测试（尝试安排不同温区的作品入窑，应该返回错误）
curl -X POST "http://localhost:8080/api/artworks/{id}/assign?kilnRunId={高温窑次ID}" \
  -H "Authorization: Bearer <token>"
```

### 路径4：导出（验证导出功能和索引）
```bash
# 导出窑次作品清单（Excel）
curl -X GET http://localhost:8080/api/kiln-runs/{id}/export \
  -H "Authorization: Bearer <token>" \
  -o kiln_run_export.xlsx

# 验证分页查询（使用索引）
curl -X GET "http://localhost:8080/api/artworks?status=SUBMITTED&page=0&size=20" \
  -H "Authorization: Bearer <token>"
```

## 数据库索引说明
所有核心查询字段已建立索引：
- 作品：status, student_id, kiln_run_id, submission_source
- 窑次：status, temperature_zone, kiln_id, scheduled_start_time
- 出窑记录：kiln_run_id, artwork_id, quality_status
- 破损赔付：status, student_id, artwork_id
- 筛选条件：user_id + page_name 联合索引
