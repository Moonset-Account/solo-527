from typing import List, Optional, Tuple
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from datetime import datetime, date, time, timedelta

from app.database import get_db
from app.security import (
    get_current_user, allow_management, allow_staff, allow_teacher_staff
)
from app.models import (
    User, UserRole, Schedule, ScheduleStatus, Classroom, CourseClass,
    Attendance, AttendanceStatus, HourConsumption, StudentHourPackage,
    DataEnvironment, Student, Enrollment, User as UserModel, Notification,
    NotificationType, NotificationStatus
)
from app.schemas import (
    ScheduleCreate, ScheduleResponse, ScheduleBulkCreate, ScheduleConflict,
    AttendanceCreate, AttendanceResponse, ScheduleConsumeHours,
    NotificationCreate
)
from app.utils.audit import get_audit_logger, AuditLogger
from app.config import settings


router = APIRouter(prefix="/api/schedules", tags=["排课管理"])


def _time_overlap(start1: time, end1: time, start2: time, end2: time) -> bool:
    return start1 < end2 and start2 < end1


async def _check_conflicts(
    db: AsyncSession,
    teacher_id: int,
    classroom_id: int,
    schedule_date: date,
    start_time: time,
    end_time: time,
    exclude_schedule_id: Optional[int] = None,
) -> List[ScheduleConflict]:
    conflicts: List[ScheduleConflict] = []

    q = (
        select(Schedule)
        .where(Schedule.schedule_date == schedule_date)
        .where(Schedule.status.in_([ScheduleStatus.SCHEDULED, ScheduleStatus.CONDUCTED]))
        .where(Schedule.is_demo == settings.DEMO_MODE)
    )
    if exclude_schedule_id:
        q = q.where(Schedule.id != exclude_schedule_id)

    existing = (await db.execute(q)).scalars().all()

    for s in existing:
        if not _time_overlap(start_time, end_time, s.start_time, s.end_time):
            continue
        if s.teacher_id == teacher_id:
            conflicts.append(ScheduleConflict(
                type="teacher_conflict",
                message=f"老师在 {schedule_date} {s.start_time}-{s.end_time} 已有排课（班级ID:{s.course_class_id}）",
                conflicting_schedule={
                    "id": s.id, "start": str(s.start_time), "end": str(s.end_time),
                    "class_id": s.course_class_id,
                }
            ))
        if s.classroom_id == classroom_id:
            conflicts.append(ScheduleConflict(
                type="classroom_conflict",
                message=f"教室在 {schedule_date} {s.start_time}-{s.end_time} 已被占用",
                conflicting_schedule={
                    "id": s.id, "start": str(s.start_time), "end": str(s.end_time),
                    "class_id": s.course_class_id,
                }
            ))

    return conflicts


async def _notify_principal_conflict(
    db: AsyncSession,
    conflict_details: str,
    schedule_date: date,
):
    from app.models import UserRole as UR, UserStatus as US
    principals = (await db.execute(
        select(UserModel).where(
            and_(
                UserModel.role.in_([UR.SUPER_ADMIN, UR.PRINCIPAL]),
                UserModel.status == US.ACTIVE,
            )
        )
    )).scalars().all()

    for p in principals:
        notif = Notification(
            recipient_id=p.id,
            notification_type=NotificationType.SCHEDULE_CHANGE,
            title="排课冲突提醒",
            content=f"排课时检测到冲突：{conflict_details}\n日期：{schedule_date}",
            channel="in_app",
            status=NotificationStatus.PENDING,
            created_at=datetime.utcnow(),
            is_demo=settings.DEMO_MODE,
            environment=p.environment,
        )
        db.add(notif)


