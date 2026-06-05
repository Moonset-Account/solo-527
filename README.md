# 独立影院会员放映策划系统

专为影院策展人设计的真实业务流程管理系统，围绕独立影院的会员放映场景，实现从排片策划到票务核销的完整链路。

## 技术栈

- **后端**: Flask + Flask-SQLAlchemy + Flask-JWT-Extended
- **前端**: React 18 + Ant Design 5 + React Router 6 + Axios
- **数据库**: SQLite (开发环境)
- **其他**: pandas (Excel处理), dayjs (日期处理)

## 核心业务流程

```
影片授权管理 → 片单排期 → 会员报名 → 资格/库存校验
     ↓
候补自动补位 ← 会员退票 ← 人工确认
     ↓
嘉宾邀请 → 嘉宾确认 → 票务核销 → 执行记录 → 月度对账
```

## 目录结构

```
.
├── backend/                 # Flask 后端
│   ├── api/                 # API 路由模块
│   │   ├── auth.py          # 认证与用户管理
│   │   ├── films.py         # 影片管理
│   │   ├── halls.py         # 放映厅管理
│   │   ├── members.py       # 会员管理
│   │   ├── screenings.py    # 排片管理
│   │   ├── bookings.py      # 报名管理
│   │   ├── guests.py        # 嘉宾管理
│   │   ├── reports.py       # 报表与对账
│   │   ├── import_export.py # 导入导出
│   │   └── logs.py          # 日志管理
│   ├── utils/               # 工具模块
│   │   ├── auth.py          # 权限装饰器
│   │   ├── booking_service.py # 核心业务逻辑
│   │   ├── error_handler.py # 全局错误处理
│   │   ├── logger.py        # 日志配置
│   │   ├── notifications.py # 通知生成
│   │   └── seed_data.py     # 测试数据
│   ├── models.py            # 数据模型
│   ├── config.py            # 配置
│   ├── app.py               # 应用入口
│   └── requirements.txt     # 依赖清单
└── frontend/                # React 前端
    ├── src/
    │   ├── pages/           # 页面组件
    │   ├── components/      # 公共组件
    │   ├── services/        # API 服务
    │   ├── App.js           # 路由配置
    │   └── index.js         # 入口文件
    └── package.json
```

## 数据模型

### 1. User (用户表)
系统用户，支持四种角色

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| username | String(80) | 用户名，唯一 |
| email | String(120) | 邮箱，唯一 |
| password_hash | String(255) | 密码哈希 |
| role | String(20) | 角色: admin/curator/frontdesk/finance |
| is_active | Boolean | 是否启用 |

### 2. Film (影片表)
包含授权期限管理

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| title | String(200) | 中文片名 |
| original_title | String(200) | 原文片名 |
| director | String(100) | 导演 |
| year | Integer | 年份 |
| duration | Integer | 片长(分钟) |
| country | String(100) | 国家/地区 |
| license_start_date | Date | 授权开始日期 |
| license_end_date | Date | 授权结束日期 |
| distributor | String(200) | 发行方 |
| license_number | String(100) | 授权编号 |
| status | String(20) | 状态: active/inactive/expired |

**关键方法**: `is_license_valid(date)` - 检查指定日期授权是否有效

### 3. Hall (放映厅表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| name | String(100) | 厅名 |
| capacity | Integer | 座位数 |
| seat_map | JSON | 座位布局 |
| facilities | JSON | 设施列表 |
| is_active | Boolean | 是否启用 |

### 4. MemberLevel (会员等级表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| name | String(50) | 等级名称 |
| description | Text | 等级说明 |
| price | Float | 年费 |
| max_bookings_per_screening | Integer | 单场最大报名数 |
| priority | Integer | 优先级(候补排序用) |
| booking_window_days | Integer | 提前报名天数 |
| max_guests | Integer | 可带嘉宾数 |
| benefits | JSON | 权益列表 |

### 5. Member (会员表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| member_no | String(50) | 会员编号，唯一 |
| name | String(100) | 姓名 |
| phone | String(20) | 手机号 |
| email | String(120) | 邮箱 |
| level_id | Integer | 关联会员等级 |
| join_date | Date | 入会日期 |
| expiry_date | Date | 到期日期 |
| status | String(20) | 状态: active/inactive/expired/suspended |

