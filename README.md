# 独立书店库存和读书会系统

一个完整的独立书店管理系统，支持库存管理、会员系统、读书会活动、图书预留、销售分析等功能。

## 系统架构

### 后端技术栈
- **框架**: Django 4.2 + Django REST Framework
- **数据库**: SQLite (可切换至 PostgreSQL)
- **缓存/队列**: Redis + Celery
- **对象存储**: 本地存储 + S3 兼容接口
- **认证**: JWT (Simple JWT)
- **API 文档**: drf-yasg (Swagger/ReDoc)

### 前端技术栈
- **框架**: Vue 3 + Vite
- **移动端 UI**: Vant 4
- **管理后台 UI**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **图表**: ECharts + vue-echarts
- **扫码**: html5-qrcode
- **离线存储**: localforage
- **导出**: xlsx (Excel)

## 核心功能模块

### 1. 图书管理
- 图书信息管理（ISBN、书名、作者、分类、价格、库存等）
- 供应商管理
- 分类管理
- 库存调整和日志记录
- ISBN 扫码查询
- 低库存预警

### 2. 会员系统
- 会员档案（支持隐私保护，普通员工脱敏显示）
- 会员等级体系（普通→银卡→金卡→钻石）
- 积分管理（获得、消耗、过期、调整）
- 到货通知订阅
- 手机号快速查询

### 3. 预留管理
- 图书预留单创建
- 预留状态跟踪（待确认→已确认→已完成/已过期/已取消）
- 超期自动释放（通过 Celery 定时任务）
- 预留与库存联动

### 4. 读书会活动
- 活动创建和发布
- 在线报名
- 门票生成和二维码签到
- 活动类型管理
- 报名人数限制和提醒

### 5. 库存管理
- 入库单管理
- 出库单管理
- 库存盘点
- 库存变动日志

### 6. 销售分析
- 销售订单管理
- 日销售报表
- 图书销量排行
- 销售趋势图表
- 分类销售占比

### 7. 管理看板
- 实时数据概览（今日销售额、订单数、会员数）
- 销售趋势图表
- 待办事项提醒（过期预留、库存预警）
- 销量排行 TOP 10

### 8. 移动端功能
- 响应式设计，适配手机屏幕
- ISBN 条码扫描查询
- 拍照上传图书封面
- 离线数据缓存和补提交
- 快速创建预留单
- 活动签到扫码

### 9. 数据校验和导出
- 核心数据约束自动校验
- 外键关系完整性检查
- Excel 数据导出（图书、会员、销售、预留、活动等）
- 导出历史记录

## 数据约束验证

系统内置完整的数据约束验证，确保数据一致性：

1. ✅ ISBN 唯一性
2. ✅ 库存数量非负
3. ✅ 预留数量 ≤ 库存数量
4. ✅ 会员手机号唯一性
5. ✅ 会员积分余额非负
6. ✅ 活动报名人数 ≤ 最大人数
7. ✅ 预留单状态一致性

## 权限体系

| 角色 | 权限 |
|------|------|
| 系统管理员 | 所有功能，包括用户管理、系统配置 |
| 店长 | 数据校验、数据导出、所有业务操作 |
| 普通员工 | 图书查询、创建预留、会员查询（脱敏）、活动签到 |

**会员隐私保护**: 普通员工查看会员信息时，手机号、邮箱等敏感信息会自动脱敏处理。

## 快速开始

