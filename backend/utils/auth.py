from functools import wraps
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from models import User
from utils.error_handler import AuthorizationError

def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user:
                raise AuthorizationError('User not found')
            
            if not user.is_active:
                raise AuthorizationError('User account is disabled')
            
            if roles and user.role not in roles:
                raise AuthorizationError(f'Requires one of roles: {", ".join(roles)}')
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def get_current_user():
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        return User.query.get(user_id)
    except:
        return None