### 6. Screening (放映场次表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| film_id | Integer | 关联影片 |
| hall_id | Integer | 关联放映厅 |
| start_time | DateTime | 开始时间 |
| end_time | DateTime | 结束时间 |
| capacity | Integer | 本场容量 |
| status | String(20) | 状态: draft/confirmed/cancelled/completed |
| is_member_only | Boolean | 是否仅限会员 |
| allow_waitlist | Boolean | 是否开启候补 |
| curator_notes | Text | 策展人备注 |

**关键方法**:
- `get_confirmed_bookings_count()` - 已确认报名数
- `get_available_seats()` - 剩余座位数
- `is_full()` - 是否满座

### 7. Booking (报名表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| screening_id | Integer | 关联场次 |
| member_id | Integer | 关联会员 |
| booking_no | String(50) | 报名编号，唯一 |
| status | String(20) | 状态: pending/confirmed/waitlisted/cancelled/checked_in/no_show |
| guest_count | Integer | 携带嘉宾数 |
| waitlist_position | Integer | 候补位置 |
| registered_at | DateTime | 登记时间 |
| confirmed_at | DateTime | 确认时间 |
| cancelled_at | DateTime | 取消时间 |
| checked_in_at | DateTime | 签到时间 |

### 8. Guest (嘉宾表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| screening_id | Integer | 关联场次 |
| name | String(100) | 姓名 |
| title | String(100) | 头衔 |
| organization | String(200) | 机构 |
| email | String(120) | 邮箱 |
| status | String(20) | 状态: invited/confirmed/declined/checked_in/no_show |
| seats | JSON | 座位 |

### 9. WaitlistEntry (候补名单表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| screening_id | Integer | 关联场次 |
| member_id | Integer | 关联会员 |
| booking_id | Integer | 关联报名 |
| position | Integer | 候补位置 |
| status | String(20) | 状态: waiting/promoted/expired/cancelled |
| added_at | DateTime | 添加时间 |
| promoted_at | DateTime | 转正时间 |
| notification_sent | Boolean | 是否已发送通知 |

### 10. Notification (通知队列表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| type | String(50) | 通知类型 |
| recipient_type | String(20) | 接收人类型: member/guest/user |
| recipient_email | String(120) | 接收邮箱 |
| subject | String(200) | 标题 |
| content | Text | 内容 |
| status | String(20) | 状态: pending/sent/failed/cancelled |
| sent_at | DateTime | 发送时间 |
| error_message | Text | 错误信息 |
| retry_count | Integer | 重试次数 |

**通知类型**:
- `booking_confirmed`: 报名确认
- `booking_cancelled`: 取消通知
- `waitlist_promoted`: 候补转正
- `screening_reminder`: 放映提醒
- `guest_invitation`: 嘉宾邀请
- `system_alert`: 系统告警

### 11. ImportExportTask (导入导出任务表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| type | String(20) | 类型: import/export |
| entity_type | String(50) | 数据类型: members/films/screenings/bookings/guests |
| status | String(20) | 状态: pending/processing/completed/failed |
| file_name | String(500) | 文件名 |
| file_path | String(500) | 文件路径 |
| total_records | Integer | 总记录数 |
| processed_records | Integer | 已处理数 |
| failed_records | Integer | 失败数 |
| error_log | Text | 错误日志 |

### 12. ErrorLog (错误日志表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| level | String(20) | 级别: debug/info/warning/error/critical |
| message | Text | 错误信息 |
| traceback | Text | 堆栈信息 |
| path | String(500) | 请求路径 |
| method | String(10) | 请求方法 |
| user_id | Integer | 操作用户 |
| ip_address | String(50) | IP地址 |
| created_at | DateTime | 发生时间 |

### 13. CheckInRecord (签到记录表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| screening_id | Integer | 关联场次 |
| booking_id | Integer | 关联报名 |
| guest_id | Integer | 关联嘉宾 |
| check_in_type | String(20) | 类型: member/guest/walk_in |
| checked_in_by | Integer | 操作人 |
| checked_in_at | DateTime | 签到时间 |

### 14. MonthlyReconciliation (月度对账表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| month | String(7) | 月份: YYYY-MM |
| status | String(20) | 状态: draft/reviewed/confirmed/archived |
| total_screenings | Integer | 场次总数 |
| total_bookings | Integer | 报名总数 |
| total_attendance | Integer | 签到总数 |
| total_cancellations | Integer | 取消数 |
| total_no_shows | Integer | 爽约数 |
| total_guests | Integer | 嘉宾数 |
| member_revenue | Float | 会员收入 |
| guest_revenue | Float | 嘉宾收入 |
| total_revenue | Float | 总收入 |

