from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_
from datetime import date, datetime, time

from app.database import get_db
from app.security import get_current_user
from app.models import (
    User, UserRole, Schedule, ScheduleStatus, Classroom, CourseClass,
    Course, Student, Homework, Notification, AuditLog, Lead, LeadStatus,
    StudentHourPackage, HourPackage, CourseStatus, Campus, UserStatus
)
from app.config import settings


partials_router = APIRouter(prefix="/partials", tags=["HTMX Partials"])


def _status_tag(status_val: str, mapping: dict) -> str:
    cls, text = mapping.get(status_val, ("tag-gray", status_val))
    return f'<span class="tag {cls}">{text}</span>'


SCHEDULE_STATUS_MAP = {
    "scheduled": ("tag-blue", "待上课"),
    "conducted": ("tag-green", "已完成"),
    "cancelled": ("tag-red", "已取消"),
    "rescheduled": ("tag-yellow", "已调课"),
    "makeup": ("tag-purple", "补课"),
}

ATT_STATUS_MAP = {
    "present": ("tag-green", "出勤"),
    "absent": ("tag-red", "缺勤"),
    "late": ("tag-yellow", "迟到"),
    "leave": ("tag-gray", "请假"),
    "makeup": ("tag-purple", "补课"),
}

LEAD_STATUS_MAP = {
    "new": ("tag-blue", "新线索"),
    "contacted": ("tag-gray", "已联系"),
    "interested": ("tag-yellow", "有意向"),
    "trial_scheduled": ("tag-purple", "已约试听"),
    "trial_completed": ("tag-orange", "试听完成"),
    "converted": ("tag-green", "已转化"),
    "lost": ("tag-red", "已流失"),
}

USER_STATUS_MAP = {
    "active": ("tag-green", "正常"),
    "inactive": ("tag-gray", "停用"),
    "suspended": ("tag-red", "封禁"),
    "pending": ("tag-yellow", "待激活"),
}

ROLE_MAP = {
    "super_admin": "超管", "admin": "管理员", "principal": "校长",
    "teacher": "老师", "staff": "教务", "parent": "家长",
}


@partials_router.get("/schedules")
async def schedules_list_html(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    teacher_id: Optional[int] = None,
    classroom_id: Optional[int] = None,
    class_id: Optional[int] = None,
    status: Optional[ScheduleStatus] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Schedule, CourseClass.name, User.real_name, Classroom.name, Course.name)
        .join(CourseClass, CourseClass.id == Schedule.course_class_id)
        .join(Course, Course.id == CourseClass.course_id)
        .join(User, User.id == Schedule.teacher_id)
        .join(Classroom, Classroom.id == Schedule.classroom_id)
        .where(Schedule.is_demo == settings.DEMO_MODE)
    )
    if start_date: q = q.where(Schedule.schedule_date >= start_date)
    if end_date: q = q.where(Schedule.schedule_date <= end_date)
    if teacher_id: q = q.where(Schedule.teacher_id == teacher_id)
    elif user.role == UserRole.TEACHER: q = q.where(Schedule.teacher_id == user.id)
    if classroom_id: q = q.where(Schedule.classroom_id == classroom_id)
    if class_id: q = q.where(Schedule.course_class_id == class_id)
    if status: q = q.where(Schedule.status == status)

    if user.campus_id and user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        q = q.where(CourseClass.campus_id == user.campus_id)

    q = q.order_by(Schedule.schedule_date.desc(), Schedule.start_time.desc()).limit(200)
    rows = (await db.execute(q)).all()

    if not rows:
        return '''<div class="empty"><div class="empty-icon">📅</div><div class="empty-text">暂无排课记录，点击右上角「新建排课」开始</div></div>'''

    can_manage = user.role.value in ["super_admin", "admin", "principal", "staff"]
    html = '<table><thead><tr><th>日期</th><th>时间</th><th>班级/课程</th><th>老师</th><th>教室</th><th>主题</th><th>状态</th><th>冲突</th><th>操作</th></tr></thead><tbody>'
    for s, cname, tname, rname, coursename in rows:
        date_str = f"{s.schedule_date.month}月{s.schedule_date.day}日 ({'一二三四五六日'[s.schedule_date.weekday()]})"
        status_html = _status_tag(s.status.value, SCHEDULE_STATUS_MAP)
        conflict_html = '<span class="tag tag-red" title="'+(s.conflict_details or '')+'">⚠️</span>' if s.conflict_notified else '<span style="color:#9ca3af;">-</span>'
        ops = ''
        if can_manage:
            ops += f'<button class="btn btn-sm btn-secondary" onclick="viewAttendance({s.id},\'{s.schedule_date}\',\'{cname}\')">考勤</button> '
            if s.status.value in ["scheduled"]:
                ops += f'<button class="btn btn-sm btn-danger" onclick="cancelSchedule({s.id})">取消</button> '
        if s.status.value == "conducted" and can_manage:
            ops += f'<button class="btn btn-sm btn-success" onclick="doConsumeHours({s.id})">消课</button>'
        html += f'''<tr>
            <td><strong>{date_str}</strong></td>
            <td>{s.start_time.strftime("%H:%M")}-{s.end_time.strftime("%H:%M")}</td>
            <td><div style="font-weight:600">{cname}</div><div style="font-size:11px;color:#6b7280">{coursename}</div></td>
            <td>{tname or f"老师{s.teacher_id}"}</td>
            <td>{rname}</td>
            <td>{s.topic or f"第{s.session_no or '?'}节"}</td>
            <td>{status_html}</td>
            <td>{conflict_html}</td>
            <td>{ops}</td>
        </tr>'''
    html += '</tbody></table>'
    return html


