import pytest
from app import db
from app.services.audit_service import AuditService
from datetime import datetime

def test_create_audit_log(app, test_student):
    with app.app_context():
        user, student = test_student
        
        log = AuditService.log(
            user_id=user.id,
            action='login',
            resource_type='user',
            resource_id=user.id,
            ip_address='127.0.0.1'
        )
        
        assert log is not None
        assert log.action == 'login'
        assert log.user_id == user.id

def test_list_audit_logs(app, test_student):
    with app.app_context():
        user, student = test_student
        
        actions = ['login', 'view_profile', 'update_profile']
        for action in actions:
            AuditService.log(
                user_id=user.id,
                action=action,
                resource_type='user',
                resource_id=user.id
            )
        
        result = AuditService.list_logs({'user_id': user.id})
        assert result['total'] == 3
        assert len(result['items']) == 3

def test_appointment_history(app, test_appointment):
    with app.app_context():
        appointment = test_appointment
        
        statuses = ['confirmed', 'in_progress', 'completed']
        for status in statuses:
            AuditService.log(
                user_id=appointment.student.user_id,
                action='update_status',
                resource_type='appointment',
                resource_id=appointment.id,
                appointment_id=appointment.id,
                old_values={'status': 'previous'},
                new_values={'status': status}
            )
        
        history = AuditService.get_appointment_history(appointment.id)
        assert len(history) == 3
        assert all(h['appointment_id'] == appointment.id for h in history)

def test_audit_log_filters(app, test_student, test_mentor):
    with app.app_context():
        user_s, student = test_student
        user_m, mentor = test_mentor
        
        AuditService.log(user_id=user_s.id, action='view', resource_type='mentor', resource_id=mentor.id)
        AuditService.log(user_id=user_m.id, action='view', resource_type='student', resource_id=student.id)
        AuditService.log(user_id=user_s.id, action='create', resource_type='appointment', resource_id=1)
        
        result = AuditService.list_logs({'resource_type': 'mentor'})
        assert result['total'] == 1
        assert result['items'][0]['action'] == 'view'
        
        result = AuditService.list_logs({'user_id': user_s.id})
        assert result['total'] == 2

def test_audit_log_contains_old_new_values(app, test_appointment):
    with app.app_context():
        appointment = test_appointment
        
        old_status = appointment.status
        new_status = 'completed'
        
        AuditService.log(
            user_id=appointment.student.user_id,
            action='update_status',
            resource_type='appointment',
            resource_id=appointment.id,
            appointment_id=appointment.id,
            old_values={'status': old_status},
            new_values={'status': new_status}
        )
        
        history = AuditService.get_appointment_history(appointment.id)
        assert len(history) == 1
        assert history[0]['old_values']['status'] == old_status
        assert history[0]['new_values']['status'] == new_status
