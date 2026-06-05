from celery import Celery
from flask_mail import Message
from app import mail, create_app, db
from app.models import User, Appointment
from datetime import datetime, timedelta

def make_celery(app=None):
    app = app or create_app()
    celery = Celery(
        app.import_name,
        broker=app.config['CELERY_BROKER_URL'],
        backend=app.config['CELERY_RESULT_BACKEND']
    )
    celery.conf.update(app.config)
    
    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
    
    celery.Task = ContextTask
    return celery

celery_app = make_celery()

@celery_app.task(name='send_email_notification')
def send_email_notification(user_id, subject, body):
    try:
        user = db.session.get(User, user_id)
        if user and user.email:
            msg = Message(subject, recipients=[user.email])
            msg.body = body
            mail.send(msg)
            return True
    except Exception as e:
        print(f"Email send error: {e}")
        return False
    return False

@celery_app.task(name='send_appointment_reminder')
def send_appointment_reminder(appointment_id, hours_before=24):
    try:
        appointment = db.session.get(Appointment, appointment_id)
        if not appointment or appointment.status not in ['confirmed', 'pending']:
            return False
        
        time_slot = appointment.time_slot
        if not time_slot:
            return False
        
        time_until = time_slot.start_time - datetime.utcnow()
        if time_until > timedelta(hours=hours_before + 1):
            return False
        
        student = appointment.student
        mentor = appointment.mentor
        
        if student and student.user:
            subject = f"预约提醒: {appointment.title} 将在{hours_before}小时后开始"
            body = f"您好 {student.user.name}，\n\n您的预约「{appointment.title}」将于 {time_slot.start_time.strftime('%Y-%m-%d %H:%M')} 开始。\n\n导师: {mentor.user.name if mentor.user else '导师'}\n主题: {appointment.title}\n\n请准时参加。"
            send_email_notification.delay(student.user_id, subject, body)
        
        if mentor and mentor.user:
            subject = f"预约提醒: {appointment.title} 将在{hours_before}小时后开始"
            body = f"您好 {mentor.user.name}，\n\n您的预约「{appointment.title}」将于 {time_slot.start_time.strftime('%Y-%m-%d %H:%M')} 开始。\n\n学生: {student.user.name if student.user else '学生'}\n主题: {appointment.title}\n\n请准时参加。"
            send_email_notification.delay(mentor.user_id, subject, body)
        
        return True
    except Exception as e:
        print(f"Reminder error: {e}")
        return False

@celery_app.task(name='sync_offline_data')
def sync_offline_data(user_id, data):
    try:
        from app.services.upload_service import UploadService
        for item in data.get('uploads', []):
            UploadService.save_offline_file(item, user_id)
        return True
    except Exception as e:
        print(f"Offline sync error: {e}")
        return False

@celery_app.task(name='cleanup_expired_slots')
def cleanup_expired_slots():
    try:
        from app.models import TimeSlot
        now = datetime.utcnow()
        expired = TimeSlot.query.filter(
            TimeSlot.end_time < now,
            TimeSlot.is_booked == False
        ).all()
        for slot in expired:
            db.session.delete(slot)
        db.session.commit()
        return len(expired)
    except Exception as e:
        print(f"Cleanup error: {e}")
        db.session.rollback()
        return 0
