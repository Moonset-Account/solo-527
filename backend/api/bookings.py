from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Booking, Screening, Member
from app import db
from utils.error_handler import ValidationError
from utils.booking_service import create_booking, cancel_booking, check_in_booking, process_waitlist
from datetime import datetime

bookings_bp = Blueprint('bookings', __name__)

@bookings_bp.route('', methods=['GET'])
@jwt_required()
def list_bookings():
    screening_id = request.args.get('screening_id')
    member_id = request.args.get('member_id')
    status = request.args.get('status')
    
    query = Booking.query
    
    if screening_id:
        query = query.filter_by(screening_id=screening_id)
    if member_id:
        query = query.filter_by(member_id=member_id)
    if status:
        query = query.filter_by(status=status)
    
    bookings = query.order_by(Booking.created_at.desc()).all()
    return jsonify([b.to_dict(include_member=True, include_screening=True) for b in bookings]), 200

@bookings_bp.route('/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_booking(booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        raise ValidationError('报名记录不存在')
    return jsonify(booking.to_dict(include_member=True, include_screening=True)), 200

@bookings_bp.route('', methods=['POST'])
@jwt_required()
def create_booking_route():
    from utils.auth import role_required
    role_required('admin', 'curator', 'frontdesk')()
    
    data = request.get_json()
    
    required_fields = ['screening_id', 'member_id']
    for field in required_fields:
        if not data.get(field):
            raise ValidationError(f'请提供{field}')
    
    booking = create_booking(
        screening_id=data['screening_id'],
        member_id=data['member_id'],
        guest_count=data.get('guest_count', 0),
        seats=data.get('seats'),
        notes=data.get('notes')
    )
    
    return jsonify(booking.to_dict(include_member=True, include_screening=True)), 201

@bookings_bp.route('/<int:booking_id>/confirm', methods=['POST'])
@jwt_required()
def confirm_booking(booking_id):
    from utils.auth import role_required
    role_required('admin', 'curator', 'frontdesk')()
    
    booking = Booking.query.get(booking_id)
    if not booking:
        raise ValidationError('报名记录不存在')
    
    if booking.status == 'confirmed':
        return jsonify(booking.to_dict()), 200
    
    if booking.status not in ['pending', 'waitlisted']:
        raise ValidationError(f'该报名状态为{booking.status}，无法确认')
    
    if booking.status == 'waitlisted':
        screening = booking.screening
        if screening.get_available_seats() <= 0:
            raise ValidationError('该场次已满，无法确认候补报名')
    
    booking.status = 'confirmed'
    booking.confirmed_at = datetime.utcnow()
    booking.waitlist_position = None
    
    db.session.commit()
    
    from utils.notifications import send_booking_confirmation
    send_booking_confirmation(booking)
    
    return jsonify(booking.to_dict(include_member=True, include_screening=True)), 200

@bookings_bp.route('/<int:booking_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_booking_route(booking_id):
    from utils.auth import role_required
    role_required('admin', 'curator', 'frontdesk')()
    
    data = request.get_json() or {}
    booking = cancel_booking(booking_id, data.get('reason'))
    
    return jsonify(booking.to_dict(include_member=True, include_screening=True)), 200

@bookings_bp.route('/<int:booking_id>/check-in', methods=['POST'])
@jwt_required()
def check_in(booking_id):
    from utils.auth import role_required
    role_required('admin', 'curator', 'frontdesk')()
    
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    booking = check_in_booking(booking_id, user_id, data.get('notes'))
    
    return jsonify(booking.to_dict(include_member=True, include_screening=True)), 200

@bookings_bp.route('/by-booking-no/<booking_no>', methods=['GET'])
@jwt_required()
def get_booking_by_no(booking_no):
    booking = Booking.query.filter_by(booking_no=booking_no).first()
    if not booking:
        raise ValidationError('报名记录不存在')
    return jsonify(booking.to_dict(include_member=True, include_screening=True)), 200

@bookings_bp.route('/screening/<int:screening_id>/waitlist', methods=['GET'])
@jwt_required()
def get_waitlist(screening_id):
    screening = Screening.query.get(screening_id)
    if not screening:
        raise ValidationError('场次不存在')
    
    waitlisted = Booking.query.filter_by(
        screening_id=screening_id,
        status='waitlisted'
    ).order_by(Booking.waitlist_position.asc()).all()
    
    return jsonify([b.to_dict(include_member=True) for b in waitlisted]), 200

@bookings_bp.route('/screening/<int:screening_id>/process-waitlist', methods=['POST'])
@jwt_required()
def process_waitlist_route(screening_id):
    from utils.auth import role_required
    role_required('admin', 'curator')()
    
    process_waitlist(screening_id)
    
    screening = Screening.query.get(screening_id)
    return jsonify(screening.to_dict(include_bookings=True, include_film=True)), 200

@bookings_bp.route('/member/<int:member_id>', methods=['GET'])
@jwt_required()
def get_member_bookings(member_id):
    status = request.args.get('status')
    
    query = Booking.query.filter_by(member_id=member_id)
    if status:
        query = query.filter_by(status=status)
    
    bookings = query.order_by(Booking.registered_at.desc()).all()
    return jsonify([b.to_dict(include_screening=True) for b in bookings]), 200