@partials_router.get("/courses")
async def courses_list_html(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Course).where(Course.is_demo == settings.DEMO_MODE).order_by(Course.created_at.desc())
    rows = (await db.execute(q)).scalars().all()

    if not rows:
        return '<div class="empty"><div class="empty-icon">📚</div><div class="empty-text">暂无课程，点击右上角「新增课程」开始</div></div>'

    COURSE_STATUS_MAP = {
        "draft": ("tag-gray", "草稿"), "published": ("tag-green", "已发布"),
        "archived": ("tag-red", "已归档"),
    }
    html = '<table><thead><tr><th>课程名称</th><th>编号</th><th>分类/级别</th><th>课时</th><th>节数</th><th>参考价</th><th>状态</th></tr></thead><tbody>'
    for c in rows:
        html += f'''<tr>
            <td><div style="font-weight:600">{c.name}</div><div style="font-size:11px;color:#6b7280">{(c.description or "")[:50]}...</div></td>
            <td>{c.code or "-"}</td>
            <td>{c.category or "-"} / {c.level or "-"}</td>
            <td>{c.total_hours}h</td>
            <td>{c.default_sessions or "-"}</td>
            <td>¥{c.price or "-"}</td>
            <td>{_status_tag(c.status.value, COURSE_STATUS_MAP)}</td>
        </tr>'''
    html += '</tbody></table>'
    return html


@partials_router.get("/classes")
async def classes_list_html(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(CourseClass, Course.name, Campus.name, func.count(Enrollment.id).label("ec"))
        .join(Course, Course.id == CourseClass.course_id)
        .join(Campus, Campus.id == CourseClass.campus_id)
        .outerjoin(Enrollment, Enrollment.course_class_id == CourseClass.id)
        .where(CourseClass.is_demo == settings.DEMO_MODE)
        .group_by(CourseClass.id, Course.name, Campus.name)
        .order_by(CourseClass.id.desc())
    )
    rows = (await db.execute(q)).all()
    if not rows:
        return '<div class="empty"><div class="empty-icon">👥</div><div class="empty-text">暂无班级</div></div>'

    COURSE_STATUS_MAP = {
        "draft": ("tag-gray", "草稿"), "published": ("tag-green", "进行中"),
        "archived": ("tag-red", "已结课"),
    }
    html = '<table><thead><tr><th>班级名称</th><th>所属课程</th><th>校区</th><th>报名人数/上限</th><th>开课-结课</th><th>状态</th><th>操作</th></tr></thead><tbody>'
    for cls, coursename, campusname, ec in rows:
        daterange = f"{cls.start_date or '?'} ~ {cls.end_date or '?'}"
        ops = f'<button class="btn btn-sm btn-secondary" onclick="location.href=\'/schedules?class_id={cls.id}\'">课表</button>'
        html += f'''<tr>
            <td><strong>{cls.name}</strong></td>
            <td>{coursename}</td>
            <td>{campusname}</td>
            <td>{ec}/{cls.max_students}</td>
            <td style="font-size:12px">{daterange}</td>
            <td>{_status_tag(cls.status.value, COURSE_STATUS_MAP)}</td>
            <td>{ops}</td>
        </tr>'''
    html += '</tbody></table>'
    return html


@partials_router.get("/homework")
async def homework_list_html(
    class_id: Optional[int] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Homework, CourseClass.name, User.real_name)
        .join(CourseClass, CourseClass.id == Homework.course_class_id)
        .join(User, User.id == Homework.created_by)
        .where(Homework.is_demo == settings.DEMO_MODE)
    )
    if class_id:
        q = q.where(Homework.course_class_id == class_id)
    if user.role == UserRole.TEACHER:
        q = q.where(Homework.created_by == user.id)
    q = q.order_by(Homework.created_at.desc()).limit(50)
    rows = (await db.execute(q)).all()

    if not rows:
        return '<div class="empty"><div class="empty-icon">📝</div><div class="empty-text">暂无作业</div></div>'

    html = '<table><thead><tr><th>作业标题</th><th>班级</th><th>发布老师</th><th>截止时间</th><th>满分</th><th>状态</th><th>操作</th></tr></thead><tbody>'
    for hw, cname, tname in rows:
        overdue = datetime.utcnow() > hw.deadline
        cls = "tag-red" if overdue else "tag-green"
        txt = "已截止" if overdue else "进行中"
        html += f'''<tr>
            <td><strong>{hw.title}</strong></td>
            <td>{cname}</td>
            <td>{tname or f"老师{hw.created_by}"}</td>
            <td>{hw.deadline.strftime("%m-%d %H:%M")}</td>
            <td>{hw.total_points}</td>
            <td><span class="tag {cls}">{txt}</span></td>
            <td><button class="btn btn-sm btn-primary" onclick="viewHomework({hw.id})">详情</button></td>
        </tr>'''
    html += '</tbody></table>'
    return html


