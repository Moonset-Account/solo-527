# 博物馆研学活动报名平台 - API 调用示例（完整版）

## 认证方式
使用 Devise Token Auth，登录后获取 token

```bash
POST /auth/sign_in
Content-Type: application/json

{
  "email": "admin@museum.com",
  "password": "password123"
}
```

---

## 📑 1. 分页列表接口（所有列表统一格式）

### 统一响应格式
```json
{
  "data": [
    { "id": 1, "...": "..." }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_pages": 5,
    "total_count": 95
  }
}
```

### 1.1 课程列表（支持 Ransack 搜索）
```bash
# 基础分页
GET /api/v1/courses?page=1&per_page=10

# 按标题搜索
GET /api/v1/courses?q[title_cont]=考古

# 按状态筛选
GET /api/v1/courses?q[status_eq]=published

# 按年龄段筛选
GET /api/v1/courses?q[age_min_gteq]=6&q[age_max_lteq]=12

# 组合搜索
GET /api/v1/courses?q[title_cont]=青铜&q[status_eq]=published&page=1&per_page=10
```

### 1.2 报名列表（自动脱敏 + 搜索）
```bash
# 基础分页
GET /api/v1/bookings?page=1&per_page=20

# 按学校筛选
GET /api/v1/bookings?q[school_id_eq]=1

# 按状态筛选
GET /api/v1/bookings?q[status_eq]=confirmed

# 按报名类型
GET /api/v1/bookings?q[booking_type_eq]=school_group

# 组合
GET /api/v1/bookings?q[status_eq]=pending&q[school_id_eq]=1&page=1
```

### 1.3 学生列表（按角色自动脱敏）
```bash
# 基础分页
GET /api/v1/students?page=1&per_page=20

# 按学校筛选
GET /api/v1/students?q[school_id_eq]=1

# 按年级筛选
GET /api/v1/students?q[grade_eq]=4

# 按姓名搜索
GET /api/v1/students?q[name_cont]=张
```

### 1.4 讲解员列表
```bash
# 基础分页
GET /api/v1/guides?page=1&per_page=20

# 仅活跃讲解员
GET /api/v1/guides?q[status_eq]=active

# 按专业特长搜索
GET /api/v1/guides?q[specialty_cont]=青铜器
```

### 1.5 其他列表接口
- 场次列表: `GET /api/v1/course_sessions?page=1`
- 学校列表: `GET /api/v1/schools?page=1`
- 教具列表: `GET /api/v1/teaching_aids?page=1`
- 反馈列表: `GET /api/v1/feedbacks?page=1`
- 排班列表: `GET /api/v1/guide_assignments?page=1`

---

## 📊 2. 看板接口（多维度筛选）

### 2.1 看板概览（筛选参数全局生效）

**筛选参数（所有看板接口通用）：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `start_date` | date | 开始日期 (YYYY-MM-DD) |
| `end_date` | date | 结束日期 (YYYY-MM-DD) |
| `status` | string | 状态：`pending/confirmed/scheduled/in_progress/completed` |
| `responsible_id` | int | 负责人（创建人）用户 ID |
| `assigned_by_id` | int | 同 responsible_id（别名） |
| `created_by_id` | int | 同 responsible_id（别名） |
| `school_id` | int | 学校 ID |
| `guide_id` | int | 讲解员 ID |

```bash
# 无筛选的概览
GET /api/v1/dashboard/overview

# 按时间范围筛选
GET /api/v1/dashboard/overview?start_date=2026-06-01&end_date=2026-06-30

# 按状态筛选（只看 pending）
GET /api/v1/dashboard/overview?status=pending

# 按负责人筛选
GET /api/v1/dashboard/overview?responsible_id=1

# 组合筛选（时间 + 状态 + 负责人）
GET /api/v1/dashboard/overview?start_date=2026-06-01&end_date=2026-06-30&status=pending&responsible_id=1
```

**响应:**
```json
{
  "stats": {
    "upcoming_sessions": 5,
    "pending_bookings": 3,
    "active_guides": 8,
    "total_students": 120,
    "today_sessions": 2,
    "today_check_ins": 45
  },
  "sessions_by_status": {
    "scheduled": 5,
    "completed": 12,
    "cancelled": 1
  },
  "bookings_by_type": {
    "school_group": 15,
    "individual": 8
  },
  "bookings_by_status": {
    "pending": 3,
    "confirmed": 18,
    "cancelled": 2
  }
}
```

