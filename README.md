# 青禾课程运营台

面向课程主理人的职场课程售卖与运营管理后台。

## 技术栈

- **后端**: Spring Boot 3.x + Java 17
- **前端**: React 18 + Ant Design 5 + TypeScript
- **数据库**: PostgreSQL 16
- **缓存**: Redis 7

## 项目结构

```
qinghe-course-platform/
├── backend/          # Spring Boot 后端
├── frontend/         # React 前端
├── docker-compose.yml
└── README.md
```

## 快速启动

```bash
# 1. 启动数据库和 Redis
docker-compose up -d

# 2. 启动后端
cd backend
./mvnw spring-boot:run

# 3. 启动前端
cd frontend
npm install
npm run dev
```

## 功能模块

### 学员端
- 课程购买
- 继续学习

### 运营端
- 班级配置
- 优惠管理
- 完课率统计与导出

### 列表管理
- 营期资料
- 作业点评
- 分销佣金
- 退款异常处理

### 操作面板
- 附件管理
- 备注记录
- 修改历史
- 状态流转（含处理人备注）

### 搜索筛选
- 关键字搜索
- 状态筛选
- 时间段筛选
