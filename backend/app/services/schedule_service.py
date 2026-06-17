from datetime import datetime, date, time, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, extract

from app.models.schedule import (
    CourseSchedule, CourseConsumption, ScheduleStatus,
    ConsumptionStatus, AttendanceStatus
)
from app.models.class_group import ClassGroup, ClassEnrollment
from app.models.student import Student
from app.models.user import User
from app.models.reminder import Reminder, ReminderType, ReminderPriority, ReminderStatus
from app.models.question import HistoryRecord, Attachment, Remark
from app.schemas.schedule import (
    ScheduleCreate, ScheduleUpdate, ScheduleCalendarItem,
    ConsumptionCreate, ConsumptionBatchCreate, ConsumptionUpdate,
    ConsumptionStats, ScheduleFillRate
)


def generate_schedule_code(db: Session) -> str:
    today = date.today().strftime("%Y%m%d")
    prefix = f"SK{today}"
    last = (
        db.query(CourseSchedule)
        .filter(CourseSchedule.schedule_code.like(f"{prefix}%"))
        .order_by(CourseSchedule.id.desc())
        .first()
    )
    seq = 1
    if last:
        try:
            seq = int(last.schedule_code[-4:]) + 1
        except (ValueError, IndexError):
            seq = 1
    return f"{prefix}{seq:04d}"


def generate_consumption_code(db: Session) -> str:
    today = date.today().strftime("%Y%m%d")
    prefix = f"XC{today}"
    last = (
        db.query(CourseConsumption)
        .filter(CourseConsumption.consumption_code.like(f"{prefix}%"))
        .order_by(CourseConsumption.id.desc())
        .first()
    )
    seq = 1
    if last:
        try:
            seq = int(last.consumption_code[-4:]) + 1
        except (ValueError, IndexError):
            seq = 1
    return f"{prefix}{seq:04d}"


def create_schedule(db: Session, data: ScheduleCreate, created_by: int = None) -> CourseSchedule:
    schedule = CourseSchedule(
        schedule_code=generate_schedule_code(db),
        **data.model_dump(),
        created_by=created_by,
    )
    db.add(schedule)
    db.flush()

    if schedule.class_id:
        enrollments = (
            db.query(ClassEnrollment)
            .filter(ClassEnrollment.class_id == schedule.class_id)
            .all()
        )
        schedule.assigned_student_count = len(enrollments)

    db.commit()
    db.refresh(schedule)
    _add_history(db, "course_schedule", schedule.id, "create", created_by, "创建排课")
    return schedule


def update_schedule(db: Session, schedule_id: int, data: ScheduleUpdate, operator_id: int = None) -> Optional[CourseSchedule]:
    schedule = db.query(CourseSchedule).filter(CourseSchedule.id == schedule_id).first()
    if not schedule:
        return None

    changes = []
    for key, value in data.model_dump(exclude_unset=True).items():
        old_val = getattr(schedule, key)
        if old_val != value:
            changes.append(f"{key}: {old_val} → {value}")
            setattr(schedule, key, value)

    db.commit()
    db.refresh(schedule)

    if changes:
        _add_history(
            db, "course_schedule", schedule.id, "update", operator_id,
            "更新排课: " + "; ".join(changes[:5])
        )
    return schedule


def get_schedule(db: Session, schedule_id: int) -> Optional[CourseSchedule]:
    return db.query(CourseSchedule).filter(CourseSchedule.id == schedule_id).first()


def list_schedules(
    db: Session,
    campus_id: int = None,
    class_id: int = None,
    teacher_id: int = None,
    start_date: date = None,
    end_date: date = None,
    status: ScheduleStatus = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[CourseSchedule], int]:
    query = db.query(CourseSchedule)

    if campus_id:
        query = query.join(ClassGroup, CourseSchedule.class_id == ClassGroup.id).filter(ClassGroup.campus_id == campus_id)
    if class_id:
        query = query.filter(CourseSchedule.class_id == class_id)
    if teacher_id:
        query = query.filter(CourseSchedule.teacher_id == teacher_id)
    if start_date:
        query = query.filter(CourseSchedule.course_date >= start_date)
    if end_date:
        query = query.filter(CourseSchedule.course_date <= end_date)
    if status:
        query = query.filter(CourseSchedule.status == status)

    total = query.count()
    items = query.order_by(CourseSchedule.course_date.desc(), CourseSchedule.start_time.desc()).offset(skip).limit(limit).all()
    return items, total


