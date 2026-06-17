from datetime import datetime, date, timedelta, time
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc

from app.models import (
    CourseSchedule, CourseConsumption, Student, HomeworkSubmission,
    Reminder, ReminderType, ReminderStatus, ReminderPriority,
    Notification, Receipt, ReceiptStatus, ClassGroup, ScheduleStatus,
    SubmissionStatus, AttendanceStatus, ConsumptionStatus, Homework,
    HomeworkStatus, User, WorkFeedback,
)
from app.schemas.dashboard import (
    DashboardStats, TodoItem, OverdueItem, RecentSubmission,
    MonthlyFillRateReport, ClassFillRateDetail,
)


def get_dashboard_stats(db: Session, campus_id: int = None, user_id: int = None) -> DashboardStats:
    today = date.today()
    now = datetime.utcnow()

    schedule_q = db.query(CourseSchedule).filter(CourseSchedule.course_date == today)
    consumption_q = db.query(CourseConsumption).filter(CourseConsumption.consumption_date == today)
    student_q = db.query(Student)

    if campus_id:
        schedule_q = schedule_q.join(ClassGroup, CourseSchedule.class_id == ClassGroup.id).filter(ClassGroup.campus_id == campus_id)
        consumption_q = consumption_q.join(ClassGroup, CourseConsumption.class_id == ClassGroup.id).filter(ClassGroup.campus_id == campus_id)
        student_q = student_q.filter(Student.campus_id == campus_id)

    today_schedules = schedule_q.count()
    today_consumptions = consumption_q.count()
    today_hours = consumption_q.with_entities(func.coalesce(func.sum(CourseConsumption.hours_consumed), 0)).scalar() or 0

    unsubmitted_q = (
        db.query(HomeworkSubmission)
        .join(Homework, HomeworkSubmission.homework_id == Homework.id)
        .filter(
            HomeworkSubmission.status == SubmissionStatus.NOT_SUBMITTED,
            Homework.deadline > now,
            Homework.status == HomeworkStatus.PUBLISHED,
        )
    )
    if campus_id:
        unsubmitted_q = unsubmitted_q.join(ClassGroup, Homework.class_id == ClassGroup.id).filter(ClassGroup.campus_id == campus_id)
    homework_unsubmitted = unsubmitted_q.count()

    pending_receipt_q = (
        db.query(Receipt)
        .join(Notification, Receipt.notification_id == Notification.id)
        .filter(Receipt.status == ReceiptStatus.PENDING)
    )
    if campus_id:
        pending_receipt_q = pending_receipt_q.filter(Notification.campus_id == campus_id)
    pending_receipts = pending_receipt_q.count()

    pending_reminder_q = db.query(Reminder).filter(
        Reminder.status.in_([ReminderStatus.PENDING, ReminderStatus.SENT]),
        Reminder.is_overdue == False,
    )
    overdue_reminders_q = db.query(Reminder).filter(
        Reminder.status.in_([ReminderStatus.PENDING, ReminderStatus.SENT]),
        Reminder.is_overdue == True,
    )
    if user_id:
        pending_reminder_q = pending_reminder_q.filter(Reminder.user_id == user_id)
        overdue_reminders_q = overdue_reminders_q.filter(Reminder.user_id == user_id)
    if campus_id:
        pending_reminder_q = pending_reminder_q.join(ClassGroup, Reminder.class_id == ClassGroup.id).filter(ClassGroup.campus_id == campus_id)
        overdue_reminders_q = overdue_reminders_q.join(ClassGroup, Reminder.class_id == ClassGroup.id).filter(ClassGroup.campus_id == campus_id)

    pending_todos = pending_reminder_q.count()
    overdue_reminders = overdue_reminders_q.count()

    recent_sub_q = (
        db.query(HomeworkSubmission)
        .filter(HomeworkSubmission.status.in_([SubmissionStatus.SUBMITTED, SubmissionStatus.LATE, SubmissionStatus.GRADED]))
        .order_by(desc(HomeworkSubmission.submit_time))
    )
    if campus_id:
        recent_sub_q = recent_sub_q.join(Homework, HomeworkSubmission.homework_id == Homework.id).join(ClassGroup, Homework.class_id == ClassGroup.id).filter(ClassGroup.campus_id == campus_id)
    recent_submissions = recent_sub_q.limit(10).count()

    total_students = student_q.count()
    active_students = student_q.filter(Student.status == "active").count()

    class_q = db.query(ClassGroup)
    if campus_id:
        class_q = class_q.filter(ClassGroup.campus_id == campus_id)
    total_classes = class_q.count()

    classes = class_q.all()
    if classes:
        rates = []
        for c in classes:
            if c.max_students and c.max_students > 0:
                rates.append(c.current_students / c.max_students * 100)
        average_fill_rate = round(sum(rates) / len(rates), 2) if rates else 0.0
    else:
        average_fill_rate = 0.0

    return DashboardStats(
        today_schedules=today_schedules,
        today_consumptions=today_consumptions,
        today_hours=today_hours,
        pending_todos=pending_todos,
        overdue_reminders=overdue_reminders,
        recent_submissions=recent_submissions,
        homework_unsubmitted=homework_unsubmitted,
        pending_receipts=pending_receipts,
        total_students=total_students,
        active_students=active_students,
        total_classes=total_classes,
        average_fill_rate=average_fill_rate,
    )


