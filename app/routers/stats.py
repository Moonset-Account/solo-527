from typing import List
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, Date, cast
from datetime import datetime, date, timedelta

from app.database import get_db
from app.security import get_current_user
from app.models import (
    User, Schedule, ScheduleStatus, Homework, Notification,
    Lead, LeadStatus, Student, Attendance, AttendanceStatus,
    HourConsumption, CourseClass, Course, StudentHourPackage
)
from app.config import settings


stats_router = APIRouter(prefix="/api/stats", tags=["统计数据"])


@stats_router.get("/overview")
async def overview_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    month_start = today.replace(day=1)

    if today.month == 12:
        next_month = today.replace(year=today.year+1, month=1, day=1)
    else:
        next_month = today.replace(month=today.month+1, day=1)
    month_end = next_month - timedelta(days=1)

    today_schedules = await db.scalar(
        select(func.count(Schedule.id))
        .where(Schedule.schedule_date == today)
        .where(Schedule.is_demo == False)
    ) or 0

    today_hours = await db.scalar(
        select(func.sum(Schedule.duration_minutes))
        .where(Schedule.schedule_date == today)
        .where(Schedule.status == ScheduleStatus.CONDUCTED)
        .where(Schedule.is_demo == False)
    ) or 0
    today_hours = round(today_hours / 60.0, 1)

    new_leads = await db.scalar(
        select(func.count(Lead.id))
        .where(cast(Lead.created_at, Date) >= month_start)
        .where(cast(Lead.created_at, Date) <= month_end)
        .where(Lead.is_demo == False)
    ) or 0

    converted = await db.scalar(
        select(func.count(Lead.id))
        .where(Lead.status == LeadStatus.CONVERTED)
        .where(cast(Lead.converted_at, Date) >= month_start)
        .where(cast(Lead.converted_at, Date) <= month_end)
        .where(Lead.is_demo == False)
    ) or 0

    active_students = await db.scalar(
        select(func.count(func.distinct(Student.id)))
        .where(Student.is_active == True)
        .where(Student.is_demo == False)
    ) or 0

    total_hours = await db.scalar(
        select(func.sum(HourConsumption.hours_used))
        .where(cast(HourConsumption.consumed_at, Date) >= month_start)
        .where(cast(HourConsumption.consumed_at, Date) <= month_end)
        .where(HourConsumption.is_demo == False)
    ) or 0

    homework_pending = await db.scalar(
        select(func.count(Homework.id))
        .where(Homework.deadline >= datetime.utcnow())
        .where(Homework.is_demo == False)
    ) or 0

    low_hour_students = 0

    def card(label, value, icon, icon_cls, trend=None):
        trend_html = ""
        if trend:
            trend_html = f'<div class="stat-trend {trend[1]}">{trend[0]}</div>'
        return f"""
        <div class="stat-card">
            <span class="stat-icon {icon_cls}">{icon}</span>
            <div class="stat-label">{label}</div>
            <div class="stat-value">{value}</div>
            {trend_html}
        </div>"""

    return f"""
    {card("今日课程数", today_schedules, "📅", "icon-blue", ("待上/已完成", "trend-up"))}
    {card("今日授课时数", str(today_hours)+"h", "⏱️", "icon-orange", ("已消课时", "trend-up"))}
    {card("本月新增线索", new_leads, "🎯", "icon-purple", (f"转化{converted}人", "trend-up" if converted>0 else "trend-down"))}
    {card("在读学员", active_students, "👨‍🎓", "icon-green", ("总学员数", "trend-up"))}
    {card("本月消课时", f"{float(total_hours)}h", "💎", "icon-blue", ("课时消耗", "trend-up"))}
    {card("待完成作业", homework_pending, "📝", "icon-orange", ("未截止作业", "trend-up"))}
    {card("线索转化数", converted, "✅", "icon-green", ("本月成功转化", "trend-up"))}
    {card("课时不足学员", low_hour_students, "⚠️", "icon-purple", ("剩余≤3课时", "trend-down"))}
    """