def get_calendar_schedules(
    db: Session,
    start_date: date,
    end_date: date,
    campus_id: int = None,
    class_id: int = None,
    teacher_id: int = None,
) -> List[ScheduleCalendarItem]:
    query = (
        db.query(
            CourseSchedule.id,
            CourseSchedule.schedule_code,
            CourseSchedule.class_id,
            ClassGroup.name.label("class_name"),
            CourseSchedule.teacher_id,
            User.real_name.label("teacher_name"),
            CourseSchedule.classroom,
            CourseSchedule.course_date,
            CourseSchedule.start_time,
            CourseSchedule.end_time,
            CourseSchedule.topic,
            CourseSchedule.status,
            CourseSchedule.is_online,
            CourseSchedule.assigned_student_count,
            CourseSchedule.attended_student_count,
        )
        .outerjoin(ClassGroup, CourseSchedule.class_id == ClassGroup.id)
        .outerjoin(User, CourseSchedule.teacher_id == User.id)
        .filter(
            and_(
                CourseSchedule.course_date >= start_date,
                CourseSchedule.course_date <= end_date,
            )
        )
    )

    if campus_id:
        query = query.filter(ClassGroup.campus_id == campus_id)
    if class_id:
        query = query.filter(CourseSchedule.class_id == class_id)
    if teacher_id:
        query = query.filter(CourseSchedule.teacher_id == teacher_id)

    rows = query.order_by(CourseSchedule.course_date, CourseSchedule.start_time).all()
    items = []
    status_colors = {
        ScheduleStatus.PLANNED: "#909399",
        ScheduleStatus.CONFIRMED: "#2080f0",
        ScheduleStatus.IN_PROGRESS: "#f0a020",
        ScheduleStatus.COMPLETED: "#18a058",
        ScheduleStatus.CANCELLED: "#d03050",
    }
    for row in rows:
        items.append(ScheduleCalendarItem(
            **row._asdict(),
            color=status_colors.get(row.status, "#2080f0"),
        ))
    return items


def delete_schedule(db: Session, schedule_id: int, operator_id: int = None) -> bool:
    schedule = get_schedule(db, schedule_id)
    if not schedule:
        return False

    consumption_count = (
        db.query(CourseConsumption).filter(CourseConsumption.schedule_id == schedule_id).count()
    )
    if consumption_count > 0:
        schedule.status = ScheduleStatus.CANCELLED
        db.commit()
        _add_history(db, "course_schedule", schedule_id, "cancel", operator_id, f"取消排课(已关联{consumption_count}条消课)")
    else:
        db.delete(schedule)
        db.commit()
        _add_history(db, "course_schedule", schedule_id, "delete", operator_id, "删除排课")
    return True


def create_consumption(db: Session, data: ConsumptionCreate, operator_id: int = None) -> CourseConsumption:
    schedule = get_schedule(db, data.schedule_id)
    consumption_date = data.consumption_date or (schedule.course_date if schedule else date.today())
    class_id = data.class_id or (schedule.class_id if schedule else None)
    teacher_id = data.teacher_id or (schedule.teacher_id if schedule else None)

    consumption = CourseConsumption(
        consumption_code=generate_consumption_code(db),
        schedule_id=data.schedule_id,
        student_id=data.student_id,
        class_id=class_id,
        teacher_id=teacher_id,
        consumption_date=consumption_date,
        hours_consumed=data.hours_consumed,
        status=data.status,
        attendance=data.attendance,
        remark=data.remark,
    )
    db.add(consumption)
    db.flush()

    _update_student_hours(db, data.student_id, data.hours_consumed)
    _update_schedule_attendance(db, data.schedule_id, data.attendance)
    _update_class_enrollment_hours(db, class_id, data.student_id, data.hours_consumed)

    if schedule and data.attendance != AttendanceStatus.ABSENT:
        schedule.status = ScheduleStatus.COMPLETED

    db.commit()
    db.refresh(consumption)
    _add_history(db, "course_consumption", consumption.id, "create", operator_id, "创建消课记录")
    return consumption


