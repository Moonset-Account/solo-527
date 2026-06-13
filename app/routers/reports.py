from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case, extract, literal_column, Date, cast
from datetime import datetime, date, timedelta

from app.database import get_db
from app.security import (
    get_current_user, allow_management, allow_staff, allow_teacher_staff
)
from app.models import (
    User, UserRole, Lead, LeadStatus, LeadSource, LeadFollowUp,
    Student, MonthlyReport, DataEnvironment, HourConsumption,
    StudentHourPackage, Schedule, ScheduleStatus, Attendance,
    AttendanceStatus, AuditLog, Enrollment, CourseClass, Course, TeacherHourRate
)
from app.schemas import (
    LeadCreate, LeadResponse, LeadFollowUpCreate, LeadConvert,
    AuditLogResponse
)
from app.utils.audit import get_audit_logger, AuditLogger
from app.config import settings


lead_router = APIRouter(prefix="/api/leads", tags=["招生转化"])
report_router = APIRouter(prefix="/api/reports", tags=["报表中心"])
audit_router = APIRouter(prefix="/api/audit", tags=["审计日志"])


@lead_router.post("", response_model=LeadResponse)
async def create_lead(
    data: LeadCreate,
    request: Request,
    user: User = Depends(allow_staff),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    existing = await db.execute(select(Lead).where(Lead.phone == data.phone))
    lead = existing.scalar_one_or_none()

    if lead:
        lead.status = LeadStatus.CONTACTED
        if data.remarks:
            lead.remarks = (lead.remarks or "") + f"\n[跟进补充]{data.remarks}"
        lead.follow_up_count = (lead.follow_up_count or 0) + 1
        lead.last_follow_up_at = datetime.utcnow()
        await db.flush()
    else:
        lead = Lead(
            **data.model_dump(exclude_none=True),
            created_by=user.id,
            campus_id=data.campus_id or user.campus_id,
            is_demo=settings.DEMO_MODE,
            environment=user.environment,
        )
        db.add(lead)
        await db.flush()

    await audit.log(
        user=user, action=("update_lead" if existing else "create_lead"),
        target_type="lead", target_id=lead.id, new_value=data.model_dump(),
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return lead


@lead_router.get("", response_model=List[LeadResponse])
async def list_leads(
    status: Optional[LeadStatus] = None,
    source: Optional[LeadSource] = None,
    assigned_to: Optional[int] = None,
    campus_id: Optional[int] = None,
    keyword: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    user: User = Depends(allow_staff),
    db: AsyncSession = Depends(get_db),
):
    q = select(Lead).where(Lead.is_demo == False)
    if status:
        q = q.where(Lead.status == status)
    if source:
        q = q.where(Lead.source == source)
    if assigned_to:
        q = q.where(Lead.assigned_to == assigned_to)
    elif user.role in [UserRole.STAFF, UserRole.TEACHER]:
        q = q.where(Lead.assigned_to == user.id)
    if campus_id:
        q = q.where(Lead.campus_id == campus_id)
    elif user.campus_id and user.role != UserRole.SUPER_ADMIN:
        q = q.where(Lead.campus_id == user.campus_id)
    if keyword:
        kw = f"%{keyword}%"
        from sqlalchemy import or_
        q = q.where(or_(
            Lead.name.ilike(kw), Lead.phone.ilike(kw),
            Lead.email.ilike(kw), Lead.student_name.ilike(kw)
        ))
    q = q.order_by(Lead.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@lead_router.post("/follow-up")
async def add_follow_up(
    data: LeadFollowUpCreate,
    request: Request,
    user: User = Depends(allow_staff),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    lead = await db.get(Lead, data.lead_id)
    if not lead or lead.is_demo:
        raise HTTPException(status_code=404, detail="线索不存在")

    fu = LeadFollowUp(
        lead_id=data.lead_id,
        followed_by=user.id,
        method=data.method,
        content=data.content,
        result=data.result,
        next_action=data.next_action,
        is_demo=settings.DEMO_MODE,
    )
    db.add(fu)

    lead.follow_up_count = (lead.follow_up_count or 0) + 1
    lead.last_follow_up_at = datetime.utcnow()
    lead.next_follow_up = data.next_action or lead.next_follow_up
    if lead.status == LeadStatus.NEW:
        lead.status = LeadStatus.CONTACTED

    await db.flush()

    await audit.log(
        user=user, action="add_follow_up", target_type="lead",
        target_id=data.lead_id, new_value=data.model_dump(),
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return {"id": fu.id, "message": "已记录"}


@lead_router.post("/convert")
async def convert_lead(
    data: LeadConvert,
    request: Request,
    user: User = Depends(allow_staff),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    lead = await db.get(Lead, data.lead_id)
    if not lead or lead.is_demo:
        raise HTTPException(status_code=404, detail="线索不存在")

    lead.status = LeadStatus.CONVERTED
    lead.converted_at = datetime.utcnow()
    lead.student_id = data.student_id

    if data.student_id:
        student = await db.get(Student, data.student_id)
        if student:
            lead.student_name = student.name
            lead.phone = student.phone or lead.phone

    await db.flush()

    await audit.log(
        user=user, action="convert_lead", target_type="lead",
        target_id=data.lead_id, new_value=data.model_dump(),
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return {"message": "已转化为学员"}


@lead_router.get("/funnel")
async def lead_funnel_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    campus_id: Optional[int] = None,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
):
    q = select(Lead.status, func.count(Lead.id)).where(Lead.is_demo == False)
    if start_date:
        q = q.where(cast(Lead.created_at, Date) >= start_date)
    if end_date:
        q = q.where(cast(Lead.created_at, Date) <= end_date)
    if campus_id:
        q = q.where(Lead.campus_id == campus_id)
    elif user.campus_id and user.role != UserRole.SUPER_ADMIN:
        q = q.where(Lead.campus_id == user.campus_id)
    q = q.group_by(Lead.status)
    result = await db.execute(q)

    funnel = {s.value: 0 for s in LeadStatus}
    for status_val, cnt in result.all():
        funnel[status_val.value] = cnt

    total = sum(funnel.values())
    converted = funnel.get(LeadStatus.CONVERTED.value, 0)
    rate = round((converted / total) * 100, 2) if total > 0 else 0

    source_q = select(Lead.source, func.count(Lead.id)).where(Lead.is_demo == False)
    if start_date:
        source_q = source_q.where(cast(Lead.created_at, Date) >= start_date)
    if end_date:
        source_q = source_q.where(cast(Lead.created_at, Date) <= end_date)
    source_q = source_q.group_by(Lead.source)
    source_result = await db.execute(source_q)
    sources = {s.value: 0 for s in LeadSource}
    for s_val, cnt in source_result.all():
        sources[s_val.value] = cnt

    return {
        "funnel": funnel,
        "total_leads": total,
        "converted": converted,
        "conversion_rate": rate,
        "sources": sources,
    }


@report_router.get("/monthly-overview")
async def monthly_overview(
    year: Optional[int] = None,
    month: Optional[int] = None,
    campus_id: Optional[int] = None,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    y = year or today.year
    m = month or today.month
    month_start = date(y, m, 1)
    if m == 12:
        next_start = date(y + 1, 1, 1)
    else:
        next_start = date(y, m + 1, 1)
    month_end = next_start - timedelta(days=1)

    campus_filter = True
    if campus_id:
        campus_filter = (CourseClass.campus_id == campus_id)
    elif user.campus_id and user.role != UserRole.SUPER_ADMIN:
        campus_filter = (CourseClass.campus_id == user.campus_id)

    new_leads = await db.scalar(
        select(func.count(Lead.id))
        .where(cast(Lead.created_at, Date) >= month_start)
        .where(cast(Lead.created_at, Date) <= month_end)
        .where(Lead.is_demo == False)
    )
    converted_leads = await db.scalar(
        select(func.count(Lead.id))
        .where(Lead.status == LeadStatus.CONVERTED)
        .where(cast(Lead.converted_at, Date) >= month_start)
        .where(cast(Lead.converted_at, Date) <= month_end)
        .where(Lead.is_demo == False)
    )

    new_students = await db.scalar(
        select(func.count(Student.id))
        .where(cast(Student.created_at, Date) >= month_start)
        .where(cast(Student.created_at, Date) <= month_end)
        .where(Student.is_demo == False)
    )

    total_hours = await db.scalar(
        select(func.sum(HourConsumption.hours_used))
        .join(StudentHourPackage, StudentHourPackage.id == HourConsumption.student_package_id)
        .where(HourConsumption.is_demo == False)
        .where(cast(HourConsumption.consumed_at, Date) >= month_start)
        .where(cast(HourConsumption.consumed_at, Date) <= month_end)
    ) or 0

    revenue = await db.scalar(
        select(func.sum(StudentHourPackage.paid_amount))
        .where(StudentHourPackage.is_demo == False)
        .where(cast(StudentHourPackage.purchased_at, Date) >= month_start)
        .where(cast(StudentHourPackage.purchased_at, Date) <= month_end)
    ) or 0

    classes_conducted = await db.scalar(
        select(func.count(Schedule.id))
        .where(Schedule.status == ScheduleStatus.CONDUCTED)
        .where(Schedule.schedule_date >= month_start)
        .where(Schedule.schedule_date <= month_end)
        .where(Schedule.is_demo == False)
    )

    attendance_q = (
        select(
            Attendance.status,
            func.count(Attendance.id),
        )
        .join(Schedule, Schedule.id == Attendance.schedule_id)
        .where(Schedule.schedule_date >= month_start)
        .where(Schedule.schedule_date <= month_end)
        .where(Attendance.is_demo == False)
        .group_by(Attendance.status)
    )
    attendance_result = await db.execute(attendance_q)
    attendance = {s.value: 0 for s in AttendanceStatus}
    for s_val, cnt in attendance_result.all():
        attendance[s_val.value] = cnt

    total_att = sum(attendance.values())
    present = attendance.get(AttendanceStatus.PRESENT.value, 0)
    late = attendance.get(AttendanceStatus.LATE.value, 0)
    makeup = attendance.get(AttendanceStatus.MAKEUP.value, 0)
    att_rate = round(((present + late + makeup) / total_att) * 100, 2) if total_att > 0 else 0

    return {
        "period": f"{y}-{m:02d}",
        "new_leads": new_leads or 0,
        "converted_leads": converted_leads or 0,
        "conversion_rate": round(((converted_leads or 0) / (new_leads or 1)) * 100, 2),
        "new_students": new_students or 0,
        "classes_conducted": classes_conducted or 0,
        "total_hours_consumed": float(total_hours),
        "revenue": float(revenue),
        "attendance": attendance,
        "attendance_rate": att_rate,
    }


@report_router.get("/teacher-hours")
async def teacher_hours_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    campus_id: Optional[int] = None,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    sd = start_date or today.replace(day=1)
    ed = end_date or today

    q = (
        select(
            User.id,
            User.real_name,
            User.email,
            func.count(Schedule.id).label("classes"),
            func.sum(Schedule.duration_minutes).label("minutes"),
        )
        .select_from(User)
        .join(Schedule, Schedule.teacher_id == User.id)
        .where(Schedule.status == ScheduleStatus.CONDUCTED)
        .where(Schedule.schedule_date >= sd)
        .where(Schedule.schedule_date <= ed)
        .where(Schedule.is_demo == False)
        .group_by(User.id, User.real_name, User.email)
    )
    result = await db.execute(q)

    data = []
    for tid, tname, temail, classes, minutes in result.all():
        rate_q = (
            select(TeacherHourRate.base_rate)
            .where(TeacherHourRate.teacher_id == tid)
            .where(TeacherHourRate.is_demo == False)
            .order_by(TeacherHourRate.effective_from.desc())
            .limit(1)
        )
        base_rate = await db.scalar(rate_q) or 0
        hours = round((minutes or 0) / 60.0, 2)
        data.append({
            "teacher_id": tid,
            "teacher_name": tname or temail,
            "classes": classes,
            "teaching_hours": hours,
            "base_rate": float(base_rate),
            "estimated_salary": round(hours * float(base_rate), 2),
        })
    return {"period": f"{sd} ~ {ed}", "teachers": data}


@report_router.get("/class-attendance")
async def class_attendance_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    sd = start_date or today.replace(day=1)
    ed = end_date or today

    q = (
        select(
            CourseClass.id,
            CourseClass.name,
            Course.name.label("course_name"),
            func.count(Schedule.id).label("sessions"),
        )
        .select_from(CourseClass)
        .join(Course, Course.id == CourseClass.course_id)
        .join(Schedule, Schedule.course_class_id == CourseClass.id)
        .where(Schedule.status == ScheduleStatus.CONDUCTED)
        .where(Schedule.schedule_date >= sd)
        .where(Schedule.schedule_date <= ed)
        .where(CourseClass.is_demo == False)
        .group_by(CourseClass.id, CourseClass.name, Course.name)
    )
    result = await db.execute(q)
    classes = []
    for cid, cname, coursename, sessions in result.all():
        enrollment_count = await db.scalar(
            select(func.count(Enrollment.id)).where(
                Enrollment.course_class_id == cid
            )
        ) or 0
        attendance_records = await db.scalar(
            select(func.count(Attendance.id))
            .join(Schedule, Schedule.id == Attendance.schedule_id)
            .where(Schedule.course_class_id == cid)
            .where(Schedule.schedule_date >= sd)
            .where(Schedule.schedule_date <= ed)
            .where(Attendance.status.in_([
                AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.MAKEUP
            ]))
        ) or 0
        expected = (sessions or 0) * (enrollment_count or 0)
        rate = round((attendance_records / expected) * 100, 2) if expected > 0 else 0
        classes.append({
            "class_id": cid,
            "class_name": cname,
            "course_name": coursename,
            "sessions": sessions,
            "enrollment_count": enrollment_count,
            "attendance_count": attendance_records,
            "attendance_rate": rate,
        })
    return classes


@report_router.post("/monthly/generate")
async def generate_monthly_report(
    year: int,
    month: int,
    campus_id: Optional[int] = None,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    report_month = f"{year}-{month:02d}"
    existing = await db.execute(
        select(MonthlyReport).where(
            and_(
                MonthlyReport.report_month == report_month,
                MonthlyReport.campus_id == campus_id,
                MonthlyReport.is_demo == False,
            )
        )
    )
    report = existing.scalar_one_or_none()

    overview = await monthly_overview(year=year, month=month, campus_id=campus_id, user=user, db=db)
    teachers = await teacher_hours_report(
        start_date=date(year, month, 1),
        end_date=date(year, month, 28),
        campus_id=campus_id, user=user, db=db,
    )

    funnel = await lead_funnel_stats(
        start_date=date(year, month, 1),
        end_date=date(year, month, 28),
        campus_id=campus_id, user=user, db=db,
    )

    report_data = {
        "overview": overview,
        "teacher_hours": teachers,
        "lead_funnel": funnel,
    }

    if report:
        report.report_data = report_data
        report.generated_by = user.id
        report.generated_at = datetime.utcnow()
    else:
        report = MonthlyReport(
            report_month=report_month,
            campus_id=campus_id,
            report_data=report_data,
            generated_by=user.id,
            is_demo=False,
            environment=DataEnvironment.PRODUCTION,
        )
        db.add(report)
    await db.flush()

    await audit.log(
        user=user, action="generate_monthly_report", target_type="monthly_report",
        new_value={"month": report_month, "campus_id": campus_id},
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return {"id": report.id, "month": report_month, "data": report_data, "is_locked": report.is_locked}


@report_router.get("/monthly/{report_month}")
async def get_monthly_report(
    report_month: str,
    campus_id: Optional[int] = None,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
):
    q = select(MonthlyReport).where(
        MonthlyReport.report_month == report_month,
        MonthlyReport.is_demo == False,
    )
    if campus_id:
        q = q.where(MonthlyReport.campus_id == campus_id)
    result = await db.execute(q)
    report = result.scalar_one_or_none()
    if not report:
        return {"message": "报表尚未生成，请先生成", "generated": False}
    return {"id": report.id, "data": report.report_data, "generated": True, "is_locked": report.is_locked}


@audit_router.get("", response_model=List[AuditLogResponse])
async def list_audit_logs(
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    user_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
):
    q = select(AuditLog).where(AuditLog.is_demo == False)
    if action:
        q = q.where(AuditLog.action == action)
    if target_type:
        q = q.where(AuditLog.target_type == target_type)
    if user_id:
        q = q.where(AuditLog.user_id == user_id)
    if start_date:
        q = q.where(cast(AuditLog.created_at, Date) >= start_date)
    if end_date:
        q = q.where(cast(AuditLog.created_at, Date) <= end_date)
    q = q.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()