## 访问控制 (RBAC)

基于角色的访问控制矩阵：

| 功能模块 | admin | curator | frontdesk | finance |
|----------|-------|---------|-----------|---------|
| 用户管理 | ✅ | ❌ | ❌ | ❌ |
| 会员等级配置 | ✅ | ❌ | ❌ | ❌ |
| 影片管理 | ✅ | ✅ | ❌ | ❌ |
| 放映厅管理 | ✅ | ✅ | ❌ | ❌ |
| 排片管理 | ✅ | ✅ | ❌ | ❌ |
| 场次确认/取消 | ✅ | ✅ | ❌ | ❌ |
| 会员信息查询 | ✅ | ✅ | ✅ | ✅ |
| 会员信息编辑 | ✅ | ✅ | ❌ | ❌ |
| 报名创建 | ✅ | ✅ | ✅ | ❌ |
| 报名确认/取消 | ✅ | ✅ | ✅ | ❌ |
| 候补处理 | ✅ | ✅ | ❌ | ❌ |
| 嘉宾管理 | ✅ | ✅ | ❌ | ❌ |
| 票务核销 | ✅ | ❌ | ✅ | ❌ |
| 数据统计 | ✅ | ✅ | ✅ | ✅ |
| 月度对账 | ✅ | ❌ | ❌ | ✅ |
| 对账确认 | ✅ | ❌ | ❌ | ✅ |
| 数据导入导出 | ✅ | ✅ | ❌ | ✅ |
| 错误日志查看 | ✅ | ❌ | ❌ | ❌ |
| 通知日志查看 | ✅ | ✅ | ❌ | ✅ |

### 权限装饰器使用

```python
from utils.auth import role_required

@api.route('/some-endpoint', methods=['POST'])
@role_required('admin', 'curator')  # 仅管理员和策展人可访问
def some_endpoint():
    # 业务逻辑
    pass
```

## 核心业务逻辑

### 1. 排片校验机制

**创建场次时自动执行：**

```python
# 1. 检查影片授权是否在有效期内
if not film.is_license_valid(screening.start_time.date()):
    raise BusinessError('影片授权已过期，无法排片')

# 2. 检查放映厅时段冲突
conflict = Screening.query.filter(
    Screening.hall_id == hall_id,
    Screening.status != 'cancelled',
    Screening.start_time < end_time,
    Screening.end_time > start_time
).first()
if conflict:
    raise BusinessError('该时段放映厅已被占用')
```

### 2. 会员报名校验

```python
# 1. 检查会员状态
if not member.is_active_member():
    raise BusinessError('会员状态无效或已过期')

# 2. 检查报名窗口
window_start = screening.start_time - timedelta(days=level.booking_window_days)
if datetime.utcnow() < window_start:
    raise BusinessError(f'该等级会员报名窗口尚未开启，{window_start.date()}后可报名')

# 3. 检查该会员本场已报名数
existing = Booking.query.filter_by(
    screening_id=screening_id,
    member_id=member_id,
    status__in=['pending', 'confirmed', 'waitlisted']
).count()
if existing >= level.max_bookings_per_screening:
    raise BusinessError(f'该等级会员本场最多可报{level.max_bookings_per_screening}个名额')

# 4. 检查库存：满座则进入候补
if screening.is_full():
    if screening.allow_waitlist:
        # 加入候补名单
        booking.status = 'waitlisted'
        booking.waitlist_position = screening.get_waitlist_count() + 1
    else:
        raise BusinessError('本场次已无剩余名额，且不支持候补')
```

### 3. 候补自动补位

**会员退票后自动触发：**