### 2.2 讲解员利用率（筛选参数生效）
```bash
# 默认 30 天
GET /api/v1/dashboard/guide_utilization

# 指定天数
GET /api/v1/dashboard/guide_utilization?days=15

# 带时间筛选
GET /api/v1/dashboard/guide_utilization?start_date=2026-06-01&end_date=2026-06-30
```

**响应:**
```json
[
  {
    "guide_id": 1,
    "guide_name": "王老师",
    "working_days": 12,
    "total_assignments": 15,
    "utilization_rate": 40.0
  }
]
```

### 2.3 场次上座率（筛选参数生效）
```bash
GET /api/v1/dashboard/session_occupancy?start_date=2026-06-01&end_date=2026-06-30
```

**响应:**
```json
[
  {
    "session_id": 1,
    "course_title": "青铜时代的秘密",
    "start_time": "2026-06-10T09:00:00.000Z",
    "capacity": 30,
    "booked": 25,
    "occupancy_rate": 83.3
  }
]
```

### 2.4 瓶颈分析（排查环节卡住）
```bash
# 默认 30 天
GET /api/v1/dashboard/bottlenecks

# 带筛选
GET /api/v1/dashboard/bottlenecks?start_date=2026-06-01&end_date=2026-06-30&days=30
```

**响应:**
```json
{
  "low_occupancy_sessions": [
    {
      "session_id": 3,
      "course_title": "中国书画入门",
      "start_time": "2026-06-10T09:00:00.000Z",
      "max_participants": 30,
      "booked_count": 10,
      "occupancy_rate": 33.3
    }
  ],
  "underutilized_guides": [
    {
      "guide_id": 2,
      "guide_name": "李老师",
      "assignments_count": 2,
      "utilization_rate": 6.7
    }
  ],
  "pending_bookings": [
    {
      "id": 5,
      "status": "pending",
      "created_at": "2026-06-01T10:00:00.000Z",
      "course_session": { "id": 2, "start_time": "2026-06-15T09:00:00.000Z" },
      "school": { "id": 1, "name": "第一实验小学" }
    }
  ],
  "upcoming_without_guides": [
    {
      "id": 7,
      "start_time": "2026-06-15T09:00:00.000Z",
      "course": { "id": 3, "title": "小小考古学家" }
    }
  ]
}
```

---

## 📤 3. 数据导出接口（可追踪 + 角色脱敏）

### 3.1 创建导出任务

**两种调用方式（等效）：**

```bash
# 方式1: 看板接口（兼容旧版）
POST /api/v1/dashboard/exports
Content-Type: application/json

{
  "type": "bookings",
  "filters": {
    "start_date": "2026-06-01",
    "end_date": "2026-06-30",
    "status": "confirmed",
    "school_id": 1
  }
}

# 方式2: 导出专用接口（推荐）
POST /api/v1/exports
Content-Type: application/json

{
  "export_type": "bookings",
  "filters": {
    "start_date": "2026-06-01",
    "end_date": "2026-06-30",
    "status": "confirmed",
    "school_id": 1,
    "responsible_id": 1
  }
}
```

**导出类型 `export_type`:**
- `bookings` - 报名列表 + 学生名单（2个 Sheet）
- `guide_schedule` - 讲解员排班表
- `students` - 学生名单

**筛选参数 `filters`:**

| 参数 | 适用类型 | 说明 |
|------|---------|------|
| `start_date` | 全部 | 开始日期 |
| `end_date` | 全部 | 结束日期 |
| `status` | bookings, guide_schedule | 状态 |
| `booking_type` | bookings | `school_group` / `individual` |
| `school_id` | bookings, students | 学校 ID |
| `responsible_id` | bookings | 负责人 ID |
| `guide_id` | guide_schedule | 讲解员 ID |
| `grade` | students | 年级 |

**响应:**
```json
{
  "message": "导出任务已开始，完成后将可下载",
  "export": {
    "id": 5,
    "export_type": "bookings",
    "status": "pending",
    "filters": {
      "start_date": "2026-06-01",
      "end_date": "2026-06-30",
      "status": "confirmed"
    },
    "created_at": "2026-06-06T12:00:00.000Z",
    "download_url": "/api/v1/exports/5/download"
  }
}
```

### 3.2 查看导出列表
```bash
GET /api/v1/exports?page=1&per_page=10
```

