from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Building
from utils.decorators import internal_required
from utils.response import success_response, paginate_query
from utils.error_handler import APIError

buildings_bp = Blueprint('buildings', __name__)

@buildings_bp.route('/public', methods=['GET'])
def list_public_buildings():
    buildings = Building.query.filter_by(is_active=True).order_by(Building.name).all()
    return jsonify(success_response([b.to_dict() for b in buildings]))

@buildings_bp.route('', methods=['GET'])
@internal_required
def list_buildings():
    query = Building.query
    keyword = request.args.get('keyword')
    is_active = request.args.get('is_active')
    
    if keyword:
        query = query.filter(Building.name.like(f'%{keyword}%'))
    if is_active is not None:
        query = query.filter(Building.is_active == (is_active == 'true'))
    
    query = query.order_by(Building.name)
    result = paginate_query(query)
    
    return jsonify(success_response({
        'items': [b.to_dict() for b in result['items']],
        'total': result['total'],
        'page': result['page'],
        'per_page': result['per_page']
    }))

@buildings_bp.route('/<int:building_id>', methods=['GET'])
@internal_required
def get_building(building_id):
    building = Building.query.get(building_id)
    if not building:
        raise APIError('楼栋不存在', 404)
    return jsonify(success_response(building.to_dict()))

@buildings_bp.route('', methods=['POST'])
@internal_required
def create_building():
    data = request.get_json()
    name = data.get('name')
    
    if not name:
        raise APIError('请填写楼栋名称', 400)
    
    if Building.query.filter_by(name=name).first():
        raise APIError('该楼栋名称已存在', 400)
    
    building = Building(
        name=name,
        address=data.get('address'),
        contact=data.get('contact'),
        contact_phone=data.get('contact_phone'),
        is_active=data.get('is_active', True)
    )
    db.session.add(building)
    db.session.commit()
    
    return jsonify(success_response(building.to_dict(), '创建成功'))

@buildings_bp.route('/<int:building_id>', methods=['PUT'])
@internal_required
def update_building(building_id):
    building = Building.query.get(building_id)
    if not building:
        raise APIError('楼栋不存在', 404)
    
    data = request.get_json()
    if 'name' in data and data['name'] != building.name:
        if Building.query.filter_by(name=data['name']).first():
            raise APIError('该楼栋名称已存在', 400)
        building.name = data['name']
    for field in ['address', 'contact', 'contact_phone']:
        if field in data:
            setattr(building, field, data[field])
    if 'is_active' in data:
        building.is_active = data['is_active']
    
    db.session.commit()
    return jsonify(success_response(building.to_dict(), '更新成功'))

@buildings_bp.route('/<int:building_id>', methods=['DELETE'])
@internal_required
def delete_building(building_id):
    building = Building.query.get(building_id)
    if not building:
        raise APIError('楼栋不存在', 404)
    
    if building.orders:
        raise APIError('该楼栋有订单记录，无法删除', 400)
    
    db.session.delete(building)
    db.session.commit()
    return jsonify(success_response(None, '删除成功'))
