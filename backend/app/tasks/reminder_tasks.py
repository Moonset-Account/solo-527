from datetime import datetime, timedelta
from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.services.dashboard_service import create_homework_reminders_for_unsubmitted
from app.models import (
    Reminder, ReminderStatus, ReminderType, ReminderPriority,
    Notification, Receipt, ReceiptStatus, Homework, HomeworkSubmission,
    SubmissionStatus, User, Student, ReportRecord, ReportType,
)
from app.models.class_group import ClassGroup
from app.models.schedule import CourseSchedule, CourseConsumption
from app.models.feedback import WorkFeedback
from sqlalchemy import and_, func


@celery_app.task(name="app.tasks.reminder_tasks.check_homework_submission")
def check_homework_submission():
    db = SessionLocal()
    try:
        count = create_homework_reminders_for_unsubmitted(db, operator_id=1)
        return {"task": "check_homework_submission", "reminders_created": count}
    finally:
        db.close()


@celery_app.task(name="app.tasks.reminder_tasks.check_overdue_reminders")
def check_overdue_reminders():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        overdue_count = 0
        reminders = db.query(Reminder).filter(
            Reminder.status.in_([ReminderStatus.PENDING, ReminderStatus.SENT]),
            Reminder.is_overdue == False,
            Reminder.scheduled_at.isnot(None),
            Reminder.scheduled_at < now,
        ).all()
        for r in reminders:
            r.is_overdue = True
            r.updated_at = now
            overdue_count += 1
        db.commit()

        pending = db.query(Reminder).filter(
            Reminder.status == ReminderStatus.PENDING,
            Reminder.scheduled_at <= now,
        ).limit(100).all()
        sent_count = 0
        for r in pending:
            r.status = ReminderStatus.SENT
            r.sent_at = now
            sent_count += 1
        db.commit()
        return {"task": "check_overdue_reminders", "marked_overdue": overdue_count, "sent": sent_count}
    finally:
        db.close()


@celery_app.task
def send_reminder_email(reminder_id: int):
    db = SessionLocal()
    try:
        reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
        if not reminder:
            return {"status": "not_found"}
        user = db.query(User).filter(User.id == reminder.user_id).first()
        print(f"[模拟发送邮件] To: {user.email if user else 'unknown'}, 提醒: {reminder.title}")
        reminder.status = ReminderStatus.SENT
        reminder.sent_at = datetime.utcnow()
        db.commit()
        return {"status": "sent", "to": user.email if user else None}
    finally:
        db.close()


@celery_app.task
def notify_principal_about_homework_overdue():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        results = []
        overdue_subs = (
            db.query(HomeworkSubmission, Homework, Student)
            .join(Homework, HomeworkSubmission.homework_id == Homework.id)
            .join(Student, HomeworkSubmission.student_id == Student.id)
            .filter(
                HomeworkSubmission.status == SubmissionStatus.NOT_SUBMITTED,
                Homework.deadline < now,
                Homework.status == "published",
            )
            .limit(50)
            .all()
        )
        for sub, hw, student in overdue_subs:
            principals = db.query(User).filter(User.role == "principal").all()
            for principal in principals:
                existing = db.query(Reminder).filter_by(
                    type=ReminderType.HOMEWORK,
                    student_id=student.id,
                    entity_type="homework_submission",
                    entity_id=sub.id,
                    is_overdue=True,
                ).first()
                if not existing:
                    reminder = Reminder(
                        type=ReminderType.HOMEWORK,
                        priority=ReminderPriority.URGENT,
                        status=ReminderStatus.PENDING,
                        title=f"【逾期警告】{student.name} 未交作业",
                        content=f"作业「{hw.title}」已逾期。截止时间: {hw.deadline.strftime('%Y-%m-%d %H:%M')}。请联系家长跟进。",
                        user_id=principal.id,
                        student_id=student.id,
                        class_id=hw.class_id,
                        entity_type="homework_submission",
                        entity_id=sub.id,
                        scheduled_at=now,
                        creator_id=1,
                        channels=["site", "sms", "email"],
                        is_overdue=True,
                    )
                    db.add(reminder)
                    results.append({"student": student.name, "homework": hw.title})
        db.commit()
        return {"task": "notify_principal_about_homework_overdue", "notified": len(results), "details": results}
    finally:
        db.close()
