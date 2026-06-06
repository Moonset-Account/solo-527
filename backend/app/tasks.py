from datetime import datetime
from sqlalchemy.orm import Session
from . import models
from .database import SessionLocal
from .config import settings
import smtplib
from email.mime.text import MIMEText
from email.header import Header
import logging

logger = logging.getLogger(__name__)


def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def send_email(to_email: str, subject: str, body: str) -> bool:
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        logger.warning("SMTP not configured, skipping email sending")
        return False
    try:
        msg = MIMEText(body, 'plain', 'utf-8')
        msg['Subject'] = Header(subject, 'utf-8')
        msg['From'] = settings.SMTP_USER
        msg['To'] = to_email

        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        raise e


def create_notification(db: Session, user_id: int, title: str, message: str,
                        notification_type: str = "general") -> models.Notification:
    notification = models.Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def process_notification(notification_id: int):
    db = next(get_db_session())
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id
    ).first()

    if not notification:
        return

    user = db.query(models.User).filter(models.User.id == notification.user_id).first()
    if not user:
        return

    try:
        success = send_email(user.email, notification.title, notification.message)
        if success:
            notification.sent_at = datetime.utcnow()
            notification.is_read = True
            db.commit()
            logger.info(f"Notification {notification_id} sent successfully")
    except Exception as e:
        notification.retry_count += 1
        notification.last_retry_at = datetime.utcnow()
        notification.error_message = str(e)

        if notification.retry_count >= notification.max_retries:
            logger.error(f"Notification {notification_id} failed after max retries: {e}")
        else:
            logger.warning(f"Notification {notification_id} failed, retry {notification.retry_count}")

        db.commit()


def retry_failed_notifications():
    db = next(get_db_session())
    failed_notifications = db.query(models.Notification).filter(
        models.Notification.sent_at.is_(None),
        models.Notification.retry_count < models.Notification.max_retries
    ).all()

    for notification in failed_notifications:
        try:
            process_notification(notification.id)
        except Exception as e:
            logger.error(f"Error retrying notification {notification.id}: {e}")


def create_task_for_checkin(checkin: models.Checkin, db: Session = None):
    if db is None:
        db = next(get_db_session())
    runner = db.query(models.User).filter(models.User.id == checkin.runner_id).first()
    if not runner:
        return None
    task = models.Task(
        title=f"待确认打卡: {runner.full_name or runner.username} - {checkin.distance_km}km",
        task_type=models.TaskType.CHECKIN,
        status=models.TaskStatus.PENDING_CONFIRM,
        related_id=checkin.id
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def create_task_for_activity_signup(signup: models.ActivitySignup, db: Session = None):
    if db is None:
        db = next(get_db_session())
    runner = db.query(models.User).filter(models.User.id == signup.runner_id).first()
    activity = db.query(models.Activity).filter(models.Activity.id == signup.activity_id).first()
    if not runner or not activity:
        return None
    task = models.Task(
        title=f"活动报名待确认: {runner.full_name or runner.username} - {activity.title}",
        task_type=models.TaskType.ACTIVITY_SIGNUP,
        status=models.TaskStatus.PENDING_CONFIRM,
        related_id=signup.id
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def check_injury_reminders():
    db = next(get_db_session())
    unresolved_injuries = db.query(models.InjuryNote).filter(
        models.InjuryNote.is_resolved == False
    ).all()

    for injury in unresolved_injuries:
        days_since_report = (datetime.utcnow() - injury.reported_at).days
        if injury.rest_days and days_since_report >= injury.rest_days:
            coaches = db.query(models.User).filter(
                models.User.role.in_([models.UserRole.ADMIN, models.UserRole.COACH])
            ).all()
            runner = db.query(models.User).filter(models.User.id == injury.runner_id).first()
            for coach in coaches:
                create_notification(
                    db,
                    coach.id,
                    f"伤病恢复提醒: {runner.full_name or runner.username}",
                    f"{runner.full_name or runner.username}的伤病「{injury.title}」已过建议休息期，请评估是否可以恢复训练。"
                )
