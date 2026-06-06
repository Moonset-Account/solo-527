from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from models import User

def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = int(get_jwt_identity())
            user = User.query.get(user_id)
            if not user:
                return jsonify({'code': 401, 'message': '用户不存在'}), 401
            if roles and user.role not in roles:
                return jsonify({'code': 403, 'message': '权限不足'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def admin_required(fn):
    return role_required('admin')(fn)

def internal_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'code': 401, 'message': '用户不存在'}), 401
        if user.role not in ['admin', 'staff']:
            return jsonify({'code': 403, 'message': '需要内部账号权限'}), 403
        return fn(*args, **kwargs)
    return wrapper

def get_current_user():
    try:
        verify_jwt_in_request()
        user_id = int(get_jwt_identity())
        return User.query.get(user_id)
    except Exception:
        return None