def get_todo_items(db: Session, campus_id: int = None, user_id: int = None, limit: int = 20) -> List[TodoItem]:
    todos = []
    now = datetime.utcnow()

    rems = db.query(Reminder).filter(
        Reminder.status.in_([ReminderStatus.PENDING, ReminderStatus.SENT]),
        Reminder.is_overdue == False,
    )
    if user_id:
        rems = rems.filter(Reminder.user_id == user_id)
    if campus_id:
        rems = rems.join(ClassGroup, Reminder.class_id == ClassGroup.id, isouter=True).filter(
            or_(ClassGroup.campus_id == campus_id, Reminder.class_id.is_(None))
        )
    for r in rems.order_by(Reminder.priority, Reminder.created_at.desc()).limit(limit).all():
        todos.append(TodoItem(
            id=r.id,
            type=r.type.value,
            title=r.title,
            description=r.content,
            priority=r.priority.value,
            deadline=r.scheduled_at,
            entity_type=r.entity_type,
            entity_id=r.entity_id,
            created_at=r.created_at,
        ))

    pending_schedules = (
        db.query(CourseSchedule)
        .filter(CourseSchedule.status == ScheduleStatus.PLANNED)
        .filter(CourseSchedule.course_date >= date.today())
        .order_by(CourseSchedule.course_date, CourseSchedule.start_time)
        .limit(10)
    )
    for s in pending_schedules.all():
        class_name = db.query(ClassGroup.name).filter(ClassGroup.id == s.class_id).scalar()
        todos.append(TodoItem(
            id=s.id,
            type="schedule_confirm",
            title=f"待确认排课: {class_name or s.class_id} - {s.topic or '课程'}",
            description=f"{s.course_date} {s.start_time}-{s.end_time} @ {s.classroom or '未指定教室'}",
            priority="normal",
            deadline=datetime.combine(s.course_date, s.start_time) if isinstance(s.start_time, time) else None,
            entity_type="course_schedule",
            entity_id=s.id,
            created_at=s.created_at,
        ))

    unconfirmed_consumptions = (
        db.query(CourseConsumption)
        .filter(CourseConsumption.status == ConsumptionStatus.PENDING)
        .order_by(CourseConsumption.consumption_date.desc())
        .limit(10)
    )
    for c in unconfirmed_consumptions.all():
        student = db.query(Student.name).filter(Student.id == c.student_id).scalar()
        todos.append(TodoItem(
            id=c.id,
            type="consumption_confirm",
            title=f"待确认消课: {student or c.student_id} - {c.consumption_date}",
            description=f"消耗 {c.hours_consumed} 课时, 出勤: {c.attendance.value}",
            priority="high",
            deadline=datetime.combine(c.consumption_date, time(23, 59)),
            entity_type="course_consumption",
            entity_id=c.id,
            created_at=c.created_at,
        ))

    todos.sort(key=lambda x: ({"urgent": 0, "high": 1, "normal": 2, "low": 3}[x.priority], x.deadline or datetime.max))
    return todos[:limit]


