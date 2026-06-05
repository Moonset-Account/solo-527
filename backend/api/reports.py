from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import Screening, Booking, Guest, Member, MonthlyReconciliation, CheckInRecord
from extensions import db
from utils.error_handler import ValidationError
from datetime import datetime, timedelta
from sqlalchemy import func, and_

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    today = datetime.now().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    
    today_screenings = Screening.query.filter(
        Screening.start_time >= today_start,
        Screening.start_time <= today_end,
        Screening.status.in_(['confirmed', 'completed'])
    ).count()
    
    today_bookings = Booking.query.filter(
        Booking.registered_at >= today_start,
        Booking.registered_at <= today_end
    ).count()
    
    today_checkins = CheckInRecord.query.filter(
        CheckInRecord.checked_in_at >= today_start,
        CheckInRecord.checked_in_at <= today_end
    ).count()
    
    total_members = Member.query.filter_by(status='active').count()
    
    upcoming_screenings = Screening.query.filter(
        Screening.start_time >= datetime.now(),
        Screening.status == 'confirmed'
    ).order_by(Screening.start_time.asc()).limit(5).all()
    
    return jsonify({
        'today_screenings': today_screenings,
        'today_bookings': today_bookings,
        'today_checkins': today_checkins,
        'total_active_members': total_members,
        'upcoming_screenings': [s.to_dict(include_film=True, include_hall=True) for s in upcoming_screenings]
    }), 200

@reports_bp.route('/screenings/stats', methods=['GET'])
def get_screenings_stats():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Screening.query
    
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
    
    screenings = query.all()
    
    total_screenings = len(screenings)
    total_capacity = sum(s.capacity for s in screenings)
    confirmed_screenings = len([s for s in screenings if s.status == 'confirmed'])
    cancelled_screenings = len([s for s in screenings if s.status == 'cancelled'])
    completed_screenings = len([s for s in screenings if s.status == 'completed'])
    
    total_bookings = 0
    total_attendance = 0
    total_cancellations = 0
    total_no_shows = 0
    
    for s in screenings:
        bookings = s.bookings
        total_bookings += len([b for b in bookings if b.status != 'cancelled'])
        total_attendance += len([b for b in bookings if b.status == 'checked_in'])
        total_cancellations += len([b for b in bookings if b.status == 'cancelled'])
        total_no_shows += len([b for b in bookings if b.status == 'no_show'])
    
    return jsonify({
        'period': {
            'start_date': start_date,
            'end_date': end_date
        },
        'total_screenings': total_screenings,
        'confirmed_screenings': confirmed_screenings,
        'cancelled_screenings': cancelled_screenings,
        'completed_screenings': completed_screenings,
        'total_capacity': total_capacity,
        'total_bookings': total_bookings,
        'total_attendance': total_attendance,
        'total_cancellations': total_cancellations,
        'total_no_shows': total_no_shows,
        'attendance_rate': round(total_attendance / total_bookings * 100, 2) if total_bookings > 0 else 0
    }), 200

@reports_bp.route('/members/stats', methods=['GET'])
@jwt_required()
def get_members_stats():
    from models import MemberLevel
    
    levels = MemberLevel.query.all()
    level_stats = []
    
    for level in levels:
        active_count = Member.query.filter_by(level_id=level.id, status='active').count()
        level_stats.append({
            'level_id': level.id,
            'level_name': level.name,
            'active_count': active_count
        })
    
    total_members = Member.query.count()
    active_members = Member.query.filter_by(status='active').count()
    expired_members = Member.query.filter_by(status='expired').count()
    
    new_this_month = Member.query.filter(
        Member.join_date >= datetime.now().replace(day=1).date()
    ).count()
    
    return jsonify({
        'total_members': total_members,
        'active_members': active_members,
        'expired_members': expired_members,
        'new_this_month': new_this_month,
        'level_distribution': level_stats
    }), 200