```python
def cancel_booking(booking_id, reason=None):
    booking = Booking.query.get(booking_id)
    booking.status = 'cancelled'
    booking.cancelled_at = datetime.utcnow()
    
    # 触发候补补位
    process_waitlist(booking.screening_id)
    
    # 发送取消通知
    create_notification('booking_cancelled', booking.member, booking)

def process_waitlist(screening_id):
    """按优先级顺序自动转正候补中第一位会员"""
    screening = Screening.query.get(screening_id)
    
    while not screening.is_full():
        # 按会员等级优先级 > 候补时间排序
        waitlist = WaitlistEntry.query.filter_by(
            screening_id=screening_id,
            status='waiting'
        ).join(Member).join(MemberLevel)\
         .order_by(MemberLevel.priority.desc(), WaitlistEntry.added_at.asc())\
         .first()
        
        if not waitlist:
            break
        
        # 转正前再次校验会员资格
        if not waitlist.member.is_active_member():
            waitlist.status = 'expired'
            waitlist.expired_at = datetime.utcnow()
            continue
        
        # 转正
        booking = waitlist.booking
        booking.status = 'confirmed'
        booking.confirmed_at = datetime.utcnow()
        booking.waitlist_position = None
        
        waitlist.status = 'promoted'
        waitlist.promoted_at = datetime.utcnow()
        
        # 发送候补转正通知
        create_notification('waitlist_promoted', waitlist.member, booking)
        
        break
```

### 4. 票务核销

```python
def check_in(booking_no=None, booking_id=None, operator_id=None):
    booking = Booking.query.filter(
        (Booking.booking_no == booking_no) | (Booking.id == booking_id)
    ).first()
    
    if not booking:
        raise BusinessError('报名记录不存在')
    
    if booking.status not in ['confirmed']:
        raise BusinessError(f'当前状态({booking.status})无法签到')
    
    booking.status = 'checked_in'
    booking.checked_in_at = datetime.utcnow()
    booking.checked_in_by = operator_id
    
    # 记录签到流水
    check_in_record = CheckInRecord(
        screening_id=booking.screening_id,
        booking_id=booking.id,
        check_in_type='member',
        checked_in_by=operator_id
    )
    db.session.add(check_in_record)
```

## 异步提醒机制

### 通知类型与触发时机

| 通知类型 | 触发时机 | 接收人 |
|----------|----------|--------|
| 报名确认 | 报名状态变为 confirmed | 会员 |
| 候补转正 | 候补名单补位成功 | 会员 |
| 取消通知 | 报名被取消/场次取消 | 会员 |
| 放映提醒 | 放映前24小时 | 所有已报名会员 |
| 嘉宾邀请 | 创建嘉宾记录时 | 嘉宾 |
| 系统告警 | 发生严重错误时 | 管理员 |

### 通知队列实现

```python
# 创建通知（写入队列，异步发送）
def create_notification(notification_type, recipient, related_obj=None):
    notification = Notification(
        type=notification_type,
        recipient_type='member',
        recipient_id=recipient.id,
        recipient_email=recipient.email,
        subject=get_notification_subject(notification_type, related_obj),
        content=get_notification_content(notification_type, related_obj),
        status='pending'
    )
    db.session.add(notification)
    
    # 实际项目中可使用 Celery 异步发送
    # send_notification_task.delay(notification.id)
```

## 导入导出队列

### 支持的数据类型

- 会员数据 (members)
- 影片数据 (films)
- 场次数据 (screenings)
- 报名数据 (bookings)
- 嘉宾数据 (guests)

### 使用示例

```python
# 导出会员数据
GET /api/ie/export/members
Response: Excel 文件下载

# 导入影片数据
POST /api/ie/import/films
Content-Type: multipart/form-data
Body: file=<Excel文件>
```

### 导入模板格式 (Excel)

**会员导入模板：**

| 会员编号 | 姓名 | 手机号 | 邮箱 | 会员等级 | 入会日期 | 到期日期 |
|----------|------|--------|------|----------|----------|----------|
| M000001 | 张三 | 138xxxx | xx@xx.com | 高级会员 | 2024-01-01 | 2025-01-01 |

## 错误日志系统

### 全局错误捕获

所有 API 异常自动捕获并记录：

```python
@app.errorhandler(Exception)
def handle_exception(e):
    # 记录错误日志
    error_log = ErrorLog(
        level='ERROR' if isinstance(e, Exception) else 'WARNING',
        message=str(e),
        traceback=traceback.format_exc(),
        path=request.path,
        method=request.method,
        user_id=current_user.id if current_user.is_authenticated else None,
        ip_address=request.remote_addr
    )
    db.session.add(error_log)
    db.session.commit()
    
    # 返回统一错误格式
    return jsonify({
        'error': type(e).__name__,
        'message': str(e),
        'code': getattr(e, 'code', 500)
    }), getattr(e, 'code', 500)
```

### 日志查看与清理

- 支持按级别筛选 (ERROR/WARNING/INFO/DEBUG)
- 支持查看堆栈详情
- 支持清理 N 天前的历史日志
- 通知日志支持重试发送

