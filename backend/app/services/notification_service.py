from datetime import datetime
from app import db, mail
from flask_mail import Message
from app.models import Notification, User

class NotificationService:
    @staticmethod
    def create_notification(user_id, type, title, content, related_type=None, related_id=None):
        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            content=content,
            related_type=related_type,
            related_id=related_id
        )
        db.session.add(notification)
        db.session.commit()
        
        try:
            from flask import current_app
            if hasattr(current_app, 'celery') and current_app.celery:
                send_email = current_app.celery.tasks.get('send_email_notification')
                if send_email:
                    send_email.delay(user_id, title, content)
                else:
                    NotificationService.send_email(user_id, title, content)
            else:
                NotificationService.send_email(user_id, title, content)
        except Exception as e:
            print(f"Notification email failed (fallback to sync): {e}")
            NotificationService.send_email(user_id, title, content)
        
        return notification.to_dict()
    
    @staticmethod
    def list_notifications(user_id, unread_only=False, page=1, per_page=20):
        query = Notification.query.filter_by(user_id=user_id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        query = query.order_by(Notification.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return {
            'items': [n.to_dict() for n in pagination.items],
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'unread_count': Notification.query.filter_by(user_id=user_id, is_read=False).count()
        }
    
    @staticmethod
    def mark_as_read(notification_id, user_id):
        notification = db.session.get(Notification, notification_id)
        if not notification or notification.user_id != user_id:
            raise ValueError('Notification not found')
        
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        db.session.commit()
        return notification.to_dict()
    
    @staticmethod
    def mark_all_as_read(user_id):
        Notification.query.filter_by(user_id=user_id, is_read=False).update({
            'is_read': True,
            'read_at': datetime.utcnow()
        })
        db.session.commit()
        return True
    
    @staticmethod
    def get_unread_count(user_id):
        return Notification.query.filter_by(user_id=user_id, is_read=False).count()
    
    @staticmethod
    def send_email(user_id, subject, body):
        user = db.session.get(User, user_id)
        if not user or not user.email:
            return False
        
        try:
            msg = Message(subject, recipients=[user.email])
            msg.body = body
            mail.send(msg)
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False
