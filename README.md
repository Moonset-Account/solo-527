# 移动义诊物资和排班系统

公益医疗协调员专用的移动义诊物资和排班管理系统，围绕真实义诊流程设计，覆盖医生、地点、药品箱、登记表、志愿者、回收物资全台账管理。

## 技术栈

- **后端框架**: FastAPI 0.104.1
- **数据库**: PostgreSQL
- **ORM**: SQLAlchemy 2.0
- **认证**: JWT (python-jose)
- **密码加密**: bcrypt
- **异步任务**: Celery + Redis
- **数据处理**: pandas + openpyxl (导入导出)
- **测试**: pytest

## 快速开始

### 1. 环境准备

```bash
# 克隆项目后安装依赖
pip install -r requirements.txt

# 复制环境变量配置
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

### 2. 数据库配置

确保 PostgreSQL 服务已启动，然后创建数据库：

```sql
CREATE DATABASE medical_clinic;
CREATE DATABASE medical_clinic_test;
```

### 3. 初始化数据

```bash
# 初始化数据库并创建测试账号
python -m app.seed
```

### 4. 启动服务

```bash
# 启动 API 服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 启动 Celery Worker (另开终端)
celery -A app.celery_app worker --loglevel=info
```

### 5. 访问文档

- API 文档 (Swagger): http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 数据模型

系统共包含 18 个核心数据表，围绕义诊真实流程设计：

### 1. 人员类

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `users` | 用户账号表 | username, email, role(角色), hashed_password |
| `doctors` | 医生档案表 | license_number(执业证号), specialty(专科), hospital |
| `volunteers` | 志愿者档案表 | id_card, skills(技能), organization, service_hours |

### 2. 地点与物资类

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `locations` | 义诊地点表 | name, address, capacity(容量), facilities(设施) |
| `medicines` | 药品库存表 | name, specification(规格), unit, stock_quantity, expiry_date |
| `medicine_boxes` | 药品箱表 | box_code(箱号), status(状态: empty/packed/in_use/returned), schedule_id |
| `medicine_box_items` | 药品箱明细 | packed_quantity(装箱数), used_quantity(使用数), returned_quantity(归还数) |

### 3. 排班与登记类

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `schedules` | 排班表 | title, doctor_id, location_id, date, start_time, end_time, status |
| `schedule_volunteers` | 排班志愿者关联 | schedule_id, volunteer_id, role, checked_in |
| `registrations` | 患者登记表 | registration_number(登记号), patient_*, chief_complaint(主诉), status, queue_number |
| `check_ins` | 现场签到表 | registration_id, check_in_time, checked_in_by |

### 4. 服务与回收类

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `service_records` | 服务记录表 | diagnosis(诊断), treatment_notes, referral_suggested(是否建议转诊) |
| `prescription_items` | 处方登记表 | medicine_name, quantity, unit, dosage — **仅登记数量，不生成诊断建议** |
| `returned_items` | 物资回收表 | box_id, medicine_id, returned_quantity, verified_by |

### 5. 系统类

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `monthly_reconciliations` | 月度对账表 | month, total_*, status, verified_by |
| `notifications` | 通知表 | recipient_id, title, content, is_read |
| `import_export_tasks` | 导入导出任务队列 | task_type, entity_type, status, total/success/failed_count |
| `error_logs` | 错误日志表 | error_type, error_message, stack_trace, endpoint, request_data |

---

## 访问控制 (RBAC)

系统采用基于角色的访问控制，共 5 种角色：

### 角色定义

| 角色 | 代码 | 说明 | 主要权限 |
|------|------|------|----------|
| 系统管理员 | `admin` | 全局管理员 | 用户管理、系统配置、全部权限 |
| 协调员 | `coordinator` | 义诊协调员 | 排班管理、物资管理、登记审核、人员管理 |
| 医生 | `doctor` | 出诊医生 | 查看排班、写服务记录、查看药品 |
| 志愿者 | `volunteer` | 现场志愿者 | 签到登记、物资回收、查看排班 |
| 财务 | `finance` | 财务对账 | 查看统计、月度对账 |

### 权限控制实现

```python
# 使用方式示例
from app.auth import RoleChecker
from app.models import UserRole

