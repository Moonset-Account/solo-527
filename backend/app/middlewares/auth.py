from functools import wraps
from flask import request, g, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models import User
from app import db

def auth_middleware():
    if request.path.startswith('/api/auth/') or request.path == '/health':
        return None
    
    if request.method == 'OPTIONS':
        return None
    
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            user = db.session.get(User, user_id)
            if user and user.is_active:
                g.current_user = user
                return None
    except Exception:
        pass
    
    if request.path.startswith('/api/'):
        pass

def get_current_user():
    return getattr(g, 'current_user', None)

def require_login(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def require_role(*roles):
    def decorator(f):
        @wraps(f)
        @require_login
        def decorated_function(*args, **kwargs):
            user = get_current_user()
            if user.role not in roles:
                return jsonify({'error': 'Permission denied'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_appointment_access(f):
    @wraps(f)
    @require_login
    def decorated_function(*args, **kwargs):
        from app.models import Appointment
        user = get_current_user()
        appointment_id = kwargs.get('appointment_id') or request.view_args.get('appointment_id')
        
        if user.role == 'admin':
            return f(*args, **kwargs)
        
        appointment = db.session.get(Appointment, appointment_id)
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        if user.student_profile and appointment.student_id == user.student_profile.id:
            return f(*args, **kwargs)
        
        if user.mentor_profile and appointment.mentor_id == user.mentor_profile.id:
            return f(*args, **kwargs)
        
        return jsonify({'error': 'Permission denied'}), 403
    return decorated_function
