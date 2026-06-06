# 手术室耗材备包系统

基于 Django + PostgreSQL + Celery 构建的手术室耗材备包管理系统。

## 功能模块

### 1. 术式模板管理
- 支持创建、编辑、删除术式模板
- 每个模板可配置必备耗材、高值耗材、器械包
- 支持按科室分类管理

### 2. 批号库存管理
- 耗材信息维护（名称、编码、规格、单价、预警阈值）
- 批号管理（生产日期、有效期、存放位置、供应商）
- 自动过期检查与标记
- 有效期预警（提前30天）

### 3. 手术排班与备包清单
- 按日期和手术室排班
- 自动根据术式模板生成备包清单
- 显示必备耗材、高值耗材、批号、有效期、器械包位置
- 备包状态跟踪（已排班→备包中→已备妥→进行中→已完成）

### 4. 扫码领用与双人确认
- 扫码记录耗材领用
- 高值耗材自动创建审计记录
- 双人确认机制（操作人与确认人不能相同）

### 5. 换术式校验
- 支持临时更换术式
- 自动校验已备物品：
  - 列出需要补充的物品
  - 列出需要退回的物品
  - 检查批号是否过期
  - 检查批号是否即将过期

### 6. 退包盘点
- 支持三种退包状态：未拆封、已拆封、需报损
- 高值耗材退包自动记录审计
- 双人确认机制

### 7. 库存预警
- 库存不足预警
- 即将过期预警
- 已过期预警
- Celery 异步任务定时检查

### 8. 高值耗材审计报表
- 高值耗材使用、退回、报损全流程审计
- 按时间段统计报表
- 按耗材类型统计
- 审核功能

## 技术架构

- **后端框架**: Django 4.2
- **数据库**: PostgreSQL
- **异步任务**: Celery + Redis
- **API**: Django REST Framework
- **数据过滤**: django-filter

## 项目结构

```
ORSupplySystem/
├── __init__.py
├── settings.py          # 项目配置
├── urls.py              # 总路由
├── celery.py            # Celery 配置
├── wsgi.py
└── asgi.py

inventory/               # 库存管理应用
├── models.py            # 数据模型
├── views.py             # API 视图
├── serializers.py       # 序列化器
├── urls.py              # 路由
├── admin.py             # 后台管理
├── tasks.py             # Celery 任务
└── apps.py

surgery/                 # 手术管理应用
├── models.py            # 数据模型
├── views.py             # API 视图
├── serializers.py       # 序列化器
├── urls.py              # 路由
├── admin.py             # 后台管理
├── management/
│   └── commands/
│       └── init_test_data.py  # 测试数据初始化
└── apps.py
```

## 核心数据模型

### inventory 应用
- `SupplyCategory`: 耗材分类
- `Supply`: 耗材信息（普通/高值/器械包）
- `Batch`: 批号库存
- `ScanRecord`: 扫码记录
- `StockWarning`: 库存预警

### surgery 应用
- `SurgicalTemplate`: 术式模板
- `TemplateSupplyItem`: 模板耗材项
- `OperationSchedule`: 手术排班
- `PreparedItem`: 备包物品
- `UsageRecord`: 领用记录
- `ReturnRecord`: 退包记录
- `HighValueAudit`: 高值耗材审计

## 快速开始

### 1. 环境准备

```bash
# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 2. 数据库配置

确保 PostgreSQL 已安装并运行，创建数据库：

```sql
CREATE DATABASE or_supply_system;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE or_supply_system TO postgres;
```

### 3. 数据库迁移

```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. 初始化测试数据

```bash
python manage.py init_test_data
```

测试数据包含三类验收场景：
1. **换术式数据**: 患者李四(P20240002) 已从阑尾切除术更换为髋关节置换术
2. **退包数据**: 患者王五(P20240003) 术后退包，包含未拆封和已拆封物品
3. **批号过期数据**: 缝合线(FH20230001)和人工髋关节(RGK20230001)批号已过期