def get_overdue_items(db: Session, campus_id: int = None, user_id: int = None, limit: int = 20) -> List[OverdueItem]:
    items = []
    now = datetime.utcnow()

    overdue_rems = db.query(Reminder).filter(
        Reminder.is_overdue == True,
        Reminder.status.in_([ReminderStatus.PENDING, ReminderStatus.SENT]),
    )
    if user_id:
        overdue_rems = overdue_rems.filter(Reminder.user_id == user_id)
    if campus_id:
        overdue_rems = overdue_rems.join(ClassGroup, Reminder.class_id == ClassGroup.id, isouter=True).filter(
            or_(ClassGroup.campus_id == campus_id, Reminder.class_id.is_(None))
        )
    for r in overdue_rems.order_by(Reminder.created_at.desc()).limit(limit).all():
        student_name = None
        teacher_name = None
        if r.student_id:
            student_name = db.query(Student.name).filter(Student.id == r.student_id).scalar()
        items.append(OverdueItem(
            id=r.id,
            type=r.type.value,
            title=r.title,
            overdue_time=r.scheduled_at or r.created_at,
            description=r.content,
            entity_type=r.entity_type,
            entity_id=r.entity_id,
            student_name=student_name,
        ))

    unsubmitted_deadline = (
        db.query(HomeworkSubmission, Homework)
        .join(Homework, HomeworkSubmission.homework_id == Homework.id)
        .filter(
            HomeworkSubmission.status == SubmissionStatus.NOT_SUBMITTED,
            Homework.deadline < now,
            Homework.status == HomeworkStatus.PUBLISHED,
        )
    )
    if campus_id:
        unsubmitted_deadline = unsubmitted_deadline.join(ClassGroup, Homework.class_id == ClassGroup.id).filter(ClassGroup.campus_id == campus_id)

    for sub, hw in unsubmitted_deadline.order_by(Homework.deadline.desc()).limit(10).all():
        student_name = db.query(Student.name).filter(Student.id == sub.student_id).scalar()
        items.append(OverdueItem(
            id=sub.id,
            type="homework_overdue",
            title=f"作业未交: {hw.title}",
            overdue_time=hw.deadline,
            description=f"截止时间已过, 需要催交",
            entity_type="homework_submission",
            entity_id=sub.id,
            student_name=student_name,
        ))

    pending_receipts_q = (
        db.query(Receipt, Notification)
        .join(Notification, Receipt.notification_id == Notification.id)
        .filter(
            Receipt.status == ReceiptStatus.PENDING,
            Notification.receipt_deadline < now,
        )
    )
    if campus_id:
        pending_receipts_q = pending_receipts_q.filter(Notification.campus_id == campus_id)
    for rc, nf in pending_receipts_q.order_by(Notification.receipt_deadline.desc()).limit(10).all():
        student_name = None
        if rc.student_id:
            student_name = db.query(Student.name).filter(Student.id == rc.student_id).scalar()
        items.append(OverdueItem(
            id=rc.id,
            type="receipt_overdue",
            title=f"回执未签: {nf.title}",
            overdue_time=nf.receipt_deadline,
            description="回执截止时间已过",
            entity_type="receipt",
            entity_id=rc.id,
            student_name=student_name,
        ))

    return items[:limit]


def get_recent_submissions(db: Session, campus_id: int = None, days: int = 7, limit: int = 20) -> List[RecentSubmission]:
    cutoff = datetime.utcnow() - timedelta(days=days)
    query = (
        db.query(
            HomeworkSubmission.id,
            HomeworkSubmission.homework_id,
            Homework.title.label("homework_title"),
            HomeworkSubmission.student_id,
            Student.name.label("student_name"),
            HomeworkSubmission.submit_time,
            HomeworkSubmission.status,
            HomeworkSubmission.score,
            ClassGroup.name.label("class_name"),
        )
        .join(Homework, HomeworkSubmission.homework_id == Homework.id)
        .join(Student, HomeworkSubmission.student_id == Student.id)
        .outerjoin(ClassGroup, Homework.class_id == ClassGroup.id)
        .filter(
            HomeworkSubmission.status.in_([SubmissionStatus.SUBMITTED, SubmissionStatus.LATE, SubmissionStatus.GRADED]),
            HomeworkSubmission.submit_time >= cutoff,
        )
    )
    if campus_id:
        query = query.filter(ClassGroup.campus_id == campus_id)

    rows = query.order_by(desc(HomeworkSubmission.submit_time)).limit(limit).all()
    results = []
    for row in rows:
        d = row._asdict()
        results.append(RecentSubmission(
            id=d["id"],
            type="homework" if d["score"] is None else "homework_graded",
            title=d["homework_title"],
            student_name=d["student_name"],
            student_id=d["student_id"],
            submit_time=d["submit_time"],
            status=d["status"].value,
            score=d["score"],
            class_name=d["class_name"],
        ))
    return results