## 快速开始

### 1. 启动后端服务

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 初始化数据库并启动
python app.py
```

服务启动后访问: `http://localhost:5000`

### 2. 启动前端服务

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

服务启动后访问: `http://localhost:3000`

## 测试账号

系统初始化时自动创建以下测试账号：

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | 管理员 | 拥有所有权限 |
| curator | curator123 | 策展人 | 排片、报名、嘉宾管理 |
| frontdesk | frontdesk123 | 前台 | 票务核销、会员查询 |
| finance | finance123 | 财务 | 报表查看、月度对账 |

### 初始化测试数据

系统首次启动时自动创建：
- 4 个测试用户账号（如上表）
- 3 个会员等级（基础会员/高级会员/VIP会员）
- 5 位测试会员
- 5 部测试影片（包含1部已过期影片，用于测试授权校验）
- 4 个放映厅（经典厅/学术厅/VIP厅/实验厅）

## API 接口汇总

### 认证模块
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户
- `POST /api/auth/change-password` - 修改密码
- `GET /api/auth/users` - 用户列表
- `POST /api/auth/users` - 创建用户
- `PUT /api/auth/users/:id` - 更新用户

### 影片管理
- `GET /api/films` - 影片列表
- `GET /api/films/:id` - 影片详情
- `POST /api/films` - 新增影片
- `PUT /api/films/:id` - 更新影片
- `DELETE /api/films/:id` - 删除影片
- `GET /api/films/check-license/:id?date=YYYY-MM-DD` - 检查授权

### 排片管理
- `GET /api/screenings` - 场次列表
- `GET /api/screenings/calendar` - 日历视图
- `POST /api/screenings` - 创建场次
- `PUT /api/screenings/:id` - 更新场次
- `POST /api/screenings/:id/confirm` - 确认场次
- `POST /api/screenings/:id/cancel` - 取消场次
- `POST /api/screenings/:id/complete` - 完成场次

### 报名管理
- `GET /api/bookings` - 报名列表
- `POST /api/bookings` - 创建报名
- `POST /api/bookings/:id/confirm` - 确认报名
- `POST /api/bookings/:id/cancel` - 取消报名
- `POST /api/bookings/:id/check-in` - 签到核销
- `GET /api/bookings/by-booking-no/:no` - 按编号查询
- `GET /api/bookings/screening/:id/waitlist` - 候补列表
- `POST /api/bookings/screening/:id/process-waitlist` - 处理候补

### 嘉宾管理
- `GET /api/guests` - 嘉宾列表
- `POST /api/guests` - 新增嘉宾
- `POST /api/guests/:id/confirm` - 确认出席
- `POST /api/guests/:id/decline` - 婉拒
- `POST /api/guests/:id/check-in` - 嘉宾签到
- `POST /api/guests/send-invitation/:id` - 发送邀请

### 报表对账
- `GET /api/reports/dashboard` - 仪表盘数据
- `GET /api/reports/screenings/stats` - 场次统计
- `GET /api/reports/members/stats` - 会员统计
- `GET /api/reports/reconciliation` - 对账列表
- `POST /api/reports/reconciliation/generate` - 生成对账
- `POST /api/reports/reconciliation/:id/confirm` - 确认对账

### 导入导出
- `GET /api/ie/tasks` - 任务列表
- `GET /api/ie/export/:type` - 导出数据
- `POST /api/ie/import/:type` - 导入数据

### 日志管理
- `GET /api/logs/errors` - 错误日志
- `GET /api/logs/errors/:id` - 错误详情
- `DELETE /api/logs/errors?days=30` - 清理过期日志
- `GET /api/logs/notifications` - 通知日志
- `POST /api/logs/notifications/:id/retry` - 重试发送

## 注意事项

1. **影片授权校验**: 排片时会自动检查影片在放映日期的授权状态，已过期影片无法排新场次
2. **候补补位**: 会员退票后系统自动按"会员等级优先级 > 候补时间"顺序补位，补位成功会发送通知
3. **报名窗口**: 不同等级会员有不同的提前报名天数，未到报名窗口无法报名
4. **签到核销**: 只有 confirmed 状态的报名可以签到，签到后状态变为 checked_in
5. **数据导入**: 大型文件建议分批导入，导入过程在后台执行，可在任务列表查看进度

## License

MIT