### 启动后端

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python scripts/init_test_data.py
python manage.py runserver 0.0.0.0:8000
```

或者使用启动脚本:
```bash
./start-backend.sh
```

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

或者使用启动脚本:
```bash
./start-frontend.sh
```

### 访问地址

- 管理后台: http://localhost:5173/admin
- 移动端: http://localhost:5173/m
- API 文档: http://localhost:8000/api/swagger/

### 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 系统管理员 | admin | admin123 |
| 店长 | manager | manager123 |
| 普通员工 | staff | staff123 |

### 测试会员手机号

- 13900000001 - 张三 (金卡会员)
- 13900000002 - 李四 (银卡会员)
- 13900000003 - 王五 (普通会员)
- 13900000004 - 赵六 (钻石会员)

## 核心业务流程

### 图书预留流程
1. 顾客询问某本书是否可预留
2. 员工扫描 ISBN 或手动查询图书
3. 系统显示库存状态和是否可预留
4. 选择会员，创建预留单
5. 系统自动锁定库存，设置过期时间（默认 48 小时）
6. 会员到店取书，员工完成预留单
7. 系统自动扣减库存，释放预留锁定

### 活动签到流程
1. 活动开始前，员工打开移动端签到页面
2. 扫描会员门票二维码
3. 系统自动验证门票有效性
4. 签到成功，记录签到时间
5. 活动结束后可查看签到统计

### 离线处理流程
1. 网络中断时，所有操作自动保存到本地队列
2. 网络恢复后，自动按顺序提交离线操作
3. 提供离线数据管理页面，可查看和手动重试

## 定时任务 (Celery)

1. **释放过期预留单**: 每小时执行一次，自动释放超过有效期的预留单并归还库存
2. **库存检查**: 每日检查库存不足的图书
3. **生成销售报表**: 每日凌晨生成前一天的销售报表

## 项目目录结构

```
.
├── backend/                 # Django 后端
│   ├── apps/
│   │   ├── core/           # 核心模块（用户、认证、权限）
│   │   ├── books/          # 图书管理
│   │   ├── members/        # 会员管理
│   │   ├── inventory/      # 库存管理
│   │   ├── events/         # 活动管理
│   │   ├── reservations/   # 预留管理
│   │   └── sales/          # 销售分析
│   ├── scripts/            # 脚本（初始化数据、数据校验）
│   ├── logs/               # 日志文件
│   └── media/              # 上传文件
├── frontend/               # Vue 前端
│   ├── src/
│   │   ├── views/
│   │   │   ├── admin/      # 管理后台页面
│   │   │   └── mobile/     # 移动端页面
│   │   ├── layouts/        # 布局组件
│   │   ├── stores/         # Pinia 状态管理
│   │   ├── utils/          # 工具函数
│   │   └── styles/         # 样式文件
│   └── package.json
├── start-backend.sh        # 后端启动脚本
└── start-frontend.sh       # 前端启动脚本
```

## API 接口列表

### 认证接口
- `POST /api/auth/auth/login/` - 登录
- `POST /api/auth/auth/logout/` - 登出
- `GET /api/auth/auth/me/` - 获取当前用户信息
- `POST /api/auth/auth/change_password/` - 修改密码

### 图书接口
- `GET /api/books/books/` - 图书列表
- `POST /api/books/books/` - 创建图书
- `GET /api/books/books/{id}/` - 图书详情
- `GET /api/books/books/search_by_isbn/` - ISBN 查询
- `POST /api/books/books/{id}/adjust_stock/` - 调整库存
- `GET /api/books/categories/tree/` - 分类树
- `GET /api/books/suppliers/` - 供应商列表

### 会员接口
- `GET /api/members/members/` - 会员列表
- `POST /api/members/members/` - 创建会员
- `GET /api/members/members/{id}/` - 会员详情（自动脱敏）
- `POST /api/members/members/{id}/adjust_points/` - 调整积分
- `GET /api/members/members/{id}/points_history/` - 积分记录
- `GET /api/members/members/search_by_phone/` - 手机号查询
- `GET /api/members/notifications/` - 到货通知列表

### 预留接口
- `GET /api/reservations/reservations/` - 预留单列表
- `POST /api/reservations/reservations/` - 创建预留单
- `POST /api/reservations/reservations/{id}/confirm/` - 确认预留
- `POST /api/reservations/reservations/{id}/cancel/` - 取消预留
- `POST /api/reservations/reservations/{id}/complete/` - 完成预留
- `POST /api/reservations/reservations/check_availability/` - 检查可预留性

### 活动接口
- `GET /api/events/events/` - 活动列表
- `POST /api/events/events/` - 创建活动
- `GET /api/events/events/{id}/` - 活动详情
- `POST /api/events/events/{id}/register/` - 活动报名
- `POST /api/events/events/{id}/check_in/` - 活动签到
- `GET /api/events/registrations/` - 报名记录

### 销售接口
- `GET /api/sales/orders/` - 销售订单列表
- `POST /api/sales/orders/` - 创建销售订单
- `GET /api/sales/dashboard/summary/` - 销售概览
- `GET /api/sales/dashboard/alerts/` - 系统提醒
- `GET /api/sales/dashboard/top_books/` - 销量排行
- `GET /api/sales/reports/` - 销售报表

## 注意事项

1. **Redis 依赖**: Celery 任务队列需要 Redis 服务运行。如果没有 Redis，可以不启动 Celery，预留超期释放功能将不可用，但核心功能不受影响。

2. **生产环境**: 生产环境请务必修改 `SECRET_KEY` 和数据库配置，使用 PostgreSQL 替代 SQLite。

3. **对象存储**: 默认使用本地文件存储，可通过配置环境变量 `USE_S3=True` 切换到 S3 兼容的对象存储服务。

4. **会员隐私**: 系统严格控制会员敏感信息的访问，普通员工只能看到脱敏后的信息。

5. **移动端优化**: 移动端页面针对手机操作进行了优化，支持手势操作和离线使用。
