# 口腔诊所排班核销系统

基于 FastAPI + HTMX + PostgreSQL + Redis 构建的口腔诊所前台排班核销管理系统。

## 功能特性

### 核心业务
- **排班管理**：按周查看医生排班，支持新增、停诊、时段锁定
- **预约管理**：患者选择医生和时段预约，支持改期、取消
- **到店核销**：前台核销到店、记录爽约，支持预约号快速查询
- **候补队列**：号源满时可加入候补，有空号时自动分配
- **退款管理**：退款申请、审批、驳回流程
- **价格规则**：按服务类型和来源配置不同价格及折扣

### 数据分析
- **转化分析**：按预约来源、医生、日期统计到店转化率
- **爽约统计**：分析爽约率，辅助运营决策

### 系统管理
- **系统配置**：可配置系统参数，支持查看变更历史和前后差异
- **操作日志**：预约全流程处理记录

## 技术栈

- **后端**: FastAPI (Python 3.9+)
- **前端**: HTMX + Jinja2 模板
- **数据库**: PostgreSQL
- **缓存/分布式锁**: Redis
- **ORM**: SQLAlchemy 2.0

## 快速开始

### 1. 环境要求

- Python 3.9+
- PostgreSQL 12+
- Redis 6+

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

### 4. 初始化数据库

```bash
# 确保 PostgreSQL 服务已启动，创建数据库
# createdb clinic

# 执行初始化数据脚本
bash init.sh
```

### 5. 启动服务

```bash
bash start.sh
```

访问：
- 前台页面: http://localhost:8000
- API 文档: http://localhost:8000/docs

## 项目结构

```
├── app/
│   ├── __init__.py
│   ├── main.py              # 应用入口
│   ├── config.py            # 配置管理
│   ├── database.py          # 数据库连接
│   ├── redis_client.py      # Redis连接
│   ├── models/              # 数据模型
│   │   ├── __init__.py
│   │   └── models.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── __init__.py
│   │   └── schemas.py
│   ├── routers/             # API路由
│   │   ├── __init__.py
│   │   ├── schedule.py      # 排班
│   │   ├── appointment.py   # 预约
│   │   ├── checkin.py       # 核销
│   │   ├── waitlist.py      # 候补
│   │   ├── refund.py        # 退款
│   │   ├── pricing.py       # 价格规则
│   │   ├── config.py        # 系统配置
│   │   ├── stats.py         # 统计分析
│   │   └── pages.py         # 页面路由
│   ├── templates/           # HTML模板
│   │   ├── base.html
│   │   ├── index.html
│   │   ├── schedule.html
│   │   ├── appointments.html
│   │   ├── checkin.html
│   │   ├── waitlist.html
│   │   ├── refunds.html
│   │   ├── pricing.html
│   │   ├── config.html
│   │   └── stats.html
│   └── static/              # 静态文件
│       └── style.css
├── scripts/
│   └── init_data.py         # 初始化数据脚本
├── requirements.txt
├── .env.example
├── init.sh
└── start.sh
```

## API 接口

### 排班管理
- `GET /api/schedule/doctors` - 获取医生列表
- `POST /api/schedule/doctors` - 新增医生
- `GET /api/schedule` - 获取排班列表
- `POST /api/schedule` - 新增排班
- `GET /api/schedule/{id}` - 获取排班详情
- `GET /api/schedule/{id}/slots` - 获取排班时段
- `PUT /api/schedule/{id}/status` - 更新排班状态

### 预约管理
- `GET /api/appointment` - 获取预约列表（支持过滤）
- `POST /api/appointment` - 创建预约
- `GET /api/appointment/{id}` - 获取预约详情
- `GET /api/appointment/no/{no}` - 按预约号查询
- `PUT /api/appointment/{id}/cancel` - 取消预约
- `POST /api/appointment/{id}/reschedule` - 改期

### 核销管理
- `POST /api/checkin/checkin` - 到店核销
- `POST /api/checkin/noshow` - 标记爽约
- `GET /api/checkin/records` - 核销记录

### 候补队列
- `GET /api/waitlist` - 候补列表
- `POST /api/waitlist` - 添加候补
- `POST /api/waitlist/{id}/allocate` - 分配号源
- `POST /api/waitlist/{id}/cancel` - 取消候补

### 退款管理
- `GET /api/refund` - 退款列表
- `POST /api/refund` - 申请退款
- `POST /api/refund/{id}/approve` - 通过退款
- `POST /api/refund/{id}/reject` - 驳回退款

### 价格规则
- `GET /api/pricing` - 价格规则列表
- `POST /api/pricing` - 新增价格规则
- `GET /api/pricing/{id}` - 获取规则详情
- `PUT /api/pricing/{id}` - 更新规则
- `DELETE /api/pricing/{id}` - 删除规则
- `GET /api/pricing/calculate` - 计算价格

### 系统配置
- `GET /api/config` - 获取所有配置
- `POST /api/config` - 新增配置
- `GET /api/config/{key}` - 获取配置
- `PUT /api/config/{key}` - 更新配置
- `DELETE /api/config/{key}` - 删除配置
- `GET /api/config/logs/{key}` - 配置变更历史
- `GET /api/config/logs/all` - 所有变更日志

### 统计分析
- `GET /api/stats/conversion` - 转化统计
- `GET /api/stats/by-source` - 按来源统计
- `GET /api/stats/by-doctor` - 按医生统计
- `GET /api/stats/daily` - 每日趋势

## 特色功能

### 分布式锁
使用 Redis 实现预约时段的分布式锁，防止并发预约冲突。

### 配置变更历史
所有系统配置的修改都会记录变更日志，支持查看前后值对比。

### 多维度过滤
列表页支持日期、状态、责任人、来源等多维度筛选。

### 处理记录
预约从创建到核销/取消的全流程都会留痕，便于追溯。
