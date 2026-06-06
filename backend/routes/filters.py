from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
from models import db, SavedFilter
from utils.response import success_response
from utils.error_handler import APIError

filters_bp = Blueprint('filters', __name__)

@filters_bp.route('', methods=['GET'])
@jwt_required()
def list_filters():
    user_id = get_jwt_identity()
    page_name = request.args.get('page_name')
    
    query = SavedFilter.query.filter_by(user_id=user_id)
    if page_name:
        query = query.filter_by(page_name=page_name)
    
    filters = query.order_by(SavedFilter.is_default.desc(), SavedFilter.created_at.desc()).all()
    
    return jsonify(success_response([f.to_dict() for f in filters]))

@filters_bp.route('', methods=['POST'])
@jwt_required()
def save_filter():
    user_id = get_jwt_identity()
    data = request.get_json()
    page_name = data.get('page_name')
    filter_name = data.get('filter_name')
    filter_data = data.get('filter_data')
    is_default = data.get('is_default', False)
    
    if not page_name or not filter_name or filter_data is None:
        raise APIError('请填写完整信息', 400)
    
    if is_default:
        SavedFilter.query.filter_by(
            user_id=user_id,
            page_name=page_name,
            is_default=True
        ).update({'is_default': False})
    
    saved_filter = SavedFilter(
        user_id=user_id,
        page_name=page_name,
        filter_name=filter_name,
        filter_data=json.dumps(filter_data) if isinstance(filter_data, dict) else filter_data,
        is_default=is_default
    )
    
    db.session.add(saved_filter)
    db.session.commit()
    
    return jsonify(success_response(saved_filter.to_dict(), '已保存筛选条件'))

@filters_bp.route('/<int:filter_id>', methods=['PUT'])
@jwt_required()
def update_filter(filter_id):
    user_id = get_jwt_identity()
    saved_filter = SavedFilter.query.get(filter_id)
    
    if not saved_filter or saved_filter.user_id != user_id:
        raise APIError('筛选条件不存在', 404)
    
    data = request.get_json()
    
    if 'filter_name' in data:
        saved_filter.filter_name = data['filter_name']
    if 'filter_data' in data:
        saved_filter.filter_data = json.dumps(data['filter_data']) if isinstance(data['filter_data'], dict) else data['filter_data']
    if 'is_default' in data:
        if data['is_default']:
            SavedFilter.query.filter_by(
                user_id=user_id,
                page_name=saved_filter.page_name,
                is_default=True
            ).update({'is_default': False})
        saved_filter.is_default = data['is_default']
    
    db.session.commit()
    
    return jsonify(success_response(saved_filter.to_dict(), '已更新'))

@filters_bp.route('/<int:filter_id>', methods=['DELETE'])
@jwt_required()
def delete_filter(filter_id):
    user_id = get_jwt_identity()
    saved_filter = SavedFilter.query.get(filter_id)
    
    if not saved_filter or saved_filter.user_id != user_id:
        raise APIError('筛选条件不存在', 404)
    
    db.session.delete(saved_filter)
    db.session.commit()
    
    return jsonify(success_response(None, '已删除'))