@reports_bp.route('/reconciliation', methods=['GET'])
@jwt_required()
def list_reconciliations():
    from utils.auth import role_required
    role_required('admin', 'finance', 'curator').check()
    
    reconciliations = MonthlyReconciliation.query.order_by(MonthlyReconciliation.month.desc()).all()
    return jsonify([{
        'id': r.id,
        'month': r.month,
        'status': r.status,
        'total_screenings': r.total_screenings,
        'total_bookings': r.total_bookings,
        'total_attendance': r.total_attendance,
        'total_cancellations': r.total_cancellations,
        'total_no_shows': r.total_no_shows,
        'total_guests': r.total_guests,
        'generated_at': r.generated_at.isoformat() if r.generated_at else None,
        'confirmed_at': r.confirmed_at.isoformat() if r.confirmed_at else None
    } for r in reconciliations]), 200

@reports_bp.route('/reconciliation/generate', methods=['POST'])
@jwt_required()
def generate_reconciliation():
    from utils.auth import role_required
    from flask_jwt_extended import get_jwt_identity
    role_required('admin', 'finance').check()
    
    data = request.get_json()
    month = data.get('month')
    
    if not month:
        raise ValidationError('请提供月份 (YYYY-MM 格式)')
    
    try:
        year, month_num = map(int, month.split('-'))
        if month_num < 1 or month_num > 12:
            raise ValueError()
    except:
        raise ValidationError('月份格式不正确，请使用 YYYY-MM 格式')
    
    from calendar import monthrange
    _, last_day = monthrange(year, month_num)
    
    month_start = datetime(year, month_num, 1)
    month_end = datetime(year, month_num, last_day, 23, 59, 59)
    
    existing = MonthlyReconciliation.query.filter_by(month=month).first()
    if existing:
        db.session.delete(existing)
    
    screenings = Screening.query.filter(
        Screening.start_time >= month_start,
        Screening.start_time <= month_end
    ).all()
    
    total_screenings = len(screenings)
    total_bookings = 0
    total_attendance = 0
    total_cancellations = 0
    total_no_shows = 0
    total_guests = 0
    
    for s in screenings:
        bookings = s.bookings
        total_bookings += len([b for b in bookings if b.status not in ['cancelled']])
        total_attendance += len([b for b in bookings if b.status == 'checked_in'])
        total_cancellations += len([b for b in bookings if b.status == 'cancelled'])
        total_no_shows += len([b for b in bookings if b.status == 'no_show'])
        total_guests += len([g for g in s.guests if g.status == 'checked_in'])
    
    user_id = get_jwt_identity()
    
    reconciliation = MonthlyReconciliation(
        month=month,
        status='draft',
        total_screenings=total_screenings,
        total_bookings=total_bookings,
        total_attendance=total_attendance,
        total_cancellations=total_cancellations,
        total_no_shows=total_no_shows,
        total_guests=total_guests,
        generated_by=user_id,
        generated_at=datetime.utcnow()
    )
    
    db.session.add(reconciliation)
    db.session.commit()
    
    return jsonify({
        'id': reconciliation.id,
        'month': reconciliation.month,
        'total_screenings': reconciliation.total_screenings,
        'total_bookings': reconciliation.total_bookings,
        'total_attendance': reconciliation.total_attendance,
        'total_cancellations': reconciliation.total_cancellations,
        'total_no_shows': reconciliation.total_no_shows,
        'total_guests': reconciliation.total_guests,
        'status': reconciliation.status
    }), 201

@reports_bp.route('/reconciliation/<int:recon_id>/confirm', methods=['POST'])
@jwt_required()
def confirm_reconciliation(recon_id):
    from utils.auth import role_required
    from flask_jwt_extended import get_jwt_identity
    role_required('admin', 'finance').check()
    
    recon = MonthlyReconciliation.query.get(recon_id)
    if not recon:
        raise ValidationError('对账记录不存在')
    
    if recon.status == 'confirmed':
        return jsonify({'message': '已确认'}), 200
    
    user_id = get_jwt_identity()
    recon.status = 'confirmed'
    recon.confirmed_by = user_id
    recon.confirmed_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'message': '对账已确认'}), 200
