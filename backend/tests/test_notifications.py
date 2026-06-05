import pytest
from app import db
from app.models import Notification, User
from app.services.notification_service import NotificationService

def test_create_notification(app, test_student):
    with app.app_context():
        user, student = test_student
        
        notification = NotificationService.create_notification(
            user_id=user.id,
            type='appointment_request',
            title='新的预约请求',
            content='您有一个新的预约请求待处理',
            related_type='appointment',
            related_id=1
        )
        
        assert notification is not None
        assert notification['title'] == '新的预约请求'
        assert notification['is_read'] == False

def test_list_notifications(app, test_student):
    with app.app_context():
        user, student = test_student
        
        for i in range(5):
            NotificationService.create_notification(
                user_id=user.id,
                type='test',
                title=f'Test Notification {i}',
                content=f'Test content {i}'
            )
        
        result = NotificationService.list_notifications(user.id)
        assert result['total'] == 5
        assert len(result['items']) == 5

def test_mark_notification_read(app, test_student):
    with app.app_context():
        user, student = test_student
        
        notification_data = NotificationService.create_notification(
            user_id=user.id,
            type='test',
            title='Test',
            content='Test content'
        )
        
        result = NotificationService.mark_as_read(notification_data['id'], user.id)
        assert result['is_read'] == True
        assert result['read_at'] is not None

def test_mark_all_read(app, test_student):
    with app.app_context():
        user, student = test_student
        
        for i in range(3):
            NotificationService.create_notification(
                user_id=user.id,
                type='test',
                title=f'Test {i}',
                content=f'Content {i}'
            )
        
        NotificationService.mark_all_as_read(user.id)
        count = NotificationService.get_unread_count(user.id)
        assert count == 0

def test_unread_count(app, test_student):
    with app.app_context():
        user, student = test_student
        
        for i in range(3):
            NotificationService.create_notification(
                user_id=user.id,
                type='test',
                title=f'Test {i}',
                content=f'Content {i}'
            )
        
        count = NotificationService.get_unread_count(user.id)
        assert count == 3
