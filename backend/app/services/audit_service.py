from datetime import datetime
from app import db
from app.models import AuditLog

class AuditService:
    @staticmethod
    def log(user_id, action, resource_type, resource_id=None, appointment_id=None, old_values=None, new_values=None, ip_address=None):
        log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            appointment_id=appointment_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address
        )
        db.session.add(log)
        db.session.commit()
        return log
    
    @staticmethod
    def list_logs(filters=None, page=1, per_page=50):
        query = AuditLog.query
        
        if filters:
            if filters.get('user_id'):
                query = query.filter_by(user_id=filters['user_id'])
            if filters.get('action'):
                query = query.filter_by(action=filters['action'])
            if filters.get('resource_type'):
                query = query.filter_by(resource_type=filters['resource_type'])
            if filters.get('resource_id'):
                query = query.filter_by(resource_id=filters['resource_id'])
            if filters.get('appointment_id'):
                query = query.filter_by(appointment_id=filters['appointment_id'])
            if filters.get('start_date'):
                query = query.filter(AuditLog.created_at >= filters['start_date'])
            if filters.get('end_date'):
                query = query.filter(AuditLog.created_at <= filters['end_date'])
        
        query = query.order_by(AuditLog.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return {
            'items': [l.to_dict() for l in pagination.items],
            'total': pagination.total,
            'page': page,
            'per_page': per_page
        }
    
    @staticmethod
    def get_appointment_history(appointment_id):
        logs = AuditLog.query.filter_by(
            appointment_id=appointment_id
        ).order_by(AuditLog.created_at).all()
        return [l.to_dict() for l in logs]
