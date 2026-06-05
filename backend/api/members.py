from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import Member, MemberLevel
from app import db
from utils.error_handler import ValidationError
from datetime import datetime
import uuid

members_bp = Blueprint('members', __name__)

@members_bp.route('/levels', methods=['GET'])
@jwt_required()
def list_member_levels():
    levels = MemberLevel.query.filter_by(is_active=True).all()
    return jsonify([l.to_dict() for l in levels]), 200

@members_bp.route('/levels', methods=['POST'])
@jwt_required()
def create_member_level():
    from utils.auth import role_required
    role_required('admin')()
    
    data = request.get_json()
    
    if not data.get('name'):
        raise ValidationError('请提供会员等级名称')
    
    level = MemberLevel(
        name=data['name'],
        description=data.get('description'),
        price=data.get('price', 0),
        max_bookings_per_screening=data.get('max_bookings_per_screening', 1),
        priority=data.get('priority', 0),
        booking_window_days=data.get('booking_window_days', 7),
        benefits=data.get('benefits', [])
    )
    
    db.session.add(level)
    db.session.commit()
    
    return jsonify(level.to_dict()), 201

@members_bp.route('/levels/<int:level_id>', methods=['PUT'])
@jwt_required()
def update_member_level(level_id):
    from utils.auth import role_required
    role_required('admin')()
    
    level = MemberLevel.query.get(level_id)
    if not level:
        raise ValidationError('会员等级不存在')
    
    data = request.get_json()
    
    if data.get('name'):
        level.name = data['name']
    if data.get('description') is not None:
        level.description = data['description']
    if data.get('price') is not None:
        level.price = data['price']
    if data.get('max_bookings_per_screening') is not None:
        level.max_bookings_per_screening = data['max_bookings_per_screening']
    if data.get('priority') is not None:
        level.priority = data['priority']
    if data.get('booking_window_days') is not None:
        level.booking_window_days = data['booking_window_days']
    if data.get('benefits') is not None:
        level.benefits = data['benefits']
    if data.get('is_active') is not None:
        level.is_active = data['is_active']
    
    db.session.commit()
    return jsonify(level.to_dict()), 200

@members_bp.route('', methods=['GET'])
@jwt_required()
def list_members():
    status = request.args.get('status')
    level_id = request.args.get('level_id')
    search = request.args.get('search')
    
    query = Member.query
    
    if status:
        query = query.filter_by(status=status)
    if level_id:
        query = query.filter_by(level_id=level_id)
    if search:
        search_pattern = f'%{search}%'
        query = query.filter(
            db.or_(
                Member.name.like(search_pattern),
                Member.member_no.like(search_pattern),
                Member.phone.like(search_pattern),
                Member.email.like(search_pattern)
            )
        )
    
    members = query.order_by(Member.created_at.desc()).all()
    return jsonify([m.to_dict() for m in members]), 200

@members_bp.route('/<int:member_id>', methods=['GET'])
@jwt_required()
def get_member(member_id):
    member = Member.query.get(member_id)
    if not member:
        raise ValidationError('会员不存在')
    return jsonify(member.to_dict(include_bookings=True)), 200

def generate_member_no():
    return f'M{datetime.now().strftime("%Y%m%d")[2:]}{uuid.uuid4().hex[:4].upper()}'

@members_bp.route('', methods=['POST'])
@jwt_required()
def create_member():
    from utils.auth import role_required
    role_required('admin', 'curator', 'frontdesk')()
    
    data = request.get_json()
    
    if not data.get('name') or not data.get('level_id'):
        raise ValidationError('请提供会员姓名和会员等级')
    
    level = MemberLevel.query.get(data['level_id'])
    if not level:
        raise ValidationError('会员等级不存在')
    
    member_no = data.get('member_no') or generate_member_no()
    
    while Member.query.filter_by(member_no=member_no).first():
        member_no = generate_member_no()
    
    expiry_date = None
    if data.get('expiry_date'):
        try:
            expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
        except ValueError:
            raise ValidationError('到期日期格式不正确')
    
    join_date = None
    if data.get('join_date'):
        try:
            join_date = datetime.strptime(data['join_date'], '%Y-%m-%d').date()
        except ValueError:
            raise ValidationError('入会日期格式不正确')
    
    member = Member(
        member_no=member_no,
        name=data['name'],
        phone=data.get('phone'),
        email=data.get('email'),
        level_id=data['level_id'],
        join_date=join_date or datetime.now().date(),
        expiry_date=expiry_date,
        status=data.get('status', 'active'),
        notes=data.get('notes')
    )
    
    db.session.add(member)
    db.session.commit()
    
    return jsonify(member.to_dict()), 201

@members_bp.route('/<int:member_id>', methods=['PUT'])
@jwt_required()
def update_member(member_id):
    from utils.auth import role_required
    role_required('admin', 'curator', 'frontdesk')()
    
    member = Member.query.get(member_id)
    if not member:
        raise ValidationError('会员不存在')
    
    data = request.get_json()
    
    if data.get('name'):
        member.name = data['name']
    if data.get('phone') is not None:
        member.phone = data['phone']
    if data.get('email') is not None:
        member.email = data['email']
    if data.get('level_id'):
        level = MemberLevel.query.get(data['level_id'])
        if not level:
            raise ValidationError('会员等级不存在')
        member.level_id = data['level_id']
    if data.get('expiry_date') is not None:
        if data['expiry_date']:
            try:
                member.expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
            except ValueError:
                raise ValidationError('到期日期格式不正确')
        else:
            member.expiry_date = None
    if data.get('status'):
        member.status = data['status']
    if data.get('notes') is not None:
        member.notes = data['notes']
    
    db.session.commit()
    return jsonify(member.to_dict()), 200

@members_bp.route('/<int:member_id>', methods=['DELETE'])
@jwt_required()
def delete_member(member_id):
    from utils.auth import role_required
    role_required('admin')()
    
    member = Member.query.get(member_id)
    if not member:
        raise ValidationError('会员不存在')
    
    if member.bookings:
        raise ValidationError('该会员有关联的报名记录，无法删除')
    
    db.session.delete(member)
    db.session.commit()
    
    return jsonify({'message': '会员已删除'}), 200

@members_bp.route('/search', methods=['GET'])
@jwt_required()
def search_member():
    query = request.args.get('q', '')
    if not query:
        return jsonify([]), 200
    
    search_pattern = f'%{query}%'
    members = Member.query.filter(
        db.or_(
            Member.name.like(search_pattern),
            Member.member_no.like(search_pattern),
            Member.phone.like(search_pattern)
        )
    ).limit(10).all()
    
    return jsonify([{
        'id': m.id,
        'member_no': m.member_no,
        'name': m.name,
        'level_name': m.level.name if m.level else None,
        'status': m.status,
        'is_active': m.is_active_member()
    } for m in members]), 200