@partials_router.get("/students")
async def students_list_html(
    keyword: Optional[str] = None,
    grade: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Student).where(Student.is_demo == settings.DEMO_MODE)
    if keyword:
        kw = f"%{keyword}%"
        q = q.where(or_(Student.name.ilike(kw), Student.phone.ilike(kw), Student.school.ilike(kw)))
    if grade:
        q = q.where(Student.grade == grade)
    q = q.order_by(Student.id.desc()).limit(300)
    rows = (await db.execute(q)).scalars().all()

    if not rows:
        return '<div class="empty"><div class="empty-icon">👨‍🎓</div><div class="empty-text">暂无学员数据</div></div>'

    can_manage = user.role.value in ["super_admin", "admin", "principal", "staff"]
    html = '<table><thead><tr><th>姓名</th><th>性别</th><th>年级</th><th>学校</th><th>电话</th><th>状态</th><th>操作</th></tr></thead><tbody>'
    for s in rows:
        status_tag = '<span class="tag tag-green">在读</span>' if s.is_active else '<span class="tag tag-gray">停学</span>'
        ops = ''
        if can_manage:
            ops = f'''<button class="btn btn-sm btn-secondary" onclick="viewStudentHours({s.id},\'{s.name}\')">课时</button>
                   <button class="btn btn-sm btn-primary" onclick="enrollStudent({s.id},\'{s.name}\')">报名</button>'''
        html += f'''<tr>
            <td><strong>{s.name}</strong></td>
            <td>{s.gender or "-"}</td>
            <td>{s.grade or "-"}</td>
            <td>{s.school or "-"}</td>
            <td>{s.phone or "-"}</td>
            <td>{status_tag}</td>
            <td>{ops}</td>
        </tr>'''
    html += '</tbody></table>'
    return html


@partials_router.get("/leads")
async def leads_list_html(
    status: Optional[LeadStatus] = None,
    source: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Lead).where(Lead.is_demo == False)
    if status:
        q = q.where(Lead.status == status)
    if source:
        q = q.where(Lead.source == source)
    if user.campus_id and user.role != UserRole.SUPER_ADMIN:
        q = q.where(Lead.campus_id == user.campus_id)
    q = q.order_by(Lead.created_at.desc()).limit(150)
    rows = (await db.execute(q)).scalars().all()

    if not rows:
        return '<div class="empty"><div class="empty-icon">🎯</div><div class="empty-text">暂无线索，点击右上角「录入线索」开始</div></div>'

    can_manage = user.role.value in ["super_admin", "admin", "principal", "staff"]
    SOURCE_MAP = {
        "online_ad": "线上广告", "referral": "转介绍", "walk_in": "上门咨询",
        "phone": "电话咨询", "event": "活动", "other": "其他",
    }
    html = '<table><thead><tr><th>家长</th><th>孩子/年级</th><th>联系电话</th><th>来源</th><th>跟进次数</th><th>状态</th><th>操作</th></tr></thead><tbody>'
    for l in rows:
        ops = ''
        if can_manage:
            ops = f'<button class="btn btn-sm btn-secondary" onclick="viewLeadFollowups({l.id},\'{l.name}\',\'{l.phone}\')">跟进</button>'
            if l.status.value != "converted":
                ops += f' <button class="btn btn-sm btn-success" onclick="convertLead({l.id})">转化</button>'
        html += f'''<tr>
            <td><strong>{l.name}</strong><br/><div style="font-size:11px;color:#6b7280">{l.next_follow_up and '下次跟进: '+l.next_follow_up.strftime("%m-%d") or ''}</div></td>
            <td>{l.student_name or "-"}<br/><span style="font-size:11px;color:#6b7280">{l.student_grade or ''}</span></td>
            <td>{l.phone}</td>
            <td>{SOURCE_MAP.get(l.source.value, l.source.value)}</td>
            <td>{l.follow_up_count or 0} 次<br/><span style="font-size:11px;color:#6b7280">{(l.remarks or "")[:20]}{"..." if l.remarks and len(l.remarks)>20 else ""}</span></td>
            <td>{_status_tag(l.status.value, LEAD_STATUS_MAP)}</td>
            <td>{ops}</td>
        </tr>'''
    html += '</tbody></table>'
    return html


