from app.tasks.celery_app import celery_app
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.interview import Interview, InterviewStatus
from app.models.todo import Todo, TodoType, TodoPriority, TodoStatus, ReminderRule
from app.models.application import Application, ApplicationStatus, ApplicationStage
from app.models.dictionary import SystemConfig


@celery_app.task(name="check_interview_reminders")
def check_interview_reminders():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        next_24h = now + timedelta(hours=24)

        interviews = db.query(Interview).filter(
            Interview.status == InterviewStatus.SCHEDULED,
            Interview.start_time >= now,
            Interview.start_time <= next_24h,
        ).all()

        config = db.query(SystemConfig).filter(
            SystemConfig.config_key == "interview_reminder_hours"
        ).first()
        reminder_hours = int(config.config_value) if config and config.config_value else 24

        count = 0
        for interview in interviews:
            time_diff = interview.start_time.replace(tzinfo=None) - now
            if time_diff.total_seconds() <= reminder_hours * 3600:
                existing = db.query(Todo).filter(
                    Todo.related_entity_type == "interview",
                    Todo.related_entity_id == interview.id,
                    Todo.title.like("%面试提醒%"),
                ).first()
                if not existing:
                    todo = Todo(
                        title=f"面试提醒: {interview.title}",
                        description=f"面试将于 {reminder_hours} 小时内开始，请提前准备。",
                        todo_type=TodoType.NORMAL,
                        priority=TodoPriority.NORMAL,
                        status=TodoStatus.PENDING,
                        assigned_to=interview.scheduled_by,
                        related_entity_type="interview",
                        related_entity_id=interview.id,
                    )
                    db.add(todo)
                    count += 1

        db.commit()
        return f"Generated {count} interview reminders"
    finally:
        db.close()


@celery_app.task(name="check_status_timeout")
def check_status_timeout():
    db = SessionLocal()
    try:
        from app.models.application_history import ApplicationStatusHistory

        config = db.query(SystemConfig).filter(
            SystemConfig.config_key == "stage_timeout_days"
        ).first()
        timeout_days = int(config.config_value) if config and config.config_value else 7

        now = datetime.utcnow()
        timeout_date = now - timedelta(days=timeout_days)

        applications = db.query(Application).filter(
            Application.status.notin_([
                ApplicationStatus.REJECTED,
                ApplicationStatus.OFFER_ACCEPTED,
                ApplicationStatus.CANCELLED,
            ])
        ).all()

        count = 0
        for app in applications:
            last_history = db.query(ApplicationStatusHistory).filter(
                ApplicationStatusHistory.application_id == app.id
            ).order_by(ApplicationStatusHistory.changed_at.desc()).first()

            if last_history and last_history.changed_at.replace(tzinfo=None) < timeout_date:
                existing = db.query(Todo).filter(
                    Todo.related_entity_type == "application",
                    Todo.related_entity_id == app.id,
                    Todo.todo_type == TodoType.STATUS_EXPIRED,
                    Todo.status == TodoStatus.PENDING,
                ).first()

                if not existing:
                    todo = Todo(
                        title=f"状态超时提醒: 申请 #{app.id}",
                        description=f"候选人在 {app.current_stage.value} 阶段已停留超过 {timeout_days} 天，请及时处理。",
                        todo_type=TodoType.STATUS_EXPIRED,
                        priority=TodoPriority.HIGH,
                        status=TodoStatus.PENDING,
                        assigned_to=app.assigned_recruiter,
                        related_entity_type="application",
                        related_entity_id=app.id,
                        is_escalated=True,
                        escalated_at=now,
                        escalation_reason=f"状态停留超过 {timeout_days} 天，自动升级催办",
                    )
                    db.add(todo)
                    count += 1

        db.commit()
        return f"Generated {count} status timeout escalations"
    finally:
        db.close()


@celery_app.task(name="daily_scheduled_check")
def daily_scheduled_check():
    check_interview_reminders.delay()
    check_status_timeout.delay()
    return "Daily scheduled checks triggered"
