from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import Guest, Screening
from extensions import db
from utils.error_handler import ValidationError
from utils.booking_service import check_in_guest
from datetime import datetime

guests_bp = Blueprint('guests', __name__)

@guests_bp.route('', methods=['GET'])
@jwt_required()
def list_guests():
    screening_id = request.args.get('screening_id')
    status = request.args.get('status')
    
    query = Guest.query
    
    if screening_id:
        query = query.filter_by(screening_id=screening_id)
    if status:
        query = query.filter_by(status=status)
    
    guests = query.order_by(Guest.created_at.desc()).all()
    return jsonify([g.to_dict(include_screening=True) for g in guests]), 200

@guests_bp.route('/<int:guest_id>', methods=['GET'])
@jwt_required()
def get_guest(guest_id):
    guest = Guest.query.get(guest_id)
    if not guest:
        raise ValidationError('嘉宾记录不存在')
    return jsonify(guest.to_dict(include_screening=True)), 200

@guests_bp.route('', methods=['POST'])
@jwt_required()
def create_guest():
    from utils.auth import role_required
    role_required('admin', 'curator').check()
    
    data = request.get_json()
    
    required_fields = ['screening_id', 'name']
    for field in required_fields:
        if not data.get(field):
            raise ValidationError(f'请提供{field}')
    
    screening = Screening.query.get(data['screening_id'])
    if not screening:
        raise ValidationError('场次不存在')
    
    guest = Guest(
        screening_id=data['screening_id'],
        name=data['name'],
        title=data.get('title'),
        organization=data.get('organization'),
        phone=data.get('phone'),
        email=data.get('email'),
        status=data.get('status', 'invited'),
        seats=data.get('seats'),
        notes=data.get('notes')
    )
    
    db.session.add(guest)
    db.session.commit()
    
    from utils.notifications import send_guest_invitation
    if guest.email:
        send_guest_invitation(guest)
    
    return jsonify(guest.to_dict(include_screening=True)), 201

@guests_bp.route('/<int:guest_id>', methods=['PUT'])
@jwt_required()
def update_guest(guest_id):
    from utils.auth import role_required
    role_required('admin', 'curator').check()
    
    guest = Guest.query.get(guest_id)
    if not guest:
        raise ValidationError('嘉宾记录不存在')
    
    data = request.get_json()
    
    if data.get('name'):
        guest.name = data['name']
    if data.get('title') is not None:
        guest.title = data['title']
    if data.get('organization') is not None:
        guest.organization = data['organization']
    if data.get('phone') is not None:
        guest.phone = data['phone']
    if data.get('email') is not None:
        guest.email = data['email']
    if data.get('status'):
        if data['status'] not in Guest.STATUS:
            raise ValidationError(f'状态必须是以下之一: {", ".join(Guest.STATUS)}')
        guest.status = data['status']
        if data['status'] == 'confirmed':
            guest.confirmed_at = datetime.utcnow()
        elif data['status'] == 'declined':
            guest.declined_at = datetime.utcnow()
    if data.get('seats') is not None:
        guest.seats = data['seats']
    if data.get('notes') is not None:
        guest.notes = data['notes']
    
    db.session.commit()
    return jsonify(guest.to_dict(include_screening=True)), 200

@guests_bp.route('/<int:guest_id>', methods=['DELETE'])
@jwt_required()
def delete_guest(guest_id):
    from utils.auth import role_required
    role_required('admin', 'curator').check()
    
    guest = Guest.query.get(guest_id)
    if not guest:
        raise ValidationError('嘉宾记录不存在')
    
    db.session.delete(guest)
    db.session.commit()
    
    return jsonify({'message': '嘉宾记录已删除'}), 200

@guests_bp.route('/<int:guest_id>/confirm', methods=['POST'])
@jwt_required()
def confirm_guest(guest_id):
    guest = Guest.query.get(guest_id)
    if not guest:
        raise ValidationError('嘉宾记录不存在')
    
    if guest.status == 'confirmed':
        return jsonify(guest.to_dict()), 200
    
    if guest.status not in ['invited']:
        raise ValidationError(f'该嘉宾状态为{guest.status}，无法确认')
    
    guest.status = 'confirmed'
    guest.confirmed_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(guest.to_dict(include_screening=True)), 200

@guests_bp.route('/<int:guest_id>/decline', methods=['POST'])
@jwt_required()
def decline_guest(guest_id):
    guest = Guest.query.get(guest_id)
    if not guest:
        raise ValidationError('嘉宾记录不存在')
    
    if guest.status == 'declined':
        return jsonify(guest.to_dict()), 200
    
    guest.status = 'declined'
    guest.declined_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(guest.to_dict()), 200

@guests_bp.route('/<int:guest_id>/check-in', methods=['POST'])
@jwt_required()
def check_in_guest_route(guest_id):
    from utils.auth import role_required
    from flask_jwt_extended import get_jwt_identity
    role_required('admin', 'curator', 'frontdesk').check()
    
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    guest = check_in_guest(guest_id, user_id, data.get('notes'))
    
    return jsonify(guest.to_dict(include_screening=True)), 200

@guests_bp.route('/send-invitation/<int:guest_id>', methods=['POST'])
@jwt_required()
def send_invitation(guest_id):
    from utils.auth import role_required
    role_required('admin', 'curator').check()
    
    guest = Guest.query.get(guest_id)
    if not guest:
        raise ValidationError('嘉宾记录不存在')
    
    if not guest.email:
        raise ValidationError('该嘉宾没有邮箱，无法发送邀请')
    
    from utils.notifications import send_guest_invitation
    send_guest_invitation(guest)
    
    return jsonify({'message': '邀请已发送'}), 200