allow_admin_coordinator = RoleChecker([UserRole.ADMIN, UserRole.COORDINATOR])

@router.post("", dependencies=[Depends(allow_admin_coordinator)])
def create_schedule():
    # 仅管理员和协调员可创建排班
    pass
```

---

## 核心业务流程

### 完整链路图

```
患者登记 → 资格校验 → 库存校验 → 时段校验 → 人工确认 → 排班确认
                                                           ↓
                                                  物资装箱(扣减库存)
                                                           ↓
                                                    现场签到
                                                           ↓
                                                     医生服务
                                                           ↓
                                            处方登记 (仅记录数量)
                                                           ↓
                                                  剩余物资回收
                                                           ↓
                                                    服务统计
                                                           ↓
                                                     月度对账
```

### 关键流程说明

#### 1. 患者登记
- 自动生成唯一登记号 `REG{YYYYMMDD}{UUID6}`
- 自动分配队列号码
- 实时校验排班名额是否已满
- 校验排班状态（仅已发布/已确认/进行中的排班可登记）

#### 2. 资格审核
- 协调员人工审核患者资格
- 标记 `is_eligible` 并填写原因
- 通过后状态变为 `qualified`，拒绝则为 `rejected`

#### 3. 人工确认
- 资格审核通过后，协调员最终确认
- 状态变为 `confirmed`，可进行签到

#### 4. 物资装箱
- 创建药品箱时自动校验库存
- 装箱时实时扣减药品总库存
- 装箱完成后状态变为 `packed`

#### 5. 排班确认
- 协调员确认排班，状态变为 `confirmed`
- 可触发异步提醒，通知医生和志愿者

#### 6. 现场签到
- 校验患者登记状态（必须已确认）
- 签到后状态变为 `checked_in`
- 记录签到时间和操作人员

#### 7. 服务记录
- 医生填写诊断和治疗记录
- 可标记是否建议转诊
- 处方仅登记药品名称、规格、数量、用法
- **重要：系统不提供任何诊断建议，所有诊断由医生人工填写**

#### 8. 剩余物资回收
- 归还时校验箱内可用数量（装箱数 - 使用数）
- 归还后自动回加至总库存
- 支持管理员二次核验

#### 9. 月度对账
- 自动汇总当月：排班数、服务人数、药品使用/归还数、服务时长
- 支持财务人员核验标记

---

## 异步提醒系统

基于 Celery + Redis 实现异步任务，主要功能：

### 1. 站内通知
- 发送通知任务：`send_notification_task`
- 支持多种通知类型：`system`（系统）、`schedule_reminder`（排班提醒）
- 通知支持已读/未读状态

### 2. 邮件通知
- 发送邮件任务：`send_email_task`
- SMTP 配置见 `.env`
- 发送站内通知时，如用户有邮箱则同步发送邮件

### 3. 排班提醒
- 任务：`schedule_reminder_task`
- 自动给排班的医生和所有志愿者发送提醒
- 包含排班标题、时间、地点信息

### 启动方式

```bash
# 启动 Redis (macOS)
brew services start redis

# 启动 Celery Worker
celery -A app.celery_app worker --loglevel=info

