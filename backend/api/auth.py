from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import User
from extensions import db
from utils.error_handler import ValidationError, AuthorizationError

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        raise ValidationError('请提供用户名和密码')
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']):
        raise AuthorizationError('用户名或密码错误')
    
    if not user.is_active:
        raise AuthorizationError('账户已被禁用')
    
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'access_token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        raise AuthorizationError('用户不存在')
    
    return jsonify(user.to_dict()), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    data = request.get_json()
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        raise AuthorizationError('用户不存在')
    
    if not data.get('old_password') or not data.get('new_password'):
        raise ValidationError('请提供原密码和新密码')
    
    if not user.check_password(data['old_password']):
        raise ValidationError('原密码错误')
    
    if len(data['new_password']) < 6:
        raise ValidationError('新密码长度至少6位')
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': '密码修改成功'}), 200

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    from utils.auth import role_required
    role_required('admin').check()
    
    users = User.query.all()
    return jsonify([u.to_dict() for u in users]), 200

@auth_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    from utils.auth import role_required
    role_required('admin').check()
    
    data = request.get_json()
    
    if not data.get('username') or not data.get('email') or not data.get('password'):
        raise ValidationError('请提供用户名、邮箱和密码')
    
    if User.query.filter_by(username=data['username']).first():
        raise ValidationError('用户名已存在')
    
    if User.query.filter_by(email=data['email']).first():
        raise ValidationError('邮箱已被使用')
    
    if data.get('role') and data['role'] not in User.ROLES:
        raise ValidationError(f'角色必须是以下之一: {", ".join(User.ROLES)}')
    
    user = User(
        username=data['username'],
        email=data['email'],
        role=data.get('role', 'curator')
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    
    return jsonify(user.to_dict()), 201

@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    from utils.auth import role_required
    role_required('admin').check()
    
    user = User.query.get(user_id)
    if not user:
        raise ValidationError('用户不存在')
    
    data = request.get_json()
    
    if data.get('username') and data['username'] != user.username:
        if User.query.filter_by(username=data['username']).first():
            raise ValidationError('用户名已存在')
        user.username = data['username']
    
    if data.get('email') and data['email'] != user.email:
        if User.query.filter_by(email=data['email']).first():
            raise ValidationError('邮箱已被使用')
        user.email = data['email']
    
    if data.get('role'):
        if data['role'] not in User.ROLES:
            raise ValidationError(f'角色必须是以下之一: {", ".join(User.ROLES)}')
        user.role = data['role']
    
    if data.get('is_active') is not None:
        user.is_active = data['is_active']
    
    if data.get('password'):
        user.set_password(data['password'])
    
    db.session.commit()
    return jsonify(user.to_dict()), 200