def batch_create_consumptions(db: Session, data: ConsumptionBatchCreate, operator_id: int = None) -> List[CourseConsumption]:
    results = []
    for student_id in data.student_ids:
        item = ConsumptionCreate(
            schedule_id=data.schedule_id,
            student_id=student_id,
            hours_consumed=data.hours_consumed,
            attendance=data.attendance_default,
        )
        results.append(create_consumption(db, item, operator_id))
    return results


def update_consumption(db: Session, consumption_id: int, data: ConsumptionUpdate, operator_id: int = None) -> Optional[CourseConsumption]:
    consumption = db.query(CourseConsumption).filter(CourseConsumption.id == consumption_id).first()
    if not consumption:
        return None

    old_hours = consumption.hours_consumed
    changes = []

    for key, value in data.model_dump(exclude_unset=True).items():
        old_val = getattr(consumption, key)
        if old_val != value:
            changes.append(f"{key}: {old_val} → {value}")
            setattr(consumption, key, value)

    if data.hours_consumed is not None and data.hours_consumed != old_hours:
        diff = data.hours_consumed - old_hours
        _update_student_hours(db, consumption.student_id, diff)

    if data.status == ConsumptionStatus.CONSUMED and consumption.confirmed_by is None:
        consumption.confirmed_by = operator_id
        consumption.confirmed_at = datetime.utcnow()

    if data.parent_verified and not consumption.parent_verified:
        consumption.parent_verified_at = datetime.utcnow()

    db.commit()
    db.refresh(consumption)

    if changes:
        _add_history(
            db, "course_consumption", consumption_id, "update", operator_id,
            "更新消课: " + "; ".join(changes[:5])
        )
    return consumption


def get_consumption(db: Session, consumption_id: int):
    return db.query(CourseConsumption).filter(CourseConsumption.id == consumption_id).first()


def list_consumptions(
    db: Session,
    campus_id: int = None,
    class_id: int = None,
    student_id: int = None,
    teacher_id: int = None,
    schedule_id: int = None,
    start_date: date = None,
    end_date: date = None,
    status: ConsumptionStatus = None,
    attendance: AttendanceStatus = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[CourseConsumption], int]:
    query = db.query(CourseConsumption)

    if campus_id:
        query = query.join(ClassGroup, CourseConsumption.class_id == ClassGroup.id).filter(ClassGroup.campus_id == campus_id)
    if class_id:
        query = query.filter(CourseConsumption.class_id == class_id)
    if student_id:
        query = query.filter(CourseConsumption.student_id == student_id)
    if teacher_id:
        query = query.filter(CourseConsumption.teacher_id == teacher_id)
    if schedule_id:
        query = query.filter(CourseConsumption.schedule_id == schedule_id)
    if start_date:
        query = query.filter(CourseConsumption.consumption_date >= start_date)
    if end_date:
        query = query.filter(CourseConsumption.consumption_date <= end_date)
    if status:
        query = query.filter(CourseConsumption.status == status)
    if attendance:
        query = query.filter(CourseConsumption.attendance == attendance)

    total = query.count()
    items = query.order_by(CourseConsumption.consumption_date.desc(), CourseConsumption.id.desc()).offset(skip).limit(limit).all()
    return items, total


def get_consumption_stats(
    db: Session,
    start_date: date,
    end_date: date,
    campus_id: int = None,
    class_id: int = None,
) -> List[ConsumptionStats]:
    query = (
        db.query(
            CourseConsumption.consumption_date.label("date"),
            func.count(CourseConsumption.id).label("total_consumptions"),
            func.coalesce(func.sum(CourseConsumption.hours_consumed), 0).label("total_hours"),
            func.sum(func.case((CourseConsumption.attendance == AttendanceStatus.PRESENT, 1), else_=0)).label("present_count"),
            func.sum(func.case((CourseConsumption.attendance == AttendanceStatus.ABSENT, 1), else_=0)).label("absent_count"),
            func.sum(func.case((CourseConsumption.attendance == AttendanceStatus.LEAVE, 1), else_=0)).label("leave_count"),
        )
        .filter(
            and_(
                CourseConsumption.consumption_date >= start_date,
                CourseConsumption.consumption_date <= end_date,
            )
        )
        .group_by(CourseConsumption.consumption_date)
        .order_by(CourseConsumption.consumption_date)
    )

    if campus_id:
        query = query.join(ClassGroup, CourseConsumption.class_id == ClassGroup.id).filter(ClassGroup.campus_id == campus_id)
    if class_id:
        query = query.filter(CourseConsumption.class_id == class_id)

    rows = query.all()
    return [ConsumptionStats(**row._asdict()) for row in rows]


