# 牙科诊所客户报价协同系统

基于 Django + React + PostgreSQL + Celery 的牙科诊所客户报价协同管理系统。

## 功能特性

### 1. 线索管理
- 线索录入与分配
- 线索质量自动评分（高/中/低）
- 线索来源管理
- 跟进记录与提醒
- 公海池管理（自动回收、领取）
- 超时跟进提醒

### 2. 咨询记录
- 客户咨询记录管理
- 初诊/复诊分类
- 意向等级评估
- 治疗项目明细
- 口腔检查记录
- 附件上传

### 3. 合同管理
- 合同创建与编辑
- 折扣审批流程
- 合同项目明细
- 收款记录管理
- 付款状态跟踪
- 合同附件

### 4. 审批流程
- 折扣申请与审批
- 多级审批支持
- 审批记录留痕
- 审批意见

### 5. 报表中心
- 销售漏斗分析
- 线索来源分析
- 销售业绩排行
- 超时跟进分析
- 趋势分析
- 响应节点统计

### 6. 操作历史
- 全操作日志记录
- 操作人追踪
- 时间点记录
- IP地址记录

## 技术栈

### 后端
- **框架**: Django 4.2 + Django REST Framework 3.14
- **数据库**: PostgreSQL 15
- **任务队列**: Celery 5.3 + Redis 7
- **认证**: JWT (Simple JWT)
- **权限**: Django REST Framework Permissions
- **过滤器**: django-filter

### 前端
- **框架**: React 18
- **路由**: React Router v6
- **状态管理**: Redux Toolkit
- **UI组件**: Ant Design 5
- **图表**: ECharts
- **HTTP客户端**: Axios
- **日期处理**: Day.js

## 项目结构

```
dental-clinic-system/
├── backend/                 # Django 后端
│   ├── dental_clinic/       # 项目配置
│   ├── users/               # 用户管理模块
│   ├── leads/               # 线索管理模块
│   ├── consultations/       # 咨询记录模块
│   ├── contracts/           # 合同管理模块
│   ├── reports/             # 报表模块
│   ├── common/              # 公共模块
│   ├── fixtures/            # 初始化数据
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # React 前端
│   ├── src/
│   │   ├── components/      # 公共组件
│   │   ├── pages/           # 页面组件
│   │   ├── store/           # Redux 状态管理
│   │   ├── services/        # API 服务
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml       # Docker 编排
```

## 快速开始

### 方式一：Docker Compose 启动（推荐）

```bash
# 克隆项目后进入目录
cd dental-clinic-system

# 启动所有服务
docker-compose up -d

# 执行数据库迁移
docker-compose exec backend python manage.py migrate

# 加载初始化数据
docker-compose exec backend python manage.py loaddata fixtures/initial_data.json

# 创建超级管理员
docker-compose exec backend python manage.py createsuperuser

# 访问前端
# http://localhost:3000

# 访问后端 API
# http://localhost:8000/api/

# 访问 Admin 后台
# http://localhost:8000/admin/
```

### 方式二：本地开发启动

#### 后端启动

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env

# 确保 PostgreSQL 和 Redis 已启动

# 执行迁移
python manage.py migrate

# 加载初始数据
python manage.py loaddata fixtures/initial_data.json

# 创建超级用户
python manage.py createsuperuser

# 启动开发服务器
python manage.py runserver
```

#### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 启动开发服务器
npm start
```

## 默认账号

系统初始数据中包含以下角色配置：
- 管理员 (admin)
- 销售 (sales)
- 医生 (doctor)
- 咨询师 (consultant)
- 财务 (finance)

请使用 `createsuperuser` 创建管理员账号。

## 核心业务流程

### 线索转化流程
1. 录入线索（录入客户信息、来源、问题）
2. 系统自动计算质量评分
3. 分配给销售/咨询师跟进
4. 记录跟进情况和意向
5. 安排咨询预约
6. 客户到店咨询
7. 出具治疗方案和报价
8. 协商折扣（如需审批则走审批流程）
9. 签订合同
10. 收款记录
11. 治疗执行

### 公海规则
- 线索超过设定天数未跟进自动进入公海
- 公海线索所有人可见
- 销售人员可领取公海线索
- 领取后归属新负责人

### 折扣审批流程
1. 销售创建合同并申请折扣
2. 管理员审批（批准/拒绝/要求修改）
3. 审批通过后合同生效
4. 全部审批记录留痕可查

## API 文档

启动后端服务后，可通过以下方式访问 API：

- **基础 URL**: `http://localhost:8000/api/`
- **认证**: JWT Token (Header: `Authorization: JWT <token>`)

### 主要 API 端点

| 模块 | 端点 | 说明 |
|------|------|------|
| 认证 | `/api/auth/jwt/create/` | 获取 Token |
| 认证 | `/api/auth/users/me/` | 当前用户信息 |
| 用户 | `/api/users/` | 用户列表 |
| 线索 | `/api/leads/` | 线索列表 |
| 线索 | `/api/leads/<id>/` | 线索详情 |
| 线索 | `/api/leads/public-sea/` | 公海线索 |
| 线索 | `/api/leads/my-leads/` | 我的线索 |
| 跟进 | `/api/leads/followups/` | 跟进记录 |
| 咨询 | `/api/consultations/` | 咨询记录 |
| 治疗项目 | `/api/consultations/treatment-items/` | 治疗项目列表 |
| 合同 | `/api/contracts/` | 合同列表 |
| 合同 | `/api/contracts/pending-approval/` | 待审批合同 |
| 报表 | `/api/reports/sales-funnel/` | 销售漏斗 |
| 报表 | `/api/reports/lead-source/` | 线索来源分析 |
| 报表 | `/api/reports/sales-performance/` | 销售业绩 |
| 操作日志 | `/api/common/operation-logs/` | 操作日志 |

## 配置说明

### 环境变量

#### 后端环境变量
- `SECRET_KEY`: Django 密钥
- `DEBUG`: 调试模式
- `DB_NAME`: 数据库名
- `DB_USER`: 数据库用户
- `DB_PASSWORD`: 数据库密码
- `DB_HOST`: 数据库地址
- `DB_PORT`: 数据库端口
- `REDIS_URL`: Redis 地址
- `CELERY_BROKER_URL`: Celery Broker
- `CELERY_RESULT_BACKEND`: Celery 结果后端

#### 前端环境变量
- `REACT_APP_API_URL`: API 基础地址

## 开发说明

### 添加新的 App
```bash
cd backend
python manage.py startapp <app_name>
```

### 数据库迁移
```bash
# 创建迁移文件
python manage.py makemigrations

# 执行迁移
python manage.py migrate
```

### Celery 任务
```bash
# 启动 Worker
celery -A dental_clinic worker -l info

# 启动 Beat (定时任务)
celery -A dental_clinic beat -l info
```

## 许可证

MIT License
