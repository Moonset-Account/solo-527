# 科研伦理材料流转系统

面向课题组秘书的科研伦理材料审查管理系统，支持材料提交、预审、评审、补件、归档全流程。

## 技术栈

- **后端**: Django 5.0 + Django REST Framework
- **前端**: Alpine.js + Tailwind CSS
- **异步任务**: Celery + Redis
- **数据库**: PostgreSQL
- **导出**: openpyxl (Excel)

## 核心功能

### 1. 用户角色与权限
- **研究者**: 创建课题、上传材料、提交补件
- **秘书**: 预审材料、分配评审、汇总意见、归档、导出
- **伦理委员**: 查看分配的课题、提交评审意见
- **管理员**: 系统管理、全部权限

### 2. 材料版本管理
- 每种材料支持多版本
- 版本历史可追溯
- 已归档版本只读，不可修改

### 3. 评审流程
- 研究者提交 → 秘书预审 → 分配伦理委员 → 委员评审
- 评审意见可关联具体条款
- 补件时必须标注回应了哪条意见
- 意见状态：待处理 → 已回应 → 已接受

### 4. 按条款汇总意见
- 评审意见按条款自动分组显示
- 导出审查表时按条款合并展示

### 5. 邮件提醒
- 课题提交通知秘书
- 评审任务分配通知委员
- 新意见通知研究者
- 补件提交通知秘书
- 归档通知研究者

### 6. 导出与筛选条件留存
- 批量导出审查表（Excel）
- 单个课题导出完整档案
- 导出时自动记录筛选条件
- 导出日志可复盘还原操作现场

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

### 3. 准备数据库

确保 PostgreSQL 和 Redis 服务已启动，然后创建数据库：

```sql
CREATE DATABASE ethics_review;
CREATE USER ethics WITH PASSWORD 'ethics';
GRANT ALL PRIVILEGES ON DATABASE ethics_review TO ethics;
```

### 4. 数据库迁移

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. 初始化基础数据

```bash
python manage.py init_ethics_data
```

此命令会创建：
- 5 种材料类型（知情同意书、招募海报、调查问卷等）
- 9 条标准评审条款（分 4 大类）

### 6. 创建超级用户

```bash
python manage.py createsuperuser
```

### 7. 启动服务

启动 Django 开发服务器：
```bash
python manage.py runserver
```

启动 Celery Worker（另开终端）：
```bash
celery -A config worker --loglevel=info
```

### 8. 访问系统

- 前台: http://localhost:8000
- 后台管理: http://localhost:8000/admin

## 业务流程

### 标准流程
1. **研究者** 创建课题，上传知情同意书、招募海报、问卷等材料
2. **研究者** 提交课题进行预审
3. **秘书** 预审材料格式，可开始预审流程
4. **秘书** 分配伦理委员及负责的材料类型
5. **伦理委员** 查看分配的课题，提交评审意见（可关联条款）
6. **秘书** 汇总意见，要求补件或归档
7. 如需补件：**研究者** 上传新版本材料，提交补件时标注回应的意见
8. **秘书** 最终归档课题，归档后只读

### 数据模型关系
```
Project (课题)
├── Material (材料) - 按类型区分
│   └── MaterialVersion (材料版本)
│       ├── ReviewComment (评审意见)
│       │   └── ReviewClause (评审条款)
│       └── Resubmission (补件记录)
│           └── addressed_comments (回应的意见，多对多)
├── ReviewAssignment (评审分配)
│   ├── committee_member (伦理委员)
│   └── material_types (负责材料类型)
└── ExportLog (导出日志) - 记录筛选条件
```

## API 接口

系统提供 RESTful API：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/projects/` | GET | 课题列表（支持筛选、搜索、排序） |
| `/api/projects/<id>/` | GET | 课题详情 |
| `/api/projects/<id>/materials/` | GET | 课题材料及版本 |
| `/api/projects/<id>/comments/` | GET | 课题评审意见 |
| `/api/projects/<id>/resubmissions/` | GET | 课题补件记录 |
| `/api/material-versions/` | GET | 材料版本列表 |
| `/api/review-comments/` | GET | 评审意见列表 |

## 目录结构

```
├── config/              # 项目配置
│   ├── settings.py      # Django 配置
│   ├── celery.py        # Celery 配置
│   └── urls.py          # 主路由
├── users/               # 用户应用
│   ├── models.py        # 自定义用户模型
│   └── admin.py         # 用户后台
├── ethics/              # 伦理审查核心应用
│   ├── models.py        # 核心数据模型
│   ├── views.py         # 页面视图
│   ├── api.py           # API 视图
│   ├── serializers.py   # DRF 序列化器
│   ├── forms.py         # 表单
│   ├── admin.py         # 后台管理
│   ├── tasks.py         # Celery 任务
│   ├── signals.py       # 信号处理器
│   ├── utils.py         # 导出工具
│   └── management/      # 管理命令
├── templates/           # 模板
│   ├── base.html        # 基础布局
│   ├── dashboard.html   # 仪表盘
│   ├── project_*.html   # 课题相关页面
│   └── emails/          # 邮件模板
├── static/              # 静态文件
├── media/               # 上传文件
├── manage.py
├── requirements.txt
└── .env.example
```
