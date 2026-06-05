from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import Hall
from extensions import db
from utils.error_handler import ValidationError

halls_bp = Blueprint('halls', __name__)

@halls_bp.route('', methods=['GET'])
@jwt_required()
def list_halls():
    active_only = request.args.get('active', 'true').lower() == 'true'
    query = Hall.query
    if active_only:
        query = query.filter_by(is_active=True)
    
    halls = query.order_by(Hall.name).all()
    return jsonify([h.to_dict() for h in halls]), 200

@halls_bp.route('/<int:hall_id>', methods=['GET'])
@jwt_required()
def get_hall(hall_id):
    hall = Hall.query.get(hall_id)
    if not hall:
        raise ValidationError('放映厅不存在')
    return jsonify(hall.to_dict(include_screenings=True)), 200

@halls_bp.route('', methods=['POST'])
@jwt_required()
def create_hall():
    from utils.auth import role_required
    role_required('admin', 'curator').check()
    
    data = request.get_json()
    
    if not data.get('name') or not data.get('capacity'):
        raise ValidationError('请提供放映厅名称和容量')
    
    hall = Hall(
        name=data['name'],
        capacity=data['capacity'],
        seat_map=data.get('seat_map'),
        facilities=data.get('facilities'),
        description=data.get('description'),
        is_active=data.get('is_active', True)
    )
    
    db.session.add(hall)
    db.session.commit()
    
    return jsonify(hall.to_dict()), 201

@halls_bp.route('/<int:hall_id>', methods=['PUT'])
@jwt_required()
def update_hall(hall_id):
    from utils.auth import role_required
    role_required('admin', 'curator').check()
    
    hall = Hall.query.get(hall_id)
    if not hall:
        raise ValidationError('放映厅不存在')
    
    data = request.get_json()
    
    if data.get('name'):
        hall.name = data['name']
    if data.get('capacity'):
        hall.capacity = data['capacity']
    if data.get('seat_map') is not None:
        hall.seat_map = data['seat_map']
    if data.get('facilities') is not None:
        hall.facilities = data['facilities']
    if data.get('description') is not None:
        hall.description = data['description']
    if data.get('is_active') is not None:
        hall.is_active = data['is_active']
    
    db.session.commit()
    return jsonify(hall.to_dict()), 200

@halls_bp.route('/<int:hall_id>', methods=['DELETE'])
@jwt_required()
def delete_hall(hall_id):
    from utils.auth import role_required
    role_required('admin').check()
    
    hall = Hall.query.get(hall_id)
    if not hall:
        raise ValidationError('放映厅不存在')
    
    if hall.screenings:
        raise ValidationError('该放映厅有关联的放映场次，无法删除')
    
    db.session.delete(hall)
    db.session.commit()
    
    return jsonify({'message': '放映厅已删除'}), 200

@halls_bp.route('/<int:hall_id>/availability', methods=['GET'])
@jwt_required()
def check_availability(hall_id):
    from datetime import datetime
    from models import Screening
    
    hall = Hall.query.get(hall_id)
    if not hall:
        raise ValidationError('放映厅不存在')
    
    date_str = request.args.get('date')
    if not date_str:
        raise ValidationError('请提供查询日期')
    
    try:
        query_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        raise ValidationError('日期格式不正确，请使用YYYY-MM-DD格式')
    
    day_start = datetime.combine(query_date, datetime.min.time())
    day_end = datetime.combine(query_date, datetime.max.time())
    
    screenings = Screening.query.filter(
        Screening.hall_id == hall_id,
        Screening.start_time >= day_start,
        Screening.start_time <= day_end,
        Screening.status.in_(['draft', 'confirmed'])
    ).all()
    
    booked_slots = []
    for s in screenings:
        booked_slots.append({
            'screening_id': s.id,
            'start_time': s.start_time.isoformat(),
            'end_time': s.end_time.isoformat(),
            'film_title': s.film.title if s.film else None
        })
    
    return jsonify({
        'hall_id': hall_id,
        'hall_name': hall.name,
        'date': date_str,
        'booked_slots': booked_slots
    }), 200
