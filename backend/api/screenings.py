from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Screening, Film, Hall, User
from app import db
from utils.error_handler import ValidationError
from datetime import datetime, timedelta

screenings_bp = Blueprint('screenings', __name__)

@screenings_bp.route('', methods=['GET'])
@jwt_required()
def list_screenings():
    status = request.args.get('status')
    film_id = request.args.get('film_id')
    hall_id = request.args.get('hall_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Screening.query
    
    if status:
        query = query.filter_by(status=status)
    if film_id:
        query = query.filter_by(film_id=film_id)
    if hall_id:
        query = query.filter_by(hall_id=hall_id)
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(Screening.start_time >= start_dt)
        except ValueError:
            pass
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
            query = query.filter(Screening.start_time < end_dt)
        except ValueError:
            pass
    
    screenings = query.order_by(Screening.start_time.desc()).all()
    return jsonify([s.to_dict(include_film=True, include_hall=True) for s in screenings]), 200

@screenings_bp.route('/calendar', methods=['GET'])
@jwt_required()
def get_calendar_view():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if not start_date or not end_date:
        raise ValidationError('请提供开始和结束日期')
    
    try:
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
    except ValueError:
        raise ValidationError('日期格式不正确')
    
    screenings = Screening.query.filter(
        Screening.start_time >= start_dt,
        Screening.start_time < end_dt,
        Screening.status.in_(['confirmed', 'draft'])
    ).order_by(Screening.start_time.asc()).all()
    
    return jsonify([s.to_dict(include_film=True, include_hall=True) for s in screenings]), 200

@screenings_bp.route('/<int:screening_id>', methods=['GET'])
@jwt_required()
def get_screening(screening_id):
    screening = Screening.query.get(screening_id)
    if not screening:
        raise ValidationError('场次不存在')
    return jsonify(screening.to_dict(include_bookings=True, include_film=True, include_hall=True)), 200

@screenings_bp.route('', methods=['POST'])
@jwt_required()
def create_screening():
    from utils.auth import role_required
    role_required('admin', 'curator')()
    
    data = request.get_json()
    
    required_fields = ['film_id', 'hall_id', 'start_time']
    for field in required_fields:
        if not data.get(field):
            raise ValidationError(f'请提供{field}')
    
    film = Film.query.get(data['film_id'])
    if not film:
        raise ValidationError('影片不存在')
    
    hall = Hall.query.get(data['hall_id'])
    if not hall:
        raise ValidationError('放映厅不存在')
    
    try:
        start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
    except ValueError:
        raise ValidationError('开始时间格式不正确')
    
    end_time = start_time + timedelta(minutes=film.duration + 15)
    if data.get('end_time'):
        try:
            end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
        except ValueError:
            pass
    
    if not film.is_license_valid(start_time.date()):
        raise ValidationError(f'该影片在{start_time.date()}时授权已过期，无法排片')
    
    day_start = datetime.combine(start_time.date(), datetime.min.time())
    day_end = datetime.combine(start_time.date(), datetime.max.time())
    
    conflict_screenings = Screening.query.filter(
        Screening.hall_id == data['hall_id'],
        Screening.start_time >= day_start,
        Screening.start_time <= day_end,
        Screening.id != (data.get('id') or -1),
        Screening.status.in_(['draft', 'confirmed'])
    ).all()
    
    for s in conflict_screenings:
        s_end = s.end_time
        if not (end_time <= s.start_time or start_time >= s_end):
            raise ValidationError(f'该时段与放映"{s.film.title if s.film else "未知"}"冲突')
    
    capacity = data.get('capacity', hall.capacity)
    if capacity > hall.capacity:
        raise ValidationError(f'容量不能超过放映厅容量({hall.capacity})')
    
    user_id = get_jwt_identity()
    
    screening = Screening(
        film_id=data['film_id'],
        hall_id=data['hall_id'],
        start_time=start_time,
        end_time=end_time,
        capacity=capacity,
        reserved_seats=data.get('reserved_seats'),
        status=data.get('status', 'draft'),
        is_member_only=data.get('is_member_only', True),
        allow_waitlist=data.get('allow_waitlist', True),
        curator_notes=data.get('curator_notes'),
        guest_info=data.get('guest_info'),
        created_by=user_id
    )
    
    db.session.add(screening)
    db.session.commit()
    
    return jsonify(screening.to_dict(include_film=True, include_hall=True)), 201

@screenings_bp.route('/<int:screening_id>', methods=['PUT'])
@jwt_required()
def update_screening(screening_id):
    from utils.auth import role_required
    role_required('admin', 'curator')()
    
    screening = Screening.query.get(screening_id)
    if not screening:
        raise ValidationError('场次不存在')
    
    data = request.get_json()
    
    if data.get('film_id'):
        film = Film.query.get(data['film_id'])
        if not film:
            raise ValidationError('影片不存在')
        screening.film_id = data['film_id']
    
    if data.get('hall_id'):
        hall = Hall.query.get(data['hall_id'])
        if not hall:
            raise ValidationError('放映厅不存在')
        screening.hall_id = data['hall_id']
    
    if data.get('start_time'):
        try:
            screening.start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
        except ValueError:
            raise ValidationError('开始时间格式不正确')
    
    if data.get('end_time'):
        try:
            screening.end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
        except ValueError:
            raise ValidationError('结束时间格式不正确')
    
    if data.get('capacity') is not None:
        hall = Hall.query.get(screening.hall_id)
        if data['capacity'] > hall.capacity:
            raise ValidationError(f'容量不能超过放映厅容量({hall.capacity})')
        screening.capacity = data['capacity']
    
    if data.get('reserved_seats') is not None:
        screening.reserved_seats = data['reserved_seats']
    if data.get('status'):
        if data['status'] not in Screening.STATUS:
            raise ValidationError(f'状态必须是以下之一: {", ".join(Screening.STATUS)}')
        screening.status = data['status']
    if data.get('is_member_only') is not None:
        screening.is_member_only = data['is_member_only']
    if data.get('allow_waitlist') is not None:
        screening.allow_waitlist = data['allow_waitlist']
    if data.get('curator_notes') is not None:
        screening.curator_notes = data['curator_notes']
    if data.get('guest_info') is not None:
        screening.guest_info = data['guest_info']
    
    db.session.commit()
    return jsonify(screening.to_dict(include_film=True, include_hall=True)), 200

@screenings_bp.route('/<int:screening_id>', methods=['DELETE'])
@jwt_required()
def delete_screening(screening_id):
    from utils.auth import role_required
    role_required('admin', 'curator')()
    
    screening = Screening.query.get(screening_id)
    if not screening:
        raise ValidationError('场次不存在')
    
    if screening.bookings:
        confirmed_bookings = [b for b in screening.bookings if b.status == 'confirmed']
        if confirmed_bookings:
            raise ValidationError('该场次已有确认报名，请先取消所有报名后再删除')
    
    db.session.delete(screening)
    db.session.commit()
    
    return jsonify({'message': '场次已删除'}), 200

@screenings_bp.route('/<int:screening_id>/confirm', methods=['POST'])
@jwt_required()
def confirm_screening(screening_id):
    from utils.auth import role_required
    role_required('admin', 'curator')()
    
    screening = Screening.query.get(screening_id)
    if not screening:
        raise ValidationError('场次不存在')
    
    if screening.status == 'confirmed':
        return jsonify(screening.to_dict()), 200
    
    if screening.status not in ['draft']:
        raise ValidationError('只有草稿状态的场次可以确认')
    
    if not screening.film.is_license_valid(screening.start_time.date()):
        raise ValidationError('该影片授权已过期，无法确认场次')
    
    screening.status = 'confirmed'
    db.session.commit()
    
    return jsonify(screening.to_dict(include_film=True, include_hall=True)), 200

@screenings_bp.route('/<int:screening_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_screening(screening_id):
    from utils.auth import role_required
    role_required('admin', 'curator')()
    
    screening = Screening.query.get(screening_id)
    if not screening:
        raise ValidationError('场次不存在')
    
    if screening.status == 'cancelled':
        return jsonify(screening.to_dict()), 200
    
    if screening.status not in ['draft', 'confirmed']:
        raise ValidationError('该场次状态无法取消')
    
    from utils.notifications import send_booking_cancellation
    for booking in screening.bookings:
        if booking.status in ['confirmed', 'waitlisted']:
            booking.status = 'cancelled'
            booking.cancelled_at = datetime.utcnow()
            send_booking_cancellation(booking, '场次已取消')
    
    for guest in screening.guests:
        if guest.status in ['invited', 'confirmed']:
            guest.status = 'declined'
    
    screening.status = 'cancelled'
    db.session.commit()
    
    return jsonify(screening.to_dict()), 200

@screenings_bp.route('/<int:screening_id>/complete', methods=['POST'])
@jwt_required()
def complete_screening(screening_id):
    from utils.auth import role_required
    role_required('admin', 'curator', 'frontdesk')()
    
    screening = Screening.query.get(screening_id)
    if not screening:
        raise ValidationError('场次不存在')
    
    if screening.status == 'completed':
        return jsonify(screening.to_dict()), 200
    
    for booking in screening.bookings:
        if booking.status == 'confirmed':
            booking.status = 'no_show'
    
    screening.status = 'completed'
    db.session.commit()
    
    return jsonify(screening.to_dict()), 200
