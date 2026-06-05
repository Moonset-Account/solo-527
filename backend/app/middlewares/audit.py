from functools import wraps
from flask import request, g
from app.models import AuditLog
from app import db
from datetime import datetime

def audit_log(action, resource_type):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = getattr(g, 'current_user', None)
            response = f(*args, **kwargs)
            
            try:
                resource_id = kwargs.get('id') or kwargs.get('appointment_id')
                log = AuditLog(
                    user_id=user.id if user else None,
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    ip_address=request.remote_addr,
                    user_agent=request.user_agent.string,
                    created_at=datetime.utcnow()
                )
                db.session.add(log)
                db.session.commit()
            except Exception:
                db.session.rollback()
            
            return response
        return decorated_function
    return decorator