def get_monthly_fill_rate(db: Session, campus_id: int = None, month: date = None) -> MonthlyFillRateReport:
    if month is None:
        month = date.today().replace(day=1)
    next_month = (month.replace(day=28) + timedelta(days=4)).replace(day=1)

    class_q = db.query(ClassGroup)
    if campus_id:
        class_q = class_q.filter(ClassGroup.campus_id == campus_id)

    classes = class_q.all()
    details = []
    total_students = 0

    for c in classes:
        current = c.current_students or 0
        total_students += current
        max_s = c.max_students or 1

        sched_count = (
            db.query(CourseSchedule)
            .filter(
                CourseSchedule.class_id == c.id,
                CourseSchedule.course_date >= month,
                CourseSchedule.course_date < next_month,
            )
            .count()
        )
        consumed = (
            db.query(func.coalesce(func.sum(CourseConsumption.hours_consumed), 0))
            .join(CourseSchedule, CourseConsumption.schedule_id == CourseSchedule.id)
            .filter(
                CourseSchedule.class_id == c.id,
                CourseSchedule.course_date >= month,
                CourseSchedule.course_date < next_month,
            )
            .scalar()
        ) or 0

        details.append(ClassFillRateDetail(
            class_id=c.id,
            class_name=c.name,
            major=c.major,
            max_students=c.max_students or 0,
            current_students=current,
            fill_rate=round(current / max_s * 100, 2) if max_s > 0 else 0.0,
            schedules_count=sched_count,
            consumed_hours=consumed,
        ))

    max_total = sum(d.max_students for d in details) or 1
    overall = round(total_students / max_total * 100, 2)

    campus_name = None
    if campus_id:
        from app.models import Campus
        campus_name = db.query(Campus.name).filter(Campus.id == campus_id).scalar()

    return MonthlyFillRateReport(
        month=month.strftime("%Y-%m"),
        campus_id=campus_id,
        campus_name=campus_name,
        overall_fill_rate=overall,
        total_classes=len(classes),
        total_students=total_students,
        class_details=details,
        generated_at=datetime.utcnow(),
    )


def create_homework_reminders_for_unsubmitted(db: Session, operator_id: int = 1):
    now = datetime.utcnow()
    unsubmitted = (
        db.query(HomeworkSubmission, Homework, Student)
        .join(Homework, HomeworkSubmission.homework_id == Homework.id)
        .join(Student, HomeworkSubmission.student_id == Student.id)
        .filter(
            HomeworkSubmission.status == SubmissionStatus.NOT_SUBMITTED,
            Homework.status == HomeworkStatus.PUBLISHED,
            Homework.deadline.isnot(None),
        )
        .all()
    )
    created_count = 0
    for sub, hw, student in unsubmitted:
        is_overdue = hw.deadline < now
        hours_to_deadline = max(0, (hw.deadline - now).total_seconds() / 3600)

        should_remind = (
            is_overdue
            or hours_to_deadline <= 24
            or hours_to_deadline <= 72 and hours_to_deadline > 24
        )
        if not should_remind:
            continue

        existing = db.query(Reminder).filter_by(
            type=ReminderType.HOMEWORK,
            student_id=student.id,
            entity_type="homework_submission",
            entity_id=sub.id,
        ).first()
        if existing and existing.status in [ReminderStatus.SENT, ReminderStatus.READ]:
            continue

        title = f"{'【逾期】' if is_overdue else ''}作业提醒: {hw.title}"
        content = (
            f"学生 {student.name} 的作业「{hw.title}」{'已逾期' if is_overdue else f'将在{int(hours_to_deadline)}小时后截止'}。"
            f"截止时间: {hw.deadline.strftime('%Y-%m-%d %H:%M')}。请及时提醒家长和学生。"
        )

        if existing:
            existing.title = title
            existing.content = content
            existing.is_overdue = is_overdue
            existing.priority = ReminderPriority.URGENT if is_overdue else (
                ReminderPriority.HIGH if hours_to_deadline <= 24 else ReminderPriority.NORMAL
            )
        else:
            principal_row = db.query(User.id).filter(User.role == "principal").first()
            principal_id = principal_row[0] if principal_row else None
            reminder = Reminder(
                type=ReminderType.HOMEWORK,
                priority=ReminderPriority.URGENT if is_overdue else (
                    ReminderPriority.HIGH if hours_to_deadline <= 24 else ReminderPriority.NORMAL
                ),
                status=ReminderStatus.PENDING,
                title=title,
                content=content,
                user_id=principal_id or student.teacher_id or 1,
                student_id=student.id,
                class_id=hw.class_id,
                entity_type="homework_submission",
                entity_id=sub.id,
                scheduled_at=now,
                creator_id=operator_id,
                channels=["site", "email"],
                is_overdue=is_overdue,
            )
            db.add(reminder)
            created_count += 1

    db.commit()
    return created_count