**响应:**
```json
{
  "data": [
    {
      "id": 5,
      "export_type": "bookings",
      "status": "completed",
      "filename": "bookings_20260606120000.xlsx",
      "file_size": 24576,
      "created_at": "2026-06-06T12:00:00.000Z",
      "download_url": "/api/v1/exports/5/download"
    },
    {
      "id": 4,
      "export_type": "guide_schedule",
      "status": "processing",
      "created_at": "2026-06-06T11:30:00.000Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total_pages": 3,
    "total_count": 25
  }
}
```

**导出状态 `status`:**
- `pending` - 等待处理
- `processing` - 正在生成
- `completed` - 完成，可下载
- `failed` - 失败

### 3.3 查看单个导出状态
```bash
GET /api/v1/exports/5
```

### 3.4 下载导出文件
```bash
GET /api/v1/exports/5/download
```

响应：Excel 文件下载（`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`）

---

## 🔒 4. 敏感字段控制（按角色自动脱敏）

### 4.1 权限矩阵

| 角色 | 学生姓名 | 身份证 | 联系方式 | 数据范围 |
|------|---------|--------|---------|---------|
| **admin** | 张三 | 1234 | 13800138000 | 全部 |
| **education_teacher** | 张三 | 1234 | 13800138000 | 全部 |
| **guide** | 张同学 | 1**4 | 138*****000 | 全部 (脱敏) |
| **school_teacher** | 张同学 | 1**4 | 138*****000 | 仅本校 |
| **guest** | 张同学 | *** | *** | 无 |

### 4.2 示例：管理员 vs 讲解员视图

**管理员获取学生详情:**
```bash
GET /api/v1/students/1
Authorization: Bearer <admin_token>
```
```json
{
  "id": 1,
  "name": "张三",
  "display_name": "张三",
  "age": 10,
  "id_card_last_four": "1234",
  "emergency_contact_name": "张爸爸",
  "emergency_contact_phone": "13800138000",
  "health_notes": "过敏体质"
}
```

**讲解员获取同一名学生详情:**
```bash
GET /api/v1/students/1
Authorization: Bearer <guide_token>
```
```json
{
  "id": 1,
  "name": "张三",
  "display_name": "张同学",
  "age": 10,
  "id_card_last_four": "1**4",
  "emergency_contact_name": "张**",
  "emergency_contact_phone": "138*****000",
  "health_notes": "***"
}
```

---

## 🧭 5. 讲解员排班（自动校验不重叠）

### 5.1 查询可用讲解员
```bash
GET /api/v1/guide_assignments/available_guides?start_time=2026-06-15T09:00:00&end_time=2026-06-15T11:00:00
```

### 5.2 分配讲解员
```bash
POST /api/v1/guide_assignments
Content-Type: application/json

{
  "guide_id": 1,
  "course_session_id": 5,
  "role": "主讲",
  "notes": "需要准备青铜器教具"
}
```

**自动校验规则:**
- ✅ 同一讲解员不能安排到重叠场次
- ✅ 仅活跃讲解员可分配
- ✅ 同一讲解员同一场次只能分配一次

---

## ✅ 6. 签到核验

### 6.1 批量签到
```bash
POST /api/v1/bookings/1/check_in
Content-Type: application/json

{
  "booking_student_ids": [1, 2, 3, 5, 7]
}
```

### 6.2 查看报名学生签到状态
```bash
GET /api/v1/bookings/1/students
```

---

## 📝 7. 报名管理

### 7.1 创建团体报名
```bash
POST /api/v1/bookings
Content-Type: application/json

{
  "booking": {
    "booking_type": "school_group",
    "course_session_id": 1,
    "school_id": 1,
    "contact_name": "王老师",
    "contact_phone": "13800000030",
    "contact_email": "wanglaoshi@school1.com",
    "student_count": 25,
    "teacher_count": 3,
    "special_requirements": "需要安排无障碍通道",
    "student_ids": [1, 2, 3]
  }
}
```

### 7.2 确认报名（自动校验名额）
```bash
POST /api/v1/bookings/1/confirm
```

### 7.3 取消报名
```bash
POST /api/v1/bookings/1/cancel
Content-Type: application/json

{
  "reason": "学校活动调整"
}
```

---

## 🚨 错误响应格式

所有接口统一错误响应：

```json
{
  "errors": [
    "名额不足，剩余 5 个",
    "学校不能为空"
  ]
}
```

HTTP 状态码：
- `200` - 成功
- `201` - 创建成功
- `400` - 参数错误
- `401` - 未认证
- `403` - 无权限
- `404` - 资源不存在
- `422` - 验证失败
