from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, Building
from utils.response import success_response, error_response
from utils.error_handler import APIError

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    phone = data.get('phone')
    password = data.get('password')
    
    if not phone or not password:
        raise APIError('请输入手机号和密码', 400)
    
    user = User.query.filter_by(phone=phone).first()
    if not user or not user.check_password(password):
        raise APIError('手机号或密码错误', 401)
    
    access_token = create_access_token(identity=str(user.id))
    return jsonify(success_response({
        'token': access_token,
        'user': user.to_dict()
    }, '登录成功'))

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    phone = data.get('phone')
    password = data.get('password')
    building_id = data.get('building_id')
    room_number = data.get('room_number')
    
    if not name or not phone or not password:
        raise APIError('请填写完整信息', 400)
    
    if User.query.filter_by(phone=phone).first():
        raise APIError('该手机号已注册', 400)
    
    if building_id:
        building = Building.query.get(building_id)
        if not building:
            raise APIError('所选楼栋不存在', 400)
    
    user = User(
        name=name,
        phone=phone,
        password=password,
        role='user',
        building_id=building_id,
        room_number=room_number
    )
    db.session.add(user)
    db.session.commit()
    
    access_token = create_access_token(identity=str(user.id))
    return jsonify(success_response({
        'token': access_token,
        'user': user.to_dict()
    }, '注册成功'))

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        raise APIError('用户不存在', 404)
    return jsonify(success_response(user.to_dict()))

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify(success_response(None, '退出成功'))