def get_class_fill_rates(
    db: Session,
    campus_id: int = None,
    month: date = None,
) -> List[ScheduleFillRate]:
    if month is None:
        month = date.today().replace(day=1)
    next_month = (month.replace(day=28) + timedelta(days=4)).replace(day=1)

    query = (
        db.query(
            ClassGroup.id.label("class_id"),
            ClassGroup.name.label("class_name"),
            ClassGroup.max_students,
            ClassGroup.current_students,
            func.coalesce(func.count(CourseSchedule.id), 0).label("schedules_this_month"),
            func.coalesce(func.sum(CourseConsumption.hours_consumed), 0).label("consumed_hours"),
        )
        .outerjoin(
            CourseSchedule,
            and_(
                CourseSchedule.class_id == ClassGroup.id,
                CourseSchedule.course_date >= month,
                CourseSchedule.course_date < next_month,
            )
        )
        .outerjoin(CourseConsumption, CourseSchedule.id == CourseConsumption.schedule_id)
        .group_by(ClassGroup.id, ClassGroup.name, ClassGroup.max_students, ClassGroup.current_students)
    )

    if campus_id:
        query = query.filter(ClassGroup.campus_id == campus_id)

    rows = query.all()
    results = []
    for row in rows:
        d = row._asdict()
        current = d["current_students"] or 0
        max_s = d["max_students"] or 1
        d["fill_rate"] = round(current / max_s * 100, 2) if max_s > 0 else 0.0
        results.append(ScheduleFillRate(**d))
    return results


def _update_student_hours(db: Session, student_id: int, hours: int):
    student = db.query(Student).filter(Student.id == student_id).first()
    if student:
        student.consumed_hours = (student.consumed_hours or 0) + hours
        student.remaining_hours = max(0, (student.remaining_hours or (student.total_hours or 0)) - hours)


def _update_schedule_attendance(db: Session, schedule_id: int, attendance: AttendanceStatus):
    schedule = get_schedule(db, schedule_id)
    if schedule and attendance not in (AttendanceStatus.ABSENT, AttendanceStatus.LEAVE):
        schedule.attended_student_count = (schedule.attended_student_count or 0) + 1


def _update_class_enrollment_hours(db: Session, class_id: int, student_id: int, hours: int):
    if not class_id:
        return
    enrollment = (
        db.query(ClassEnrollment)
        .filter(
            and_(
                ClassEnrollment.class_id == class_id,
                ClassEnrollment.student_id == student_id,
            )
        )
        .first()
    )
    if enrollment:
        enrollment.used_hours = (enrollment.used_hours or 0) + hours
        enrollment.remaining_hours = max(0, (enrollment.allocated_hours or 0) - enrollment.used_hours)


def _add_history(db: Session, entity_type: str, entity_id: int, action: str, operator_id: int, summary: str):
    record = HistoryRecord(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        change_summary=summary,
        operator_id=operator_id or 1,
    )
    db.add(record)
    db.commit()


def get_attachments(db: Session, entity_type: str, entity_id: int):
    return db.query(Attachment).filter_by(entity_type=entity_type, entity_id=entity_id).all()


def get_remarks(db: Session, entity_type: str, entity_id: int):
    return db.query(Remark).filter_by(entity_type=entity_type, entity_id=entity_id).all()


def get_history(db: Session, entity_type: str, entity_id: int):
    return (
        db.query(HistoryRecord)
        .filter_by(entity_type=entity_type, entity_id=entity_id)
        .order_by(HistoryRecord.created_at.desc())
        .all()
    )
