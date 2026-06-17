# 施工验收台 - 设计图纸报价预算器

基于 Django、Django REST、React、PostgreSQL 和 Celery 实现的施工验收业务管理系统。

## 功能模块

### 核心业务
- **项目管理**：项目创建、状态流转、现场照片、附件、备注、修改历史
- **报价管理**：报价单生成、版本管理、客户确认、增项管理
- **预算管理**：预算编制、版本控制、变更申请、审批流程、Excel 导出
- **材料管理**：材料库、领用审批、采购记录、材料清单、成本报表
- **巡检验收**：日常巡检、分阶段验收、竣工验收、问题整改、照片记录
- **售后报修**：报修工单、派单处理、费用结算、客户满意度

### 预警与看板
- **预算看板**：各项目预算执行情况、成本占比图表、实时预警
- **预警提醒**：预算超支预警、巡检不合格通知材料员、库存不足提醒、整改超期提醒
- **月度报表**：自动生成月度成本快照，用于月底复盘

### 综合查询
- **现场照片筛选**：按项目、时间、描述搜索照片
- **售后报修查询**：按状态、优先级、时间筛选报修单
- **材料清单筛选**：按确认状态、项目过滤材料清单

## 技术栈

### 后端
- Django 4.2 + Django REST Framework
- PostgreSQL 15
- Celery 5.3 + Redis
- JWT 认证
- openpyxl (Excel 导出)

### 前端
- React 18
- Ant Design 5
- React Router 6
- Zustand (状态管理)
- ECharts (图表)
- Axios

## 快速启动

### 使用 Docker Compose (推荐)

```bash
# 启动所有服务
docker-compose up -d

# 创建数据库迁移
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

# 创建超级管理员
docker-compose exec backend python manage.py createsuperuser

# 加载示例数据
docker-compose exec backend python manage.py loaddata initial_data  # 如果有初始数据
```

访问地址：
- 前端: http://localhost:3000
- 后端 API: http://localhost:8000/api/
- Django Admin: http://localhost:8000/admin/

### 手动启动

#### 后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env

# 确保 PostgreSQL 和 Redis 已启动，然后执行：
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# 启动开发服务器
python manage.py runserver 0.0.0.0:8000

# 另开终端启动 Celery Worker
celery -A config worker -l info

# 另开终端启动 Celery Beat (定时任务)
celery -A config beat -l info
```

#### 前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

## 默认账号

创建超级管理员后使用邮箱和密码登录系统。

角色说明：
- `admin` - 管理员：系统全权限
- `project_manager` - 项目经理：项目、报价、预算管理
- `material_staff` - 材料员：材料管理、库存管理
- `inspector` - 巡检员：巡检验收
- `finance` - 财务：预算审批、报表查看
- `worker` - 施工人员：基础查看权限

## 项目结构

```
.
├── backend/
│   ├── config/              # Django 项目配置
│   │   ├── settings.py      # 全局配置
│   │   ├── celery.py        # Celery 配置
│   │   ├── urls.py          # 路由入口
│   │   └── wsgi.py / asgi.py
│   ├── apps/
│   │   ├── users/           # 用户认证与权限
│   │   ├── projects/        # 项目管理、照片、附件、修改历史
│   │   ├── budgets/         # 预算、版本、预警、看板、报表
│   │   ├── quotations/      # 报价单、增项
│   │   ├── materials/       # 材料库、领用、采购、清单
│   │   ├── inspections/     # 巡检验收
│   │   ├── repairs/         # 售后报修
│   │   └── notifications/   # 通知消息
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # 通用组件
│   │   ├── pages/           # 业务页面
│   │   ├── services/        # API 服务
│   │   ├── store/           # Zustand 状态管理
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## API 主要接口

| 模块 | 接口 | 说明 |
|------|------|------|
| 用户 | POST /api/users/login/ | 登录获取 JWT |
| | GET /api/users/me/ | 当前用户信息 |
| 项目 | GET/POST /api/projects/ | 项目列表/创建 |
| | POST /api/projects/{id}/add_photo/ | 上传现场照片 |
| | POST /api/projects/{id}/add_attachment/ | 上传附件 |
| 报价 | GET/POST /api/quotations/ | 报价列表/创建 |
| | POST /api/quotations/{id}/confirm/ | 确认报价 |
| | POST /api/quotations/{id}/add_extra/ | 添加增项 |
| | POST /api/quotations/{id}/create_new_version/ | 新版本 |
| 预算 | GET/POST /api/budgets/ | 预算列表/创建 |
| | GET /api/budgets/dashboard/ | 预算看板数据 |
| | POST /api/budgets/{id}/approve/ | 审批预算 |
| | POST /api/budgets/{id}/export_excel/ | 导出 Excel |
| | POST /api/budgets/changes/{id}/confirm/ | 确认变更 |
| 材料 | GET/POST /api/materials/ | 材料库 |
| | GET /api/materials/cost_report/ | 成本报表 |
| | POST /api/materials/usages/{id}/approve/ | 审批领用 |
| 巡检 | GET/POST /api/inspections/ | 巡检记录 |
| | POST /api/inspections/{id}/submit_result/ | 提交检查结果 |
| | POST /api/inspections/{id}/mark_rectified/ | 标记整改完成 |
| 报修 | GET/POST /api/repairs/ | 报修工单 |
| | POST /api/repairs/{id}/assign/ | 派单 |
| | POST /api/repairs/{id}/complete/ | 完成处理 |
| 通知 | GET /api/notifications/unread/ | 未读消息 |
| | GET /api/notifications/unread_count/ | 未读数 |
| | POST /api/notifications/{id}/mark_read/ | 标记已读 |

## 业务流程示例

### 报价确认流程
1. 项目经理在「项目管理」创建项目
2. 在「报价管理」新建报价单，添加明细项
3. 提交报价单，客户确认后状态变为「已确认」
4. 施工中可添加「增项」，客户确认后生效

### 预算管理流程
1. 管理员/财务在「预算管理」创建预算，分配到各明细项
2. 提交审批，审批通过后生效
3. 实际施工中申请增项/减项，经确认后计入变更
4. 系统自动监控超支，触发预警并通知相关人员
5. 月底可导出 Excel 预算明细，结合成本报表复盘

### 巡检不合格流程
1. 巡检员在「巡检验收」创建巡检记录
2. 提交检查结果为「不合格」
3. 系统自动发送通知给材料员和项目经理
4. 材料员跟进材料问题，整改完成后标记
5. 材料成本自动计入材料成本报表

## 定时任务

Celery Beat 定时执行：
- 每小时：检查预算超支预警
- 每日：生成月度成本快照报表
- 巡检整改超期检查
- 材料库存不足检查

手动触发：
```bash
docker-compose exec celery_worker celery -A config call apps.budgets.tasks.check_budget_warnings
```

## 开发说明

- 后端遵循 Django REST Framework 最佳实践，使用 ViewSet + Serializer
- 所有修改操作记录到 ChangeHistory 模型
- 前端使用 Ant Design Pro 风格布局，Zustand 管理全局状态
- 文件上传使用 Django Media 存储
- 预警和通知使用 Celery 异步处理

## License

内部项目
