from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Building
from utils.decorators import admin_required, internal_required
from utils.response import success_response, paginate_query
from utils.error_handler import APIError

users_bp = Blueprint('users', __name__)

@users_bp.route('', methods=['GET'])
@internal_required
def list_users():
    query = User.query
    keyword = request.args.get('keyword')
    role = request.args.get('role')
    building_id = request.args.get('building_id')
    
    if keyword:
        query = query.filter(
            (User.name.like(f'%{keyword}%')) | 
            (User.phone.like(f'%{keyword}%'))
        )
    if role:
        query = query.filter(User.role == role)
    if building_id:
        query = query.filter(User.building_id == building_id)
    
    query = query.order_by(User.created_at.desc())
    result = paginate_query(query)
    
    return jsonify(success_response({
        'items': [u.to_dict() for u in result['items']],
        'total': result['total'],
        'page': result['page'],
        'per_page': result['per_page'],
        'pages': result['pages']
    }))

@users_bp.route('/<int:user_id>', methods=['GET'])
@internal_required
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        raise APIError('用户不存在', 404)
    return jsonify(success_response(user.to_dict()))

@users_bp.route('', methods=['POST'])
@admin_required
def create_user():
    data = request.get_json()
    name = data.get('name')
    phone = data.get('phone')
    password = data.get('password', '123456')
    role = data.get('role', 'user')
    building_id = data.get('building_id')
    room_number = data.get('room_number')
    
    if not name or not phone:
        raise APIError('请填写姓名和手机号', 400)
    
    if User.query.filter_by(phone=phone).first():
        raise APIError('该手机号已存在', 400)
    
    user = User(
        name=name,
        phone=phone,
        password=password,
        role=role,
        building_id=building_id,
        room_number=room_number
    )
    db.session.add(user)
    db.session.commit()
    
    return jsonify(success_response(user.to_dict(), '创建成功'))

@users_bp.route('/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        raise APIError('用户不存在', 404)
    
    data = request.get_json()
    if 'name' in data:
        user.name = data['name']
    if 'phone' in data and data['phone'] != user.phone:
        if User.query.filter_by(phone=data['phone']).first():
            raise APIError('该手机号已存在', 400)
        user.phone = data['phone']
    if 'password' in data and data['password']:
        user.password = data['password']
    if 'role' in data:
        user.role = data['role']
    if 'building_id' in data:
        user.building_id = data['building_id']
    if 'room_number' in data:
        user.room_number = data['room_number']
    
    db.session.commit()
    return jsonify(success_response(user.to_dict(), '更新成功'))

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        raise APIError('用户不存在', 404)
    
    if user.orders:
        raise APIError('该用户有订单记录，无法删除', 400)
    
    db.session.delete(user)
    db.session.commit()
    return jsonify(success_response(None, '删除成功'))
