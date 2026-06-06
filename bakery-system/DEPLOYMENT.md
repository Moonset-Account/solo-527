# 独立烘焙店预订和生产看板系统

基于 Laravel + SQLite（可切换MySQL）+ Vue 3 的完整烘焙店管理系统。

## 系统功能

### 🎂 在线预订（顾客端）
- 浏览产品列表，按口味、尺寸筛选
- 购物车管理，支持多商品
- 选择取货时段（自动限流）
- 填写顾客信息和特殊要求
- 订单提交成功后显示详情

### 👨‍💼 管理后台（员工/管理员）

#### 仪表盘
- 今日订单、收入、生产中、待取货统计
- 库存预警（库存不足、临期原料）
- 即将取货订单列表
- 今日取货时段流量

#### 订单管理
- 多维度筛选（状态、取货日期、搜索）
- 订单状态流转：待确认 → 已确认 → 生产中 → 待取货 → 已取货
- 支付状态追踪
- 开始生产自动扣减库存（先进先出，临期优先）
- 取货核销

#### 生产看板
- 按状态分列的看板式布局
- 任务状态快速更新
- 任务分配给负责人
- 人员工作负载统计
- 按日期筛选

#### 库存管理
- 原料库存总览
- 库存不足和临期预警
- 原料入库操作
- 按批次追踪保质期

#### 取货时段管理
- 时段列表和限流设置
- 单个新增和批量创建
- 支持排除周末
- 可预约数量实时显示

## 技术特性

### 🔐 权限系统
- **三种用户角色**：管理员(admin)、店员(staff)、顾客(customer)
- 基于 spatie/laravel-permission 的细粒度权限控制
- API 中间件校验用户类型
- Sanctum Token 认证

### 🗄️ 数据库设计
- 16 张核心表，完整的业务数据流
- 唯一约束：产品(name+size+flavor)、取货时段(date+start_time+end_time)等
- 软删除支持
- 索引优化：状态、日期、外键等

### 🔄 状态流转校验
- 订单状态严格校验，非法流转被拦截
- 生产开始前必须支付定金
- 取货核销必须款项付清且商品就绪
- 取消订单自动释放取货时段名额

### ⚠️ 库存与限流
- **取货时段限流**：每时段最大订单数控制，满员自动禁止预约
- **临期原料优先**：扣减库存时按保质期升序，临期先出
- **库存预警**：低于阈值自动标记，过期前N天提醒

### 📦 导入导出
- 产品、原料、订单支持Excel导出
- 产品和原料支持批量导入
- 导入导出任务记录和进度追踪

### 📧 通知重试机制
- 通知表内置重试次数字段
- 支持最大重试次数配置
- 失败记录错误信息

## 快速开始

### 环境要求
- PHP 8.2+
- Composer
- SQLite（默认）或 MySQL 5.7+

### 安装步骤

```bash
# 进入项目目录
cd bakery-system

# 安装依赖
composer install

# 复制环境配置
cp .env.example .env
php artisan key:generate

# 创建数据库（SQLite）
touch database/database.sqlite

# 运行迁移和填充
php artisan migrate --force
php artisan db:seed --force

# 启动开发服务器
php artisan serve --port=8080
```

### 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@bakery.com | password123 |
| 店员 | staff@bakery.com | password123 |
| 顾客 | customer@example.com | password123 |

### 访问地址

- **首页**: http://127.0.0.1:8080
- **在线预订**: http://127.0.0.1:8080/order
- **员工登录**: http://127.0.0.1:8080/login
- **管理后台**: http://127.0.0.1:8080/admin

## API 概览

### 认证接口
- `POST /api/auth/register` - 顾客注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/me` - 当前用户信息

### 公开接口
- `GET /api/products` - 产品列表
- `GET /api/products/{id}` - 产品详情
- `GET /api/pickup-slots` - 取货时段列表

### 顾客接口（需登录）
- `POST /api/orders` - 创建订单
- `GET /api/orders` - 我的订单
- `GET /api/orders/{id}` - 订单详情
- `POST /api/orders/{id}/cancel` - 取消订单

### 员工/管理员接口
- 订单全流程管理
- 生产看板
- 库存管理
- 取货时段配置
- 支付和退款
- 导入导出
- 统计数据

## 切换到 MySQL

修改 `.env` 文件：

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bakery_system
DB_USERNAME=root
DB_PASSWORD=your_password
```

然后重新运行迁移：
```bash
php artisan migrate:fresh --seed --force
```

## 核心业务流程

### 订单生命周期
```
顾客下单 → 待确认 → 已确认(支付定金) → 生产中(扣减库存) → 待取货 → 已取货(付清尾款)
                          ↓
                       已取消(释放名额)
```

### 生产流程
```
待开始 → 准备中 → 烘焙中 → 装饰中 → 已完成
```

### 库存扣减策略
1. 按保质期升序排序（临期先出）
2. 逐批次扣减直到满足需求量
3. 记录库存变动流水

## 项目结构

```
bakery-system/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/    # API控制器
│   │   └── Middleware/          # 中间件
│   └── Models/                   # Eloquent模型
├── database/
│   ├── migrations/               # 数据库迁移
│   └── seeders/                  # 数据填充
├── resources/views/
│   ├── admin/                    # 管理后台页面
│   ├── auth/                     # 认证页面
│   ├── layouts/                  # 布局模板
│   ├── order.blade.php           # 在线预订
│   └── welcome.blade.php         # 首页
└── routes/
    ├── api.php                   # API路由
    └── web.php                   # Web路由
```

## 上线前检查清单

- [ ] 配置正式数据库（MySQL）
- [ ] 设置正确的 APP_URL 和 APP_KEY
- [ ] 配置邮件服务（订单通知）
- [ ] 配置队列（异步通知、导入导出）
- [ ] 设置文件存储（S3/本地）
- [ ] 配置备份策略
- [ ] 设置 HTTPS
- [ ] 初始化生产数据（产品、原料、时段）
- [ ] 创建员工账号
- [ ] 测试完整下单流程
- [ ] 测试库存扣减逻辑
- [ ] 验证权限边界