# 启动定时任务 Beat (可选)
celery -A app.celery_app beat --loglevel=info
```

---

## 导入导出队列

### 支持的导入类型
- 药品数据 (`medicine`)
- 地点数据 (`location`)

### 支持的导出类型
- 药品数据 (`medicine`)
- 患者登记 (`registration`)

### 任务状态
| 状态 | 说明 |
|------|------|
| `pending` | 等待处理 |
| `processing` | 处理中 |
| `completed` | 完成 |
| `failed` | 失败 |

### 使用方式

导入任务由 `import_data_task` 异步处理，导出任务由 `export_data_task` 处理。
任务创建后，可通过 `/api/import-export-tasks` 查询进度和结果。

---

## 错误日志系统

### 自动记录
通过中间件 `ErrorLoggingMiddleware` 自动捕获所有未处理异常：

| 记录字段 | 说明 |
|----------|------|
| `error_type` | 异常类型 (如 ValueError, HTTPException) |
| `error_message` | 异常信息 |
| `stack_trace` | 完整堆栈追踪 |
| `endpoint` | 请求接口 (方法 + 路径) |
| `user_id` | 当前登录用户 (如有) |
| `request_data` | 请求体 JSON |
| `created_at` | 发生时间 |

### 查询方式
- 管理员可通过 `/api/error-logs` 分页查询
- 按时间倒序排列，最新在前

---

## 测试账号

运行 `python -m app.seed` 后自动创建以下账号，均为测试用途：

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 系统管理员 | `admin` | `admin123` | 拥有全部权限 |
| 协调员 | `coordinator` | `coord123` | 义诊协调员，负责排班和物资 |
| 医生 | `doctor` | `doctor123` | 李医生，内科主任医师 |
| 志愿者 | `volunteer` | `vol123` | 王志愿者，有药品管理技能 |
| 财务 | `finance` | `finance123` | 负责月度对账和统计 |

种子数据同时会创建：
- 2 个义诊地点（阳光社区、幸福村）
- 8 种常用药品（含库存）
- 1 个已发布的排班（下周阳光社区）
- 1 个已装箱的药品箱（BOX001）
- 1 名医生 + 1 名志愿者档案

---

## 运行测试

```bash
# 运行全部测试
pytest tests/ -v

# 运行特定文件
pytest tests/test_api.py -v
```

测试覆盖：
- 健康检查
- 用户登录认证
- 地点 CRUD
- 药品 CRUD
- 用户管理

---

## 项目结构

```
question-099/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 主入口
│   ├── config.py            # 配置管理
│   ├── database.py          # 数据库连接
│   ├── models.py            # SQLAlchemy 数据模型 (18张表)
│   ├── schemas.py           # Pydantic 验证模式
│   ├── auth.py              # JWT认证 + 角色权限
│   ├── seed.py              # 种子数据 + 测试账号
│   ├── middleware.py        # 错误日志中间件
│   ├── celery_app.py        # Celery 配置
│   ├── tasks.py             # 异步任务 (通知/导入导出)
│   ├── crud/
│   │   ├── __init__.py      # CRUD 聚合
│   │   └── base.py          # CRUD 基类
│   └── routers/
│       ├── __init__.py
│       ├── auth.py          # 认证路由
│       ├── users.py         # 用户管理
│       ├── doctors.py       # 医生管理
│       ├── locations.py     # 地点管理
│       ├── volunteers.py    # 志愿者管理
│       ├── medicines.py     # 药品管理
│       ├── schedules.py     # 排班管理
│       ├── medicine_boxes.py # 药品箱管理
│       ├── registrations.py # 患者登记
│       ├── service.py       # 签到+服务记录
│       ├── returns.py       # 物资回收
│       ├── stats.py         # 统计+月度对账
│       └── notifications.py # 通知+日志+队列
├── tests/
│   ├── conftest.py
│   └── test_api.py          # API 测试
├── requirements.txt
├── .env.example
└── README.md
```

---

## 重要声明

1. **处方相关**：本系统仅用于登记处方药品的数量和用法，**不提供任何诊断建议或医疗咨询**。所有诊断和治疗方案由执业医生人工决定。

2. **医疗合规**：使用本系统进行药品管理时，请确保符合当地药监部门规定，注意药品有效期和储存条件。

3. **数据安全**：生产环境请务必：
   - 修改 `SECRET_KEY` 为强随机字符串
   - 启用 HTTPS
   - 配置正确的数据库权限
   - 定期备份数据
