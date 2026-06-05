# 剧场排练室排期系统

面向校内话剧社的排练室排期管理系统，基于 Django + Alpine.js + Celery + PostgreSQL 构建。

## 功能特性

### 🎭 核心功能
- **日历排期**: 可视化日历视图，支持按排练室筛选，直观查看所有排练安排
- **排练需求提交**: 导演可选择剧目、成员、道具和时段提交排练申请
- **冲突检测**: 自动检测排练室时段冲突、容量检查、灯光设备匹配
- **审批流程**: 管理员审核排练申请，可通过或拒绝并填写理由
- **成员权限**: 导演、演员、管理员三级权限体系
- **道具管理**: 道具分类管理、库存追踪、占用记录
- **消息通知**: 排练变动、取消、维修等事件自动发送通知给所有成员（站内信+邮件）
- **临时换场**: 修改排练信息自动通知所有相关成员
- **签到系统**: 成员签到，自动识别迟到（超过10分钟标记）
- **出勤统计**: 排练出勤率统计，方便复盘排练效率
- **演出周保护**: 演出周的排练不能被普通成员取消
- **排练室维修**: 维修期间自动取消相关排练并释放道具占用
- **后台导出**: 支持多种数据格式导出（Excel、CSV等）

### 🛠 技术栈
- **后端**: Django 4.2 + Django REST Framework
- **前端**: Alpine.js + Tailwind CSS + FullCalendar
- **异步任务**: Celery + Redis
- **数据库**: PostgreSQL
- **数据导出**: django-import-export

## 快速开始

### 环境要求
- Python 3.8+
- PostgreSQL
- Redis
- Node.js (可选，用于前端构建)

### 安装步骤

1. **克隆项目并安装依赖**
```bash
cd theater-scheduling
pip install -r requirements.txt
```

2. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

3. **数据库迁移**
```bash
python manage.py migrate
```

4. **初始化示例数据**
```bash
python manage.py init_data
```

5. **启动服务**
```bash
# 启动 Django 开发服务器
python manage.py runserver

# 另开终端启动 Celery Worker
celery -A theater_scheduling worker -l info

# 另开终端启动 Celery Beat (定时任务)
celery -A theater_scheduling beat -l info
```

6. **访问系统**
- 前台地址: http://localhost:8000
- 管理后台: http://localhost:8000/admin

### 测试账号
| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 导演 | director1 | 123456 |
| 演员 | actor1 | 123456 |
| 演员 | actor2 | 123456 |

## 项目结构

```
theater-scheduling/
├── theater_scheduling/     # 项目主配置
│   ├── __init__.py
│   ├── celery.py          # Celery 配置
│   ├── settings.py        # Django 设置
│   ├── urls.py            # 根路由
│   └── wsgi.py
├── rehearsal/             # 排期应用
│   ├── migrations/        # 数据库迁移
│   ├── management/        # 管理命令
│   ├── admin.py           # 管理后台配置
│   ├── apps.py
│   ├── forms.py           # 表单定义
│   ├── models.py          # 数据模型
│   ├── signals.py         # 信号处理
│   ├── tasks.py           # Celery 异步任务
│   ├── urls.py            # 路由配置
│   └── views.py           # 视图函数
├── templates/             # 模板文件
│   ├── base.html
│   └── rehearsal/
├── static/                # 静态文件
├── media/                 # 媒体文件
├── manage.py
├── requirements.txt
└── .env.example
```

## 核心业务规则

### 权限控制
- **管理员**: 可审批、修改、取消所有排练，管理排练室、道具、成员
- **导演**: 可提交排练需求，编辑自己的排练（非演出周）
- **演员**: 可查看排期、签到、查看消息
- **演出周限制**: 演出前7天至演出日期间的排练，普通成员不可取消

### 冲突检测规则
- 同一排练室同一时段不能有多个排练
- 参与人数不能超过排练室容量
- 需要灯光的排练必须安排在有灯光设备的排练室

### 迟到判定
- 迟到阈值: 10分钟（可在 settings 中配置）
- 签到时间超过开始时间10分钟标记为迟到

### 道具管理
- 创建排练时可选择需要使用的道具
- 排练取消或完成时道具自动归还
- 排练室维修时自动释放相关道具

## API 接口

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/calendar/events/` | GET | 获取日历事件数据 |
| `/api/check-conflict/` | GET | 检测排练冲突 |
| `/rehearsals/<id>/check-in/` | POST | 成员签到 |

## 开发说明

### 添加新的模型
1. 在 `rehearsal/models.py` 中定义模型
2. 运行 `python manage.py makemigrations` 生成迁移
3. 运行 `python manage.py migrate` 应用迁移
4. 在 `rehearsal/admin.py` 中注册到管理后台

### 添加新的异步任务
1. 在 `rehearsal/tasks.py` 中定义任务函数
2. 使用 `@shared_task` 装饰器
3. 调用时使用 `task_name.delay(*args)`

## License

MIT