默认账号：
- 管理员: admin / admin123456
- 护士: nurse1 / nurse123456
- 护士: nurse2 / nurse123456

### 5. 启动服务

```bash
# 启动 Django 开发服务器
python manage.py runserver

# 启动 Celery Worker（另开终端）
celery -A ORSupplySystem worker -l info

# 启动 Celery Beat（定时任务，另开终端）
celery -A ORSupplySystem beat -l info
```

### 6. 访问系统

- 后台管理: http://localhost:8000/admin/
- API 文档: 可通过 DRF 自带的 browsable API 访问各接口

## API 接口列表

### 库存管理 (/api/inventory/)
- `GET/POST /categories/` - 耗材分类
- `GET/POST /supplies/` - 耗材信息
- `GET /supplies/{id}/batches/` - 获取耗材的所有批号
- `GET/POST /batches/` - 批号库存
- `POST /batches/check_expired/` - 触发过期检查任务
- `POST /batches/{id}/check_single_expired/` - 检查单个批号
- `GET/POST /scans/` - 扫码记录
- `POST /scans/{id}/confirm/` - 双人确认
- `GET /warnings/` - 库存预警
- `POST /warnings/check_stock/` - 触发库存检查任务
- `POST /warnings/{id}/handle/` - 处理预警

### 手术管理 (/api/surgery/)
- `GET/POST /templates/` - 术式模板
- `GET /templates/{id}/packing_list/` - 获取模板备包清单
- `GET/POST /template-items/` - 模板耗材项
- `GET/POST /schedules/` - 手术排班
- `GET /schedules/today_schedule/` - 今日排班
- `POST /schedules/{id}/generate_packing_list/` - 生成备包清单
- `POST /schedules/{id}/validate_items/` - 校验备包物品
- `POST /schedules/{id}/change_template/` - 更换术式
- `GET/POST /prepared-items/` - 备包物品
- `POST /prepared-items/{id}/verify/` - 核对物品
- `POST /prepared-items/{id}/assign_batch/` - 分配批号
- `GET/POST /usage-records/` - 领用记录
- `POST /usage-records/{id}/confirm/` - 领用确认
- `POST /usage-records/{id}/scan/` - 扫码领用
- `GET/POST /return-records/` - 退包记录
- `POST /return-records/{id}/confirm/` - 退包确认
- `GET /high-value-audits/` - 高值耗材审计
- `POST /high-value-audits/{id}/audit/` - 审核
- `GET /high-value-audits/report/` - 审计报表

## 验收数据说明

### 1. 换术式验收
- 手术: P20240002 李四
- 原术式: 阑尾切除术 (OP002)
- 新术式: 髋关节置换术 (OP001)
- 校验结果:
  - 需要补充: 纱布块、缝合线、人工髋关节、骨科基础器械包、留置针
  - 需要退回: 腹部手术器械包
  - 数量调整: 手术衣(3→4)、手套(4→6)、注射器(3→5)

### 2. 退包验收
- 手术: P20240003 王五 (阑尾切除术)
- 退包记录:
  - 一次性手术衣 x1: 未拆封 (已双人确认)
  - 纱布块 x2: 已拆封 (待确认)

### 3. 批号过期验收
- 过期批号:
  - 缝合线 (FH-001): 批号 FH20230001，过期30天
  - 人工髋关节 (RGK-001): 批号 RGK20230001，过期7天
- 系统校验: 过期批号不能分配到备包物品，不能进入手术间

## 关键业务规则

1. **过期批号管控**: 过期批号不能分配给备包物品，保存时自动校验
2. **双人确认**: 操作人与确认人必须为不同用户
3. **高值耗材审计**: 高值耗材的领用、退回、报损自动创建审计记录
4. **换术式校验**: 自动对比新旧术式模板的差异，列出补充/退回/更换项
5. **库存预警**: 低于阈值或即将过期自动创建预警记录