@router.post("", response_model=dict)
async def create_schedule(
    data: ScheduleCreate,
    request: Request,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    start_dt = datetime.combine(data.schedule_date, data.start_time)
    end_dt = datetime.combine(data.schedule_date, data.end_time)
    duration = int((end_dt - start_dt).total_seconds() / 60)

    if duration <= 0:
        raise HTTPException(status_code=400, detail="结束时间必须晚于开始时间")

    cls = await db.get(CourseClass, data.course_class_id)
    if not cls:
        raise HTTPException(status_code=404, detail="班级不存在")

    conflicts = []
    if data.check_conflict:
        conflicts = await _check_conflicts(
            db, data.teacher_id, data.classroom_id,
            data.schedule_date, data.start_time, data.end_time
        )

    conflict_details_str = "; ".join([c.message for c in conflicts])

    schedule = Schedule(
        course_class_id=data.course_class_id,
        teacher_id=data.teacher_id,
        classroom_id=data.classroom_id,
        schedule_date=data.schedule_date,
        start_time=data.start_time,
        end_time=data.end_time,
        duration_minutes=duration,
        status=ScheduleStatus.SCHEDULED,
        session_no=data.session_no,
        topic=data.topic,
        is_makeup=data.is_makeup,
        parent_schedule_id=data.parent_schedule_id,
        conflict_notified=(len(conflicts) > 0),
        conflict_details=conflict_details_str or None,
        created_by=user.id,
        is_demo=settings.DEMO_MODE,
        environment=user.environment,
    )
    db.add(schedule)
    await db.flush()

    if conflicts:
        await _notify_principal_conflict(db, conflict_details_str, data.schedule_date)

    await audit.log(
        user=user, action="create_schedule", target_type="schedule",
        target_id=schedule.id,
        new_value={
            "date": str(data.schedule_date),
            "time": f"{data.start_time}-{data.end_time}",
            "class_id": data.course_class_id,
            "conflicts": [c.model_dump() for c in conflicts],
        },
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )

    return {
        "schedule": schedule,
        "conflicts": conflicts,
        "has_conflict": len(conflicts) > 0,
    }


@router.post("/bulk", response_model=dict)
async def bulk_create_schedules(
    data: ScheduleBulkCreate,
    request: Request,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    if not data.weekdays:
        raise HTTPException(status_code=400, detail="请选择上课星期")

    created = []
    all_conflicts = []
    current_date = data.start_date
    session_no = 1
    start_dt = datetime.combine(data.start_date, data.start_time)
    end_dt = datetime.combine(data.start_date, data.end_time)
    duration = int((end_dt - start_dt).total_seconds() / 60)

    while current_date <= data.end_date:
        if current_date.weekday() in data.weekdays:
            conflicts = []
            if data.check_conflict:
                conflicts = await _check_conflicts(
                    db, data.teacher_id, data.classroom_id,
                    current_date, data.start_time, data.end_time
                )

            schedule = Schedule(
                course_class_id=data.course_class_id,
                teacher_id=data.teacher_id,
                classroom_id=data.classroom_id,
                schedule_date=current_date,
                start_time=data.start_time,
                end_time=data.end_time,
                duration_minutes=duration,
                status=ScheduleStatus.SCHEDULED,
                session_no=session_no,
                created_by=user.id,
                conflict_notified=(len(conflicts) > 0),
                conflict_details="; ".join([c.message for c in conflicts]) or None,
                is_demo=settings.DEMO_MODE,
                environment=user.environment,
            )
            db.add(schedule)
            await db.flush()
            created.append(schedule.id)

            if conflicts:
                all_conflicts.append({
                    "date": str(current_date),
                    "conflicts": [c.model_dump() for c in conflicts],
                })
                await _notify_principal_conflict(
                    db, "; ".join([c.message for c in conflicts]), current_date
                )
            session_no += 1
        current_date += timedelta(days=1)

    await audit.log(
        user=user, action="bulk_create_schedules", target_type="schedule",
        new_value={
            "range": f"{data.start_date} ~ {data.end_date}",
            "weekdays": data.weekdays,
            "created_count": len(created),
            "conflict_count": len(all_conflicts),
        },
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )

    return {
        "created_ids": created,
        "created_count": len(created),
        "conflicts": all_conflicts,
        "has_conflict": len(all_conflicts) > 0,
    }


@router.get("", response_model=List[dict])
async def list_schedules(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    teacher_id: Optional[int] = None,
    classroom_id: Optional[int] = None,
    class_id: Optional[int] = None,
    status: Optional[ScheduleStatus] = None,
    user: User = Depends(allow_teacher_staff),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Schedule, CourseClass.name, UserModel.real_name, Classroom.name)
        .join(CourseClass, CourseClass.id == Schedule.course_class_id)
        .join(UserModel, UserModel.id == Schedule.teacher_id)
        .join(Classroom, Classroom.id == Schedule.classroom_id)
        .where(Schedule.is_demo == settings.DEMO_MODE)
    )
    if start_date:
        q = q.where(Schedule.schedule_date >= start_date)
    if end_date:
        q = q.where(Schedule.schedule_date <= end_date)
    if teacher_id:
        q = q.where(Schedule.teacher_id == teacher_id)
    elif user.role == UserRole.TEACHER:
        q = q.where(Schedule.teacher_id == user.id)
    if classroom_id:
        q = q.where(Schedule.classroom_id == classroom_id)
    if class_id:
        q = q.where(Schedule.course_class_id == class_id)
    if status:
        q = q.where(Schedule.status == status)

    if user.campus_id and user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        q = q.where(CourseClass.campus_id == user.campus_id)

    q = q.order_by(Schedule.schedule_date.desc(), Schedule.start_time.desc())
    result = await db.execute(q)
    return [
        {
            "id": s.id,
            "schedule_date": s.schedule_date,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "status": s.status.value,
            "topic": s.topic,
            "session_no": s.session_no,
            "is_makeup": s.is_makeup,
            "class_name": cls_name,
            "teacher_name": t_name or f"老师ID:{s.teacher_id}",
            "classroom_name": cr_name,
            "course_class_id": s.course_class_id,
            "teacher_id": s.teacher_id,
            "classroom_id": s.classroom_id,
            "conflict_notified": s.conflict_notified,
            "conflict_details": s.conflict_details,
        }
        for s, cls_name, t_name, cr_name in result.all()
    ]


@router.post("/{schedule_id}/status/{new_status}")
async def update_schedule_status(
    schedule_id: int,
    new_status: ScheduleStatus,
    request: Request,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    schedule = await db.get(Schedule, schedule_id)
    if not schedule or schedule.is_demo != settings.DEMO_MODE:
        raise HTTPException(status_code=404, detail="排课不存在")

    old = schedule.status.value
    schedule.status = new_status
    await db.flush()

    await audit.log(
        user=user, action="update_schedule_status", target_type="schedule",
        target_id=schedule_id,
        old_value={"status": old}, new_value={"status": new_status.value},
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return {"message": "状态已更新"}


@router.delete("/{schedule_id}")
async def cancel_schedule(
    schedule_id: int,
    request: Request,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    schedule = await db.get(Schedule, schedule_id)
    if not schedule or schedule.is_demo != settings.DEMO_MODE:
        raise HTTPException(status_code=404, detail="排课不存在")

    schedule.status = ScheduleStatus.CANCELLED
    await db.flush()

    await audit.log(
        user=user, action="cancel_schedule", target_type="schedule",
        target_id=schedule_id,
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return {"message": "排课已取消"}


@router.post("/attendance/batch")
async def batch_record_attendance(
    records: List[AttendanceCreate],
    request: Request,
    user: User = Depends(allow_staff),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    created = []
    for rec in records:
        existing = await db.execute(
            select(Attendance).where(
                and_(
                    Attendance.schedule_id == rec.schedule_id,
                    Attendance.student_id == rec.student_id,
                )
            )
        )
        attend = existing.scalar_one_or_none()
        if attend:
            attend.status = rec.status
            attend.remarks = rec.remarks
            attend.recorded_by = user.id
        else:
            enroll_result = await db.execute(
                select(Enrollment.id).where(
                    and_(
                        Enrollment.student_id == rec.student_id,
                        Enrollment.course_class_id == select(Schedule.course_class_id)
                        .where(Schedule.id == rec.schedule_id).scalar_subquery()
                    )
                )
            )
            enroll_id = enroll_result.scalar_one_or_none()
            attend = Attendance(
                schedule_id=rec.schedule_id,
                student_id=rec.student_id,
                enrollment_id=enroll_id,
                status=rec.status,
                remarks=rec.remarks,
                recorded_by=user.id,
                check_in_time=datetime.utcnow() if rec.status == AttendanceStatus.PRESENT else None,
                is_demo=settings.DEMO_MODE,
                environment=user.environment,
            )
            db.add(attend)
        await db.flush()
        created.append(attend.id)

    await audit.log(
        user=user, action="batch_attendance", target_type="attendance",
        new_value={"count": len(created), "records": [r.model_dump() for r in records]},
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return {"recorded_ids": created, "count": len(created)}


@router.get("/attendance/{schedule_id}")
async def get_schedule_attendance(
    schedule_id: int,
    user: User = Depends(allow_teacher_staff),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Attendance, Student.name)
        .join(Student, Student.id == Attendance.student_id)
        .where(Attendance.schedule_id == schedule_id)
        .where(Attendance.is_demo == settings.DEMO_MODE)
    )
    result = await db.execute(q)
    return [
        {
            "id": a.id,
            "student_id": a.student_id,
            "student_name": s_name,
            "status": a.status.value,
            "remarks": a.remarks,
            "check_in_time": a.check_in_time,
        }
        for a, s_name in result.all()
    ]


@router.post("/consume-hours")
async def consume_schedule_hours(
    data: ScheduleConsumeHours,
    request: Request,
    user: User = Depends(allow_staff),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    schedule = await db.get(Schedule, data.schedule_id)
    if not schedule or schedule.is_demo != settings.DEMO_MODE:
        raise HTTPException(status_code=404, detail="排课不存在")

    attendances = (await db.execute(
        select(Attendance).where(
            and_(
                Attendance.schedule_id == data.schedule_id,
                Attendance.status.in_([
                    AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.MAKEUP
                ])
            )
        )
    )).scalars().all()

    hours_per_student = round(schedule.duration_minutes / 60.0, 2)
    consumed_count = 0
    errors = []

    for att in attendances:
        pkgs = (await db.execute(
            select(StudentHourPackage)
            .where(StudentHourPackage.student_id == att.student_id)
            .where((StudentHourPackage.total_hours - StudentHourPackage.used_hours) > 0)
            .where(StudentHourPackage.valid_from <= date.today())
            .where(StudentHourPackage.valid_to >= date.today())
            .where(StudentHourPackage.is_demo == settings.DEMO_MODE)
            .order_by(StudentHourPackage.valid_to.asc())
        )).scalars().all()

        if not pkgs:
            errors.append(f"学生ID {att.student_id} 无可用课时包")
            continue

        pkg = pkgs[0]
        remaining = pkg.total_hours - pkg.used_hours
        actual_hours = min(hours_per_student, remaining)

        pkg.used_hours += actual_hours

        consumption = HourConsumption(
            student_package_id=pkg.id,
            schedule_id=schedule.id,
            attendance_id=att.id,
            hours_used=actual_hours,
            consumption_type="normal",
            consumed_at=datetime.utcnow(),
            is_demo=settings.DEMO_MODE,
            environment=user.environment,
        )
        db.add(consumption)
        consumed_count += 1

        if pkg.total_hours - pkg.used_hours <= 3 and pkg.total_hours > 0:
            parents = (await db.execute(
                select(UserModel.id)
                .select_from(StudentHourPackage)
                .join(Student, Student.id == StudentHourPackage.student_id)
                .join("parents", "student_id")
                .where(StudentHourPackage.id == pkg.id)
            )).all()

    schedule.status = ScheduleStatus.CONDUCTED
    schedule.content_summary = f"自动消课：{consumed_count}人，人均{hours_per_student}小时"
    await db.flush()

    await audit.log(
        user=user, action="consume_hours", target_type="schedule",
        target_id=data.schedule_id,
        new_value={
            "consumed_count": consumed_count,
            "hours_per_student": hours_per_student,
            "errors": errors,
        },
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )

    return {
        "consumed_count": consumed_count,
        "hours_per_student": hours_per_student,
        "errors": errors,
    }


@router.get("/hour-consumption/stats")
async def get_hour_consumption_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    campus_id: Optional[int] = None,
    student_id: Optional[int] = None,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(
            func.sum(HourConsumption.hours_used).label("total_hours"),
            func.count(HourConsumption.id).label("count"),
            func.date(HourConsumption.consumed_at).label("c_date"),
        )
        .where(HourConsumption.is_demo == False)
        .where(HourConsumption.is_reversed == False)
    )
    if start_date:
        q = q.where(func.date(HourConsumption.consumed_at) >= start_date)
    if end_date:
        q = q.where(func.date(HourConsumption.consumed_at) <= end_date)
    if student_id:
        q = q.join(StudentHourPackage, StudentHourPackage.id == HourConsumption.student_package_id)
        q = q.where(StudentHourPackage.student_id == student_id)

    q = q.group_by(func.date(HourConsumption.consumed_at)).order_by("c_date")
    result = await db.execute(q)
    return [
        {"date": str(r.c_date), "total_hours": float(r.total_hours or 0), "count": r.count}
        for r in result.all()
    ]
