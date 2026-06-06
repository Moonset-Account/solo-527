# 绘本馆借阅与活动平台

基于 Django + Vue + PostgreSQL 构建的绘本馆综合管理平台，服务于家庭会员和馆员。

## 项目架构

```
question-085/
├── backend/                 # Django 后端
│   ├── books/               # 绘本管理模块
│   ├── members/             # 会员管理模块
│   ├── borrows/             # 借阅管理模块（借阅核销）
│   ├── activities/          # 活动管理模块（活动名额、候补转正）
│   ├── deposits/            # 押金管理模块（押金流水、申诉）
│   ├── repairs/             # 修复管理模块（修复状态、破损录入）
│   ├── dashboard/           # 仪表板模块（第一屏）
│   ├── tests/               # 单元测试（含三组核心样例）
│   ├── library_system/      # Django 项目配置
│   └── requirements.txt     # Python 依赖
├── frontend/                # Vue 3 前端
│   ├── src/
│   │   ├── views/
│   │   │   ├── librarian/   # 馆员端页面
│   │   │   └── parent/      # 家长端页面
│   │   ├── router/          # 路由配置
│   │   └── App.vue
│   └── package.json
└── README.md
```

## 核心功能模块

### 1. 借阅核销模块
- 绘本借出、归还核销
- 续借管理（最多2次）
- 逾期自动检测
- 借阅历史记录

### 2. 修复状态模块
- 馆员录入破损（上传照片 + 选择破损程度）
- 破损程度：轻微磨损 / 影响阅读 / 需下架
- 系统自动判断是否暂停借出
- 修复状态流转：待修复 → 修复中 → 已修复

### 3. 活动名额模块
- 活动创建与名额管理
- 满员自动进入候补列表
- 取消报名自动触发候补转正
- 候补排位自动更新

### 4. 押金流水模块
- 押金充值、扣减、退还
- 完整交易流水记录
- 余额不足自动标记异常
- 家长端押金扣减确认

### 5. 逾期提醒模块
- 自动检测逾期借阅
- 仪表板今日待归还展示
- 逾期状态标签标识

### 6. 会员权限模块
- 馆员/家长双角色体系
- 基于角色的权限控制
- 家长端数据隔离（只能看自家数据）

## 第一屏仪表板（馆员端）

展示五项核心数据：
1. **今日待归还** - 今日到期及已逾期的借阅记录
2. **待修复绘本** - 待修复和修复中的破损绘本
3. **故事会候补** - 有待补人员的活动及候补列表
4. **押金异常** - 余额不足等异常账户
5. **即将满额** - 名额使用率≥80%的活动

## 家长端功能

- 我的借阅：查看自家借阅记录、续借
- 活动报名：浏览活动、报名/候补、查看候补排位
- 押金账户：查看余额、交易流水、押金申诉

## 三组核心样例

### 样例一：破损绘本不能再次借出

**测试文件**：`backend/tests/test_damage_book.py`

场景流程：
1. 绘本正常借出
2. 归还时发现破损，馆员录入破损信息
3. 选择"影响阅读"或"需下架"级别
4. 系统自动将绘本状态设为"已下架"
5. 该绘本无法再次被借阅

运行测试：
```bash
cd backend
python manage.py test tests.test_damage_book
```

### 样例二：候补转正

**测试文件**：`backend/tests/test_waitlist_promotion.py`

场景流程：
1. 活动名额3个，3位家长报名成功
2. 第4、5位家长报名，自动进入候补（排位1、2）
3. 已报名的某位家长取消报名
4. 系统自动将候补第1位转正为已确认
5. 候补排位自动更新

运行测试：
```bash
cd backend
python manage.py test tests.test_waitlist_promotion
```

### 样例三：押金申诉

**测试文件**：`backend/tests/test_deposit_appeal.py`

场景流程：
1. 系统扣减押金50元（绘本破损赔偿）
2. 家长端看到扣减记录，发起申诉
3. 填写申诉原因并提交
4. 馆员端看到待处理申诉
5. 馆员审核：可通过并调整金额，或驳回

运行测试：
```bash
cd backend
python manage.py test tests.test_deposit_appeal
```

## 快速启动

### 环境要求
- Python 3.9+
- Node.js 16+
- PostgreSQL 12+

### 数据库准备

```sql
-- 创建数据库
CREATE DATABASE library_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE library_db TO postgres;
```

### 后端启动

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 检查应用注册（验证 dashboard 等应用已正确安装）
python manage.py check

# 数据库迁移（仅对有模型的应用生成迁移）
python manage.py makemigrations books members borrows activities deposits repairs
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 运行测试（验证三组核心样例：破损绘本暂停借出、候补转正、押金申诉）
python manage.py test tests -v 2

# 初始化演示数据（可选，用于验证家长端数据隔离）
python manage.py shell < scripts/init_demo_data.py

# 启动开发服务器
python manage.py runserver 8000
```

**验证后端是否正常：**
- 访问 API 根目录：`http://localhost:8000/api/`
- 访问馆员仪表板：`http://localhost:8000/api/dashboard/librarian/`
- 验证三组样例测试通过：`python manage.py test tests`

> **注意**：`dashboard` 应用无数据库模型，因此不需要单独 `makemigrations`，
> 但已在 `INSTALLED_APPS` 中注册以提供 API 接口。

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端访问：`http://localhost:5173`

## API 接口列表

### 绘本管理
- `GET /api/books/` - 绘本列表
- `POST /api/books/` - 新增绘本
- `POST /api/books/{id}/mark_damaged/` - 标记破损

### 借阅管理
- `GET /api/borrows/` - 借阅列表
- `POST /api/borrows/` - 创建借阅
- `POST /api/borrows/{id}/return_book/` - 归还核销
- `POST /api/borrows/{id}/renew/` - 续借
- `GET /api/borrows/my_borrows/` - 我的借阅（家长端）

### 活动管理
- `GET /api/activities/` - 活动列表
- `POST /api/activities/{id}/register/` - 活动报名
- `GET /api/activities/my_registrations/` - 我的报名
- `POST /api/activities/registrations/{id}/cancel/` - 取消报名

### 押金管理
- `GET /api/deposits/accounts/my_account/` - 我的押金账户
- `GET /api/deposits/transactions/my_transactions/` - 我的交易流水
- `POST /api/deposits/transactions/{id}/appeal/` - 申诉
- `POST /api/deposits/transactions/{id}/resolve_appeal/` - 处理申诉

### 修复管理
- `GET /api/repairs/` - 修复记录列表
- `POST /api/repairs/` - 录入破损
- `POST /api/repairs/{id}/start_repair/` - 开始修复
- `POST /api/repairs/{id}/complete_repair/` - 完成修复

### 仪表板
- `GET /api/dashboard/librarian/` - 馆员端第一屏数据

## 数据库模型关系

```
User (Django内置)
  │
  └── Member (会员信息: 角色、家庭名、孩子信息)
       │
       ├── Borrow ←── Book (借阅关系)
       │
       ├── Registration ←── Activity (活动报名)
       │
       ├── DepositAccount → DepositTransaction (押金账户与流水)
       │
       └── RepairRecord (修复记录，关联Book和Borrow)
```

## 破损程度与绘本状态对应关系

| 破损程度 | 绘本状态 | 是否可借阅 |
|---------|---------|-----------|
| 轻微磨损 | 破损待修 | 否 |
| 影响阅读 | 已下架 | 否 |
| 需下架 | 已下架 | 否 |

修复完成后，绘本状态恢复为"可借阅"。
