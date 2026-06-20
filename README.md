# 母婴会员复购营销系统 (会员触达台)

基于 FastAPI + HTMX + PostgreSQL + Redis 构建的母婴会员复购营销系统。

## ✨ 功能特性

### 🛒 前台会员端 (HTMX)
- **积分商城**：会员使用积分兑换精选母婴商品
- **我的复购券**：查看已获得的复购券及使用状态
- **积分权益**：领取和查看积分权益
- **兑换记录**：查看历史兑换订单，包含附件、备注和修改历史

### 🎯 后台运营端 (HTMX)
- **概览仪表盘**：会员数、成本、订单、任务进度一览
- **会员管理**：会员列表、积分调整
- **复购券管理**：券模板增删改查、发放、版本历史
- **积分商品**：商品管理，支持热门/新品标记
- **积分权益**：权益配置与发放
- **人群管理**：动态/静态人群创建，支持版本回溯
- **触达任务**：创建、审批、启动触达任务，转化漏斗分析
- **兑换订单**：订单处理、发货、完成全流程
- **成本报表**：日/周/月积分成本统计，自动生成并通知
- **字典配置**：所有系统字典项，版本记录可追溯
- **通知中心**：系统通知查看与发送
- **操作日志**：完整审计记录，冲突操作高亮

### 🔐 权限体系
| 角色 | 说明 |
|------|------|
| `admin` | 系统管理员，全部权限 |
| `brand_operator` | 品牌会员运营，仅限本品牌数据 |
| `member` | 普通会员，前台使用 |

### 📋 业务规则
- **列表优先露出**：复购券、积分权益、兑换记录优先展示
- **单据详情**：保留附件、备注、修改历史完整链路
- **导购冲突**：发放券、调整积分、审批触达任务等冲突动作留日志
- **版本追溯**：字典、提醒、券模板、商品、人群、任务均带版本记录，支持回退核对

## 🚀 快速开始

### 一键启动
```bash
chmod +x start.sh
./start.sh
```

### 手动启动
```bash
# 1. 创建虚拟环境
python3 -m venv .venv
source .venv/bin/activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 初始化数据库（内置 SQLite，无需额外安装）
python init_db.py

# 4. 启动服务
python run.py
```

### 访问地址
| 入口 | URL |
|------|-----|
| 会员前台积分商城 | http://localhost:8000/mall |
| 运营管理后台 | http://localhost:8000/admin/dashboard |
| API文档 (Swagger) | http://localhost:8000/docs |

### 默认账号
| 角色 | 账号 | 密码 |
|------|------|------|
| 管理员 | `admin` | `admin123` |
| 品牌运营 | `operator` | `operator123` |
| 会员(5000积分) | `member` | `member123` |
| 会员(800积分) | `member2` | `member123` |

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────┐
│                   HTMX 前端页面                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ 会员前台商城 │  │ 运营管理后台 │  │ 登录入口    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│                  FastAPI 后端服务                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ 认证与权限   │ │  业务路由层  │ │  中间件/审计 │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ │
│  ┌───────────────────────────────────────────────┐  │
│  │         SQLAlchemy 2.0 + Pydantic V2          │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
          ↓                              ↓
┌────────────────────┐     ┌────────────────────┐
│   PostgreSQL /     │     │   Redis (缓存)     │
│   SQLite (默认)    │     │                    │
└────────────────────┘     └────────────────────┘
```

## 📁 项目结构

```
.
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 应用入口
│   ├── config.py               # 配置管理
│   ├── database.py             # 数据库连接
│   ├── redis.py                # Redis 客户端
│   ├── auth.py                 # JWT 认证与权限
│   ├── utils.py                # 工具函数
│   ├── middleware.py           # 中间件与审计日志
│   ├── schemas.py              # Pydantic 数据模型
│   ├── models/                 # SQLAlchemy 模型
│   │   ├── user.py
│   │   ├── points.py
│   │   ├── product.py
│   │   ├── campaign.py
│   │   └── system.py
│   ├── routers/                # API 路由
│   │   ├── auth.py
│   │   ├── members.py
│   │   ├── points.py
│   │   ├── coupons.py
│   │   ├── products.py
│   │   ├── campaigns.py
│   │   └── system.py
│   └── templates/              # HTMX Jinja2 模板
│       ├── base.html
│       ├── login.html
│       ├── mall.html
│       ├── my_coupons.html
│       ├── my_benefits.html
│       ├── my_redemptions.html
│       ├── admin_base.html
│       ├── admin_dashboard.html
│       ├── admin_members.html
│       ├── admin_coupons.html
│       ├── admin_products.html
│       ├── admin_benefits.html
│       ├── admin_crowds.html
│       ├── admin_reach_tasks.html
│       ├── admin_redemptions.html
│       ├── admin_cost_reports.html
│       ├── admin_dicts.html
│       ├── admin_notifications.html
│       └── admin_logs.html
├── init_db.py                  # 数据库初始化脚本
├── run.py                      # 服务启动脚本
├── start.sh                    # 一键启动脚本
├── requirements.txt            # 依赖清单
├── .env.example                # 环境变量示例
└── README.md
```

## 🔧 环境配置

复制 `.env.example` 为 `.env` 并按需修改：

```bash
cp .env.example .env
```

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | 数据库连接 | `sqlite+aiosqlite:///./member_marketing.db` |
| `REDIS_URL` | Redis 连接 | `redis://localhost:6379/0` |
| `SECRET_KEY` | JWT 密钥 | 内置开发密钥 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token有效期 | 1440 (24小时) |
| `UPLOAD_DIR` | 附件上传目录 | `./uploads` |

> 默认使用 SQLite，无需额外安装数据库即可运行。生产环境建议切换为 PostgreSQL。

## 📝 业务说明

### 积分成本核算
- 每张券有 `cost_per_unit` 成本字段
- 每个积分商品有 `cost_price` 成本价
- 积分调整可记录 `cost_amount`
- 报表自动汇总：积分成本 + 券成本 + 触达成本

### 版本记录机制
以下实体均支持多版本历史：
- CouponTemplate (券模板)
- PointProduct (积分商品)
- PointBenefit (积分权益)
- CrowdSegment (人群)
- ReachTask (触达任务)
- DictItem (字典项)
- Notification (通知)

每次修改会自动保存版本快照，变更说明可回查。

### 冲突操作审计
以下动作被标记为**冲突操作**并在日志中高亮：
- `adjust_points` - 积分调整
- `issue_coupon` - 发放优惠券
- `create_reach_task` - 创建触达任务
- `approve_reach_task` / 启动任务 - 审批/启动触达任务
- `update_redemption_order` (完成/取消) - 订单状态变更

## 📄 License
内部使用
