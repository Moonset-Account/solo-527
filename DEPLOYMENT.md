# 家电维修服务下单系统 - 部署与运维指南

## 目录
1. [环境要求](#环境要求)
2. [快速部署](#快速部署)
3. [环境变量说明](#环境变量说明)
4. [数据库初始化](#数据库初始化)
5. [生产部署](#生产部署)
6. [配置管理规范](#配置管理规范)
7. [数据统计说明](#数据统计说明)
8. [常见问题](#常见问题)

---

## 环境要求

### 软件版本
- **Node.js**: >= 20.0.0
- **PostgreSQL**: >= 14.0
- **Redis**: >= 6.0
- **Nginx**: >= 1.18（生产环境）

### 服务器最低配置
- CPU: 2 核
- 内存: 4 GB
- 硬盘: 40 GB SSD

---

## 快速部署

### 1. 克隆项目
```bash
git clone <repository-url>
cd appliance-repair-system
```

### 2. 后端配置
```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，配置数据库、Redis 等信息

# 安装依赖
npm install

# 运行数据库迁移
node ace migration:run

# 启动开发服务器
npm run dev
```

### 3. 前端配置
```bash
cd frontend
cp .env.example .env
# 编辑 .env 文件，配置 API 地址等

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

---

## 环境变量说明

### 后端环境变量 (.env)

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `PORT` | 否 | 3333 | 服务监听端口 |
| `HOST` | 否 | 0.0.0.0 | 服务监听地址 |
| `NODE_ENV` | 是 | development | 运行环境：development/production/test |
| `APP_KEY` | 是 | - | 应用密钥，用于加密 session 等 |
| `LOG_LEVEL` | 否 | info | 日志级别：fatal/error/warn/info/debug/trace |
| `DRIVE_DISK` | 否 | local | 文件存储驱动 |

**数据库配置**

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `DB_CONNECTION` | 是 | pg | 数据库连接类型，固定为 pg |
| `PG_HOST` | 是 | localhost | PostgreSQL 主机地址 |
| `PG_PORT` | 否 | 5432 | PostgreSQL 端口 |
| `PG_USER` | 是 | postgres | PostgreSQL 用户名 |
| `PG_PASSWORD` | 否 | - | PostgreSQL 密码 |
| `PG_DB_NAME` | 是 | - | 数据库名 |

**Redis 配置**

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `REDIS_CONNECTION` | 是 | local | Redis 连接名 |
| `REDIS_HOST` | 是 | 127.0.0.1 | Redis 主机地址 |
| `REDIS_PORT` | 否 | 6379 | Redis 端口 |
| `REDIS_PASSWORD` | 否 | - | Redis 密码 |

**功能开关**

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `ENABLE_DEMO_DATA` | 否 | false | **重要**：是否启用演示数据。生产环境必须设为 false！ |
| `SESSION_DRIVER` | 是 | redis | Session 存储驱动 |
| `CORS_ORIGIN` | 否 | * | 允许的跨域域名，多个用逗号分隔 |

**业务配置**

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `UPLOAD_MAX_SIZE` | 否 | 10mb | 单文件最大大小 |
| `UPLOAD_MAX_FILES` | 否 | 5 | 最大上传文件数 |
| `DEFAULT_SERVICE_AREA` | 否 | 全市 | 默认服务区域 |
| `ADMIN_EMAIL` | 否 | - | 初始管理员邮箱 |
| `ADMIN_PASSWORD` | 否 | - | 初始管理员密码 |

### 前端环境变量 (.env)

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `VITE_API_BASE_URL` | 是 | - | 后端 API 基础地址 |
| `VITE_APP_TITLE` | 否 | 家电维修服务平台 | 应用标题 |
| `VITE_DEMO_MODE` | 否 | false | **重要**：是否启用演示模式。生产环境必须设为 false！ |
| `VITE_UPLOAD_PREFIX` | 否 | - | 文件访问前缀 |

---

## 数据库初始化

### 创建数据库
```sql
-- 登录 PostgreSQL
psql -U postgres

-- 创建数据库
CREATE DATABASE appliance_repair;

-- 创建用户（可选）
CREATE USER repair_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE appliance_repair TO repair_user;
```

### 运行迁移
```bash
cd backend
node ace migration:run
```

### 回滚迁移
```bash
# 回滚最后一批
node ace migration:rollback

# 回滚所有
node ace migration:reset
```

### 查看迁移状态
```bash
node ace migration:status
```

---

## 生产部署

### 1. 后端部署

#### 构建项目
```bash
cd backend
npm run build
```

#### 使用 PM2 启动
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start build/bin/server.js --name repair-backend

# 查看状态
pm2 status

# 查看日志
pm2 logs repair-backend

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

#### PM2 配置文件 (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'repair-backend',
    script: './build/bin/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3333,
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_memory_restart: '500M',
  }]
}
```

### 2. 前端部署

#### 构建项目
```bash
cd frontend
npm run build
```

#### Nginx 配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/repair-frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:3333/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 上传文件
    location /uploads/ {
        alias /var/www/repair-backend/storage/app/public/;
        expires 30d;
    }
}
```

---

## 配置管理规范

### 配置项分类

系统配置通过 `configs` 表管理，分为以下几类：

1. **基础配置**
   - `system.name` - 系统名称
   - `system.service_hotline` - 服务热线
   - `system.work_start_time` - 上班时间
   - `system.work_end_time` - 下班时间

2. **价格配置**
   - `price.base_fee` - 基础上门费
   - `price.inspection_fee` - 检测费
   - `price.emergency_surcharge` - 紧急服务加价

3. **订单配置**
   - `order.auto_cancel_hours` - 自动取消小时数
   - `order.max_daily_per_technician` - 师傅每日最大单量
   - `order.remind_minutes_before` - 提前提醒分钟数

4. **统计配置**
   - `stats.late_threshold_minutes` - 迟到判定阈值（分钟）
   - `stats.repurchase_days` - 复购判定天数

### 配置变更流程

1. **变更前**
   - 评估变更影响范围
   - 准备变更说明（必填）
   - 如需回滚方案，提前准备

2. **变更时**
   - 在「系统配置」页面修改配置
   - 填写**变更原因**（必填）
   - 系统自动记录：修改人、旧值、新值、变更时间

3. **变更后**
   - 验证配置生效
   - 观察相关数据是否正常
   - 如有异常，通过「变更历史」回滚

### 配置变更历史查看

路径：管理后台 → 系统配置 → 变更历史

可筛选：
- 按配置项筛选
- 按操作人筛选
- 按时间范围筛选

---

## 数据统计说明

### 演示数据隔离

**重要原则：正式统计不读取演示样例数据**

- 所有订单都有 `is_demo` 标记
- `ENABLE_DEMO_DATA=true` 时创建的订单会自动标记为演示数据
- 所有统计接口自动排除 `is_demo=true` 的记录
- 管理后台统计数据均为真实业务数据

### 师傅负载统计

**不只是看总数，支持多维度分析：**

1. **按日统计**
   - 每日每位师傅的订单量
   - 与日单量上限对比
   - 可识别负载过高/过低的师傅

2. **按周统计**
   - 每周每位师傅的订单量
   - 周内订单分布情况
   - 用于排班参考

3. **按月统计**
   - 每月每位师傅的订单量
   - 月度绩效参考
   - 人员配置调整依据

**统计路径**：管理后台 → 统计分析 → 师傅负载

### 复购率统计

**支持多维度拆分：**

1. **按日期**
   - 每日复购率趋势
   - 识别复购高峰时段

2. **按渠道**
   - 社区运营渠道复购率
   - 线上推广渠道复购率
   - 老客户推荐复购率
   - 用于评估各渠道质量

3. **按社区**
   - 各社区复购率排名
   - 社区运营效果评估
   - 重点社区识别

**统计路径**：管理后台 → 统计分析 → 复购统计

### 迟到原因统计

- 各迟到原因出现频次
- 占比分析
- 对应师傅分布
- 用于针对性改进

**统计路径**：管理后台 → 统计分析 → 迟到原因

---

## 常见问题

### 1. 忘记管理员密码怎么办？
```bash
# 使用 ace 命令重置密码（需根据实际情况实现）
node ace reset:admin-password
```

### 2. 如何清理演示数据？
```sql
-- 删除演示订单及相关数据
DELETE FROM order_logs WHERE order_id IN (SELECT id FROM orders WHERE is_demo = true);
DELETE FROM order_evaluations WHERE order_id IN (SELECT id FROM orders WHERE is_demo = true);
DELETE FROM attendance_records WHERE order_id IN (SELECT id FROM orders WHERE is_demo = true);
DELETE FROM orders WHERE is_demo = true;
```

### 3. 上传文件大小限制如何调整？
修改 `.env` 文件中的 `UPLOAD_MAX_SIZE` 和 `UPLOAD_MAX_FILES` 配置，然后重启服务。

### 4. Redis 连接失败怎么办？
1. 检查 Redis 是否启动：`redis-cli ping`
2. 检查 `.env` 中的 Redis 配置是否正确
3. 检查防火墙是否允许 6379 端口

### 5. 如何开启调试日志？
修改 `.env` 文件中的 `LOG_LEVEL=debug`，然后重启服务。

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2024-01-01 | 初始版本 |