@partials_router.get("/users")
async def users_list_html(
    role: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(User, Campus.name).outerjoin(Campus, Campus.id == User.campus_id).where(User.is_demo == settings.DEMO_MODE)
    if role:
        q = q.where(User.role == role)
    if user.campus_id and user.role != UserRole.SUPER_ADMIN:
        q = q.where(User.campus_id == user.campus_id)
    q = q.order_by(User.created_at.desc()).limit(200)
    rows = (await db.execute(q)).all()

    if not rows:
        return '<div class="empty"><div class="empty-icon">👥</div><div class="empty-text">暂无用户</div></div>'

    html = '<table><thead><tr><th>姓名/账号</th><th>邮箱</th><th>手机号</th><th>角色</th><th>校区</th><th>状态</th><th>最后登录</th></tr></thead><tbody>'
    for u, campusname in rows:
        name = u.real_name or u.username
        html += f'''<tr>
            <td><strong>{name}</strong><br/><span style="font-size:11px;color:#6b7280">@{u.username}</span></td>
            <td style="font-size:12px">{u.email}</td>
            <td>{u.phone or "-"}</td>
            <td><span class="tag tag-purple">{ROLE_MAP.get(u.role.value, u.role.value)}</span></td>
            <td>{campusname or "-"}</td>
            <td>{_status_tag(u.status.value, USER_STATUS_MAP)}</td>
            <td style="font-size:12px">{u.last_login_at.strftime("%m-%d %H:%M") if u.last_login_at else "-"}</td>
        </tr>'''
    html += '</tbody></table>'
    return html


@partials_router.get("/campuses")
async def campuses_list_html(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Campus).where(Campus.is_demo == settings.DEMO_MODE).order_by(Campus.id)
    rows = (await db.execute(q)).scalars().all()
    if not rows:
        return '<div class="empty"><div class="empty-icon">🏫</div><div class="empty-text">暂无校区</div></div>'

    html = '<table><thead><tr><th>校区名称</th><th>地址</th><th>电话</th><th>状态</th></tr></thead><tbody>'
    for c in rows:
        status_html = '<span class="tag tag-green">启用</span>' if c.is_active else '<span class="tag tag-gray">停用</span>'
        html += f'<tr><td><strong>{c.name}</strong></td><td>{c.address or "-"}</td><td>{c.phone or "-"}</td><td>{status_html}</td></tr>'
    html += '</tbody></table>'
    return html


@partials_router.get("/classrooms")
async def classrooms_list_html(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = (select(Classroom, Campus.name)
         .join(Campus, Campus.id == Classroom.campus_id)
         .where(Classroom.is_demo == settings.DEMO_MODE)
         .order_by(Classroom.campus_id, Classroom.id))
    rows = (await db.execute(q)).all()
    if not rows:
        return '<div class="empty"><div class="empty-icon">🏢</div><div class="empty-text">暂无教室</div></div>'

    html = '<table><thead><tr><th>教室名称</th><th>所属校区</th><th>容量</th><th>状态</th></tr></thead><tbody>'
    for r, campusname in rows:
        status_html = '<span class="tag tag-green">启用</span>' if r.is_active else '<span class="tag tag-gray">停用</span>'
        html += f'<tr><td><strong>{r.name}</strong></td><td>{campusname}</td><td>{r.capacity} 人</td><td>{status_html}</td></tr>'
    html += '</tbody></table>'
    return html


@partials_router.get("/notifications")
async def notifications_list_html(
    unread_only: bool = False,
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models import NotificationStatus, NotificationType
    q = select(Notification).where(Notification.recipient_id == user.id)
    if unread_only:
        q = q.where(Notification.status.in_([NotificationStatus.PENDING, NotificationStatus.SENT]))
    q = q.order_by(Notification.created_at.desc()).limit(limit)
    rows = (await db.execute(q)).scalars().all()

    NOTIF_ICONS = {
        "class_reminder": "📅", "homework": "📝", "feedback": "✏️",
        "hours_low": "⏱️", "notice": "📢", "schedule_change": "🔄",
    }

    if unread_only:
        return str(len(rows))

    if not rows:
        return '<div class="empty"><div class="empty-icon">🔔</div><div class="empty-text">暂无通知</div></div>'

    html = '<div style="display:flex; flex-direction:column; gap:8px;">'
    for n in rows:
        read_cls = "read-item" if n.status == NotificationStatus.READ else ""
        border_cls = "border-left:3px solid #2563eb;" if n.status != NotificationStatus.READ else ""
        icon = NOTIF_ICONS.get(n.notification_type.value, "🔔")
        html += f'''
        <div id="notif-{n.id}" class="{read_cls}"
             onclick="markRead({n.id})"
             style="padding:12px 16px; background:#fafafa; border-radius:8px; cursor:pointer; {border_cls}">
            <div style="display:flex; gap:12px; align-items:flex-start;">
                <div style="font-size:22px">{icon}</div>
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between;">
                        <strong style="font-size:14px">{n.title}</strong>
                        <span style="font-size:11px;color:#9ca3af">{n.created_at.strftime("%m-%d %H:%M")}</span>
                    </div>
                    <div style="font-size:13px;color:#4b5563; margin-top:4px; line-height:1.6">{n.content}</div>
                </div>
            </div>
        </div>'''
    html += '</div>'
    return html


@partials_router.get("/audit")
async def audit_list_html(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    limit: int = 100,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models import AuditLog as AL
    from sqlalchemy import Date, cast
    q = select(AL, User.real_name, User.role).outerjoin(User, User.id == AL.user_id).where(AL.is_demo == False)
    if start_date: q = q.where(cast(AL.created_at, Date) >= start_date)
    if end_date: q = q.where(cast(AL.created_at, Date) <= end_date)
    if action: q = q.where(AL.action == action)
    if target_type: q = q.where(AL.target_type == target_type)
    q = q.order_by(AL.created_at.desc()).limit(limit)
    rows = (await db.execute(q)).all()

    if not rows:
        return '<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">暂无审计记录</div></div>'

    ACTION_COLORS = {
        "login_success": ("tag-green", "登录"), "login_failed": ("tag-red", "登录失败"),
        "logout": ("tag-gray", "退出"), "create_": ("tag-blue", "创建"),
        "update_": ("tag-yellow", "修改"), "delete_": ("tag-red", "删除"),
        "cancel_": ("tag-red", "取消"), "consume_hours": ("tag-green", "消课"),
        "generate_monthly_report": ("tag-purple", "生成报表"),
    }

    def get_action_cls(a):
        for k, v in ACTION_COLORS.items():
            if a.startswith(k) or a == k:
                return v
        return ("tag-gray", a)

    html = '<table><thead><tr><th>时间</th><th>操作人</th><th>操作</th><th>对象类型</th><th>对象ID</th><th>IP地址</th><th>变更详情</th></tr></thead><tbody>'
    for log, uname, urole in rows:
        cls, txt = get_action_cls(log.action)
        uname_display = f"{uname or '系统'} <span style='font-size:11px;color:#6b7280'>({ROLE_MAP.get(urole.value, '') if urole else ''})</span>"
        details = ""
        if log.new_value:
            try:
                items = list(log.new_value.items())[:3]
                details = "<br/>".join([f"{k}: {str(v)[:30]}" for k, v in items])
            except Exception:
                details = str(log.new_value)[:50]
        if log.old_value and log.action.startswith("update"):
            try:
                details += f"<br/><span style='color:#dc2626'>旧: {str(dict(list(log.old_value.items())[:2]))[:40]}</span>"
            except Exception:
                pass
        html += f'''<tr>
            <td style="font-size:12px">{log.created_at.strftime("%Y-%m-%d %H:%M:%S")}</td>
            <td>{uname_display}</td>
            <td><span class="tag {cls}">{log.action}</span></td>
            <td>{log.target_type or "-"}</td>
            <td>{log.target_id or "-"}</td>
            <td style="font-size:11px">{log.ip_address or "-"}</td>
            <td style="font-size:12px; max-width:300px">{details}</td>
        </tr>'''
    html += '</tbody></table>'
    return html


@partials_router.get("/hour-consumption")
async def hour_consumption_chart(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import Date, cast
    from datetime import timedelta

    start = date.today().replace(day=1)
    rows = (await db.execute(
        select(func.sum(HourConsumption.hours_used).label("hours"),
               cast(HourConsumption.consumed_at, Date).label("d"))
        .where(cast(HourConsumption.consumed_at, Date) >= start)
        .where(HourConsumption.is_demo == False)
        .where(HourConsumption.is_reversed == False)
        .group_by("d").order_by("d")
    )).all()

    if not rows:
        return '<div class="empty"><div class="empty-icon">📊</div><div class="empty-text">本月暂无消课数据</div></div>'

    max_val = max([float(r.hours or 0) for r in rows]) or 1
    total = sum([float(r.hours or 0) for r in rows])

    html = f'''
    <div style="margin-bottom:12px; display:flex; justify-content:space-between;">
        <span style="font-size:13px;color:#6b7280">本月累计消耗</span>
        <span style="font-size:24px; font-weight:700; color:#1d4ed8;">{total:.1f}h</span>
    </div>
    <div style="display:flex; align-items:flex-end; gap:6px; height:180px; padding:8px 0;">'''
    for r in rows:
        h = round((float(r.hours or 0) / max_val) * 100, 1)
        html += f'''
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end;">
            <div style="font-size:10px;color:#2563eb; font-weight:600;">{float(r.hours or 0):.1f}</div>
            <div style="width:100%; min-height:2px; background:linear-gradient(180deg,#60a5fa,#2563eb);
                 height:{max(2, h)}%; border-radius:4px 4px 0 0;"></div>
            <div style="font-size:9px; color:#6b7280; margin-top:4px;">{str(r.d)[5:]}</div>
        </div>'''
    html += '</div></div>'
    return html


@partials_router.get("/funnel")
async def funnel_html(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models import LeadSource
    q = select(Lead.status, func.count(Lead.id)).where(Lead.is_demo == False).group_by(Lead.status)
    rows = (await db.execute(q)).all()
    funnel = {s.value: 0 for s in LeadStatus}
    for s, c in rows:
        funnel[s.value] = c
    total = sum(funnel.values()) or 1
    converted = funnel.get("converted", 0)
    rate = round((converted / total) * 100, 1)

    funnel_items = [
        ("new", "🆕 新线索", "#3b82f6"),
        ("contacted", "📞 已联系", "#6366f1"),
        ("interested", "👍 有意向", "#8b5cf6"),
        ("trial_scheduled", "📅 已约试听", "#a855f7"),
        ("trial_completed", "✅ 试听完成", "#d946ef"),
        ("converted", "🎉 已转化", "#10b981"),
    ]

    max_val = max(funnel.values()) or 1
    html = f'''
    <div style="margin-bottom:12px; padding:12px; background:#f0fdf4; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
            <div style="font-size:12px; color:#065f46">总线索 / 转化</div>
            <div style="font-size:18px; font-weight:700; color:#065f46">{total} → {converted}</div>
        </div>
        <div style="text-align:right;">
            <div style="font-size:12px;color:#065f46">转化率</div>
            <div style="font-size:28px; font-weight:700; color:#10b981">{rate}%</div>
        </div>
    </div>'''

    for key, label, color in funnel_items:
        cnt = funnel.get(key, 0)
        width = int((cnt / max_val) * 100) if max_val else 0
        pct = round((cnt / total) * 100, 1)
        html += f'''
        <div style="margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                <span>{label}</span>
                <span><strong>{cnt}</strong> ({pct}%)</span>
            </div>
            <div style="background:#f3f4f6; height:22px; border-radius:11px; overflow:hidden;">
                <div style="background:linear-gradient(90deg,{color},{color}dd); color:white; padding:0 10px;
                     height:100%; width:{max(5 if width>0 else 0, width)}%; border-radius:11px; display:flex; align-items:center;
                     font-size:11px; font-weight:600;">{cnt}</div>
            </div>
        </div>'''

    sq = select(Lead.source, func.count(Lead.id)).where(Lead.is_demo == False).group_by(Lead.source)
    srows = (await db.execute(sq)).all()
    source_map = {
        "online_ad": "📱线上广告", "referral": "👥转介绍", "walk_in": "🚶上门",
        "phone": "📞电话", "event": "🎉活动", "other": "📌其他",
    }
    html += '<div style="margin-top:20px; padding-top:16px; border-top:1px dashed #e5e7eb;"><div style="font-weight:600; font-size:13px; margin-bottom:10px;">📊 来源分布</div>'
    s_total = sum([c for _, c in srows]) or 1
    for s_val, c in srows:
        html += f'''
        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
            <span>{source_map.get(s_val.value, s_val.value)}</span>
            <span>{c} ({round(c/s_total*100, 1)}%)</span>
        </div>'''
    html += '</div>'
    return html


@partials_router.get("/overview")
async def overview_cards(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    month_start = today.replace(day=1)

    today_count = (await db.scalar(
        select(func.count(Schedule.id))
        .where(Schedule.schedule_date == today)
        .where(Schedule.is_demo == False)
    )) or 0

    conducted_today = (await db.scalar(
        select(func.coalesce(func.sum(Schedule.duration_minutes), 0))
        .where(Schedule.schedule_date == today)
        .where(Schedule.status == ScheduleStatus.CONDUCTED)
        .where(Schedule.is_demo == False)
    )) or 0

    new_leads = (await db.scalar(
        select(func.count(Lead.id))
        .where(Lead.created_at >= datetime.combine(month_start, datetime.min.time()))
        .where(Lead.is_demo == False)
    )) or 0

    converted = (await db.scalar(
        select(func.count(Lead.id))
        .where(Lead.status == LeadStatus.CONVERTED)
        .where(Lead.converted_at >= datetime.combine(month_start, datetime.min.time()))
        .where(Lead.is_demo == False)
    )) or 0

    active_students = (await db.scalar(
        select(func.count(func.distinct(Student.id)))
        .where(Student.is_active == True)
        .where(Student.is_demo == False)
    )) or 0

    total_hours = (await db.scalar(
        select(func.coalesce(func.sum(HourConsumption.hours_used), 0))
        .where(HourConsumption.consumed_at >= datetime.combine(month_start, datetime.min.time()))
        .where(HourConsumption.is_demo == False)
    )) or 0

    hw_pending = (await db.scalar(
        select(func.count(Homework.id))
        .where(Homework.deadline >= datetime.utcnow())
        .where(Homework.is_demo == False)
    )) or 0

    low_hours = (await db.scalar(
        select(func.count(func.distinct(StudentHourPackage.student_id)))
        .where((StudentHourPackage.total_hours - StudentHourPackage.used_hours) <= 3)
        .where(StudentHourPackage.valid_to >= today)
        .where(StudentHourPackage.is_demo == False)
    )) or 0

    def card(label, value, icon, icon_cls, note="", note_cls=""):
        return f'''
        <div class="stat-card">
            <span class="stat-icon {icon_cls}">{icon}</span>
            <div class="stat-label">{label}</div>
            <div class="stat-value">{value}</div>
            {f'<div class="stat-trend {note_cls}">{note}</div>' if note else ''}
        </div>'''

    return (
        card("今日课程数", today_count, "📅", "icon-blue", f"共 {today_count} 节", "trend-up") +
        card("今日已授课时", f"{round(conducted_today/60, 1)}h", "⏱️", "icon-orange", "本日完成情况", "trend-up") +
        card("本月新增线索", new_leads, "🎯", "icon-purple", f"已转化 {converted} 人", "trend-up" if converted>0 else "trend-down") +
        card("在读学员", active_students, "👨‍🎓", "icon-green", "活跃学员总数", "trend-up") +
        card("本月消课时", f"{float(total_hours):.1f}h", "💎", "icon-blue", "课时总消耗", "trend-up") +
        card("待完成作业", hw_pending, "📝", "icon-orange", "未截止作业", "trend-up") +
        card("线索转化数", converted, "✅", "icon-green", "本月成功转化", "trend-up") +
        card("课时不足学员", low_hours, "⚠️", "icon-purple", "剩余≤3课时，需跟进续费", "trend-down")
    )


@partials_router.get("/reports/monthly")
async def report_monthly_html(
    year: Optional[int] = None,
    month: Optional[int] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    y = year or today.year
    m = month or today.month
    ms = date(y, m, 1)
    me = date(y, m+1, 1) - timedelta(days=1) if m < 12 else date(y+1, 1, 1) - timedelta(days=1)

    new_leads = (await db.scalar(
        select(func.count(Lead.id))
        .where(Lead.created_at.between(datetime.combine(ms, datetime.min.time()), datetime.combine(me, datetime.max.time())))
        .where(Lead.is_demo == False)
    )) or 0
    converted = (await db.scalar(
        select(func.count(Lead.id))
        .where(Lead.status == LeadStatus.CONVERTED)
        .where(Lead.converted_at.between(datetime.combine(ms, datetime.min.time()), datetime.combine(me, datetime.max.time())))
        .where(Lead.is_demo == False)
    )) or 0
    new_students = (await db.scalar(
        select(func.count(Student.id))
        .where(Student.created_at.between(datetime.combine(ms, datetime.min.time()), datetime.combine(me, datetime.max.time())))
        .where(Student.is_demo == False)
    )) or 0
    classes_conducted = (await db.scalar(
        select(func.count(Schedule.id))
        .where(Schedule.status == ScheduleStatus.CONDUCTED)
        .where(Schedule.schedule_date.between(ms, me))
        .where(Schedule.is_demo == False)
    )) or 0
    hours_consumed = (await db.scalar(
        select(func.coalesce(func.sum(HourConsumption.hours_used), 0))
        .where(HourConsumption.consumed_at.between(datetime.combine(ms, datetime.min.time()), datetime.combine(me, datetime.max.time())))
        .where(HourConsumption.is_demo == False)
    )) or 0
    revenue = (await db.scalar(
        select(func.coalesce(func.sum(StudentHourPackage.paid_amount), 0))
        .where(StudentHourPackage.purchased_at.between(datetime.combine(ms, datetime.min.time()), datetime.combine(me, datetime.max.time())))
        .where(StudentHourPackage.is_demo == False)
    )) or 0
    conv_rate = round((converted / new_leads) * 100, 2) if new_leads else 0

    att_total = (await db.scalar(
        select(func.count(Attendance.id))
        .join(Schedule, Schedule.id == Attendance.schedule_id)
        .where(Schedule.schedule_date.between(ms, me))
        .where(Attendance.is_demo == False)
    )) or 0
    att_present = (await db.scalar(
        select(func.count(Attendance.id))
        .join(Schedule, Schedule.id == Attendance.schedule_id)
        .where(Schedule.schedule_date.between(ms, me))
        .where(Attendance.status.in_([AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.MAKEUP]))
        .where(Attendance.is_demo == False)
    )) or 0
    att_rate = round((att_present / att_total) * 100, 2) if att_total else 0

    def kpi(label, value, note="", color="#111827"):
        return f'''
        <div style="background:#f9fafb; padding:16px; border-radius:10px; border:1px solid #e5e7eb;">
            <div style="font-size:12px; color:#6b7280;">{label}</div>
            <div style="font-size:28px; font-weight:700; color:{color}; margin-top:4px;">{value}</div>
            {f'<div style="font-size:11px; color:#059669; margin-top:2px;">{note}</div>' if note else ''}
        </div>'''

    html = f'''
    <div class="alert alert-info" style="margin-bottom:16px;">
        <strong>📊 {y}年{m}月 经营月报</strong>（仅统计正式业务数据，演示数据已自动排除）
    </div>
    <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; margin-bottom:20px;">
        {kpi("新增线索", new_leads)}
        {kpi("成功转化", converted, f"转化率 {conv_rate}%", "#10b981")}
        {kpi("新增学员", new_students)}
        {kpi("开设课程数", classes_conducted)}
    </div>
    <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; margin-bottom:20px;">
        {kpi("总消课时", f"{float(hours_consumed):.1f}h", "", "#2563eb")}
        {kpi("营业收入", f"¥{float(revenue):,.2f}", "", "#7c3aed")}
        {kpi("出勤率", f"{att_rate}%", f"{att_present}/{att_total} 人次", "#ea580c")}
        {kpi("人均消费", f"¥{float(revenue)/new_students:.0f}" if new_students else "¥0", "", "#0891b2")}
    </div>
    <div class="card" style="margin:0;"><div class="card-header"><div class="card-title">📌 月底复盘要点</div></div><div class="card-body" style="font-size:13px; line-height:1.9;">
        • 招生：本月新增线索 {new_leads} 条，转化 {converted} 人，转化率 {conv_rate}%；
        {f'<span style="color:#059669">转化表现良好</span>' if conv_rate>=15 else f'<span style="color:#dc2626">需加强跟进</span>'}
        <br/>• 课消：本月消课 {float(hours_consumed):.1f} 小时，共开设 {classes_conducted} 节课程；出勤率 {att_rate}%
        <br/>• 营收：本月课时包收入 ¥{float(revenue):,.2f}，平均每个新学员贡献 ¥{float(revenue)/new_students:.0f if new_students else 0}
    </div></div>'''
    return html


@partials_router.get("/reports/teacher-hours")
async def report_teacher_hours_html(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    sd = start_date or today.replace(day=1)
    ed = end_date or today

    q = (
        select(User.id, User.real_name, User.email,
               func.count(Schedule.id).label("classes"),
               func.coalesce(func.sum(Schedule.duration_minutes), 0).label("minutes"))
        .select_from(User)
        .join(Schedule, Schedule.teacher_id == User.id)
        .where(Schedule.status == ScheduleStatus.CONDUCTED)
        .where(Schedule.schedule_date.between(sd, ed))
        .where(Schedule.is_demo == False)
        .group_by(User.id, User.real_name, User.email)
    )
    rows = (await db.execute(q)).all()

    if not rows:
        return '<div class="empty"><div class="empty-icon">👨‍🏫</div><div class="empty-text">暂无教师课时数据</div></div>'

    data = []
    for tid, tname, temail, classes, minutes in rows:
        base_rate = (await db.scalar(
            select(TeacherHourRate.base_rate)
            .where(TeacherHourRate.teacher_id == tid)
            .where(TeacherHourRate.is_demo == False)
            .order_by(TeacherHourRate.effective_from.desc())
            .limit(1)
        )) or 0
        hours = round(float(minutes) / 60.0, 2)
        data.append((tid, tname or temail, classes, hours, float(base_rate), round(hours * float(base_rate), 2)))

    html = '<table><thead><tr><th>老师</th><th>授课节数</th><th>有效课时</th><th>课时单价</th><th>估算薪资</th></tr></thead><tbody>'
    for _, name, cls, h, rate, salary in sorted(data, key=lambda x: -x[3]):
        html += f'''<tr>
            <td><strong>{name}</strong></td>
            <td>{cls} 节</td>
            <td style="color:#1d4ed8; font-weight:600;">{h} h</td>
            <td>¥{rate:.0f}/h</td>
            <td style="color:#059669; font-weight:600;">¥{salary:,.2f}</td>
        </tr>'''
    total_cls = sum(x[2] for x in data)
    total_h = sum(x[3] for x in data)
    total_s = sum(x[5] for x in data)
    html += f'''<tr style="background:#f0f9ff; font-weight:600;">
        <td>合计</td><td>{total_cls} 节</td><td>{total_h:.2f} h</td><td>-</td><td style="color:#059669;">¥{total_s:,.2f}</td>
    </tr></tbody></table>'''
    return html


@partials_router.get("/reports/attendance")
async def report_attendance_html(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    sd = start_date or today.replace(day=1)
    ed = end_date or today

    q = (
        select(CourseClass.id, CourseClass.name, Course.name,
               func.count(func.distinct(Schedule.id)).label("sessions"))
        .select_from(CourseClass)
        .join(Course, Course.id == CourseClass.course_id)
        .join(Schedule, Schedule.course_class_id == CourseClass.id)
        .where(Schedule.status == ScheduleStatus.CONDUCTED)
        .where(Schedule.schedule_date.between(sd, ed))
        .where(CourseClass.is_demo == False)
        .group_by(CourseClass.id, CourseClass.name, Course.name)
    )
    rows = (await db.execute(q)).all()

    if not rows:
        return '<div class="empty"><div class="empty-icon">✅</div><div class="empty-text">暂无出勤数据</div></div>'

    html = '<table><thead><tr><th>班级</th><th>课程</th><th>已上课</th><th>报名人数</th><th>出勤人次</th><th>出勤率</th></tr></thead><tbody>'
    for cid, cname, coursename, sessions in rows:
        enrollment_count = (await db.scalar(
            select(func.count(Enrollment.id)).where(Enrollment.course_class_id == cid)
        )) or 0
        attendance_count = (await db.scalar(
            select(func.count(Attendance.id))
            .join(Schedule, Schedule.id == Attendance.schedule_id)
            .where(Schedule.course_class_id == cid)
            .where(Schedule.schedule_date.between(sd, ed))
            .where(Attendance.status.in_([AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.MAKEUP]))
        )) or 0
        expected = (sessions or 0) * (enrollment_count or 0)
        rate = round((attendance_count / expected) * 100, 2) if expected else 0
        rate_cls = "tag-green" if rate >= 90 else ("tag-yellow" if rate >= 75 else "tag-red")
        html += f'''<tr>
            <td><strong>{cname}</strong></td>
            <td>{coursename}</td>
            <td>{sessions} 节</td>
            <td>{enrollment_count} 人</td>
            <td>{attendance_count} 次</td>
            <td><span class="tag {rate_cls}">{rate}%</span></td>
        </tr>'''
    html += '</tbody></table>'
    return html
