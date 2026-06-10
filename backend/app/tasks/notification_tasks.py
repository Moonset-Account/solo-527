from app.tasks.celery_app import celery_app
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.interview import Interview, InterviewStatus
from app.models.todo import Todo, TodoType, TodoPriority, TodoStatus
from app.models.application import Application, ApplicationStatus
from app.models.offer import Offer, OfferStatus
from app.models.todo import ReminderRule


@celery_app.task(name="send_interview_reminder")
def send_interview_reminder(interview_id: int, reminder_type: str = "24h"):
    db = SessionLocal()
    try:
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview or interview.status != InterviewStatus.SCHEDULED:
            return

        todo = Todo(
            title=f"面试提醒: {interview.title}",
            description=f"面试将于 {reminder_type} 后开始，请提前准备。面试时间: {interview.start_time}",
            todo_type=TodoType.NORMAL,
            priority=TodoPriority.NORMAL,
            status=TodoStatus.PENDING,
            assigned_to=interview.scheduled_by,
            related_entity_type="interview",
            related_entity_id=interview_id,
        )
        db.add(todo)
        db.commit()

        return f"Reminder sent for interview {interview_id}"
    finally:
        db.close()


@celery_app.task(name="send_offer_reminder")
def send_offer_reminder(offer_id: int):
    db = SessionLocal()
    try:
        offer = db.query(Offer).filter(Offer.id == offer_id).first()
        if not offer or offer.status != OfferStatus.SENT:
            return

        todo = Todo(
            title=f"Offer回复提醒",
            description=f"Offer ({offer.offer_title}) 待候选人回复，请关注。",
            todo_type=TodoType.FOLLOW_UP,
            priority=TodoPriority.HIGH,
            status=TodoStatus.PENDING,
            assigned_to=offer.created_by,
            related_entity_type="offer",
            related_entity_id=offer_id,
        )
        db.add(todo)
        db.commit()

        return f"Offer reminder sent for offer {offer_id}"
    finally:
        db.close()


@celery_app.task(name="escalate_overdue_todo")
def escalate_overdue_todo(todo_id: int):
    db = SessionLocal()
    try:
        todo = db.query(Todo).filter(Todo.id == todo_id).first()
        if not todo or todo.status == TodoStatus.COMPLETED:
            return

        todo.is_escalated = True
        todo.escalated_at = datetime.utcnow()
        todo.todo_type = TodoType.ESCALATED
        todo.priority = TodoPriority.URGENT
        todo.escalation_reason = "待办已逾期，自动升级催办"
        db.commit()

        return f"Todo {todo_id} escalated"
    finally:
        db.close()