@stats_router.get("/today-schedules")
async def today_schedules(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    q = (
        select(Schedule, CourseClass.name, User.real_name, Course.name)
        .join(CourseClass, CourseClass.id == Schedule.course_class_id)
        .join(Course, Course.id == CourseClass.course_id)
        .join(User, User.id == Schedule.teacher_id)
        .where(Schedule.schedule_date == today)
        .where(Schedule.is_demo == False)
        .order_by(Schedule.start_time)
    )
    if user.role == "teacher":
        q = q.where(Schedule.teacher_id == user.id)

    result = await db.execute(q)
    rows = result.all()

    if not rows:
        return """
        <div class="empty">
            <div class="empty-icon">🎉</div>
            <div class="empty-text">今日暂无课程安排，好好休息吧~</div>
        </div>"""

    html = '<table><thead><tr><th>时间</th><th>班级</th><th>课程</th><th>老师</th><th>主题</th><th>状态</th><th>操作</th></tr></thead><tbody>'
    for s, cname, tname, coursename in rows:
        status_tag = {
            "scheduled": '<span class="tag tag-blue">待上课</span>',
            "conducted": '<span class="tag tag-green">已完成</span>',
            "cancelled": '<span class="tag tag-red">已取消</span>',
            "rescheduled": '<span class="tag tag-yellow">已调课</span>',
        }.get(s.status.value, f'<span class="tag tag-gray">{s.status.value}</span>')

        html += f"""
        <tr>
            <td><strong>{s.start_time}</strong> ~ {s.end_time}</td>
            <td>{cname}</td>
            <td>{coursename}</td>
            <td>{tname or '老师'+str(s.teacher_id)}</td>
            <td>{s.topic or f'第{s.session_no or "?"}节'}</td>
            <td>{status_tag}</td>
            <td>
                {s.status.value in ['scheduled', 'conducted'] and user.role.value in ['super_admin','admin','principal','staff'] and
                    '<button class="btn btn-sm btn-secondary" onclick="location.href=&quot;/schedules&quot;">查看</button>'}
                {s.conflict_notified and '<span class="tag tag-red" title="排课冲突已通知校长">⚠️冲突</span>'}
            </td>
        </tr>"""
    html += '</tbody></table>'
    return html


@stats_router.get("/recent-homework")
async def recent_homework(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Homework, CourseClass.name, User.real_name)
        .join(CourseClass, CourseClass.id == Homework.course_class_id)
        .join(User, User.id == Homework.created_by)
        .where(Homework.is_demo == False)
        .order_by(Homework.created_at.desc())
        .limit(5)
    )
    result = await db.execute(q)
    rows = result.all()

    if not rows:
        return '<div class="empty"><div class="empty-icon">📝</div><div class="empty-text">暂无作业</div></div>'

    html = '<div style="display:flex; flex-direction:column; gap:10px;">'
    for hw, cname, tname in rows:
        overdue = datetime.utcnow() > hw.deadline
        color_tag = "tag-red" if overdue else "tag-green"
        status_text = "已截止" if overdue else "进行中"
        html += f"""
        <div style="padding:12px; background:#f9fafb; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-weight:600; font-size:14px;">{hw.title}</div>
                <div style="font-size:12px; color:#6b7280; margin-top:4px;">
                    {cname} · {tname or '老师'} · 截止 {hw.deadline.strftime('%m-%d %H:%M')}
                </div>
            </div>
            <span class="tag {color_tag}">{status_text}</span>
        </div>"""
    html += '</div>'
    return html


@stats_router.get("/funnel")
async def funnel_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models import LeadSource
    q = select(Lead.status, func.count(Lead.id)).where(Lead.is_demo == False).group_by(Lead.status)
    result = await db.execute(q)
    funnel = {s.value: 0 for s in LeadStatus}
    for s, cnt in result.all():
        funnel[s.value] = cnt

    total = sum(funnel.values())
    converted = funnel.get(LeadStatus.CONVERTED.value, 0)
    rate = round((converted / total) * 100, 1) if total > 0 else 0

    items = [
        ("new", "🆕 新线索", "#3b82f6"),
        ("contacted", "📞 已联系", "#6366f1"),
        ("interested", "👍 有意向", "#8b5cf6"),
        ("trial_scheduled", "📅 已约试听", "#a855f7"),
        ("trial_completed", "✅ 试听完成", "#d946ef"),
        ("converted", "🎉 已转化", "#10b981"),
    ]

    html = """
    <div style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span style="font-weight:600; font-size:14px;">本月转化漏斗</span>
            <span style="font-size:12px;">
                <strong style="color:#10b981; font-size:20px;">{converted}</strong>
                <span style="color:#6b7280;">/ {total} = </span>
                <strong style="color:#10b981; font-size:16px;">{rate}%</strong>
            </span>
        </div>"""

    max_val = max(funnel.values()) or 1
    for key, label, color in items:
        cnt = funnel.get(key, 0)
        width = int((cnt / max_val) * 100) if max_val else 0
        pct = round((cnt / total) * 100, 1) if total else 0
        html += f"""
        <div style="margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                <span>{label}</span>
                <span><strong>{cnt}</strong> ({pct}%)</span>
            </div>
            <div style="background:#f3f4f6; height:20px; border-radius:10px; overflow:hidden;">
                <div style="background:linear-gradient(90deg, {color}, {color}dd); height:100%; width:{max(3 if width>0 else 0, width)}%; border-radius:10px; transition:all 0.3s;"></div>
            </div>
        </div>"""

    html += '</div>'
    return html.format(total=total, converted=converted, rate=rate)
