from datetime import datetime
from extensions import db
from models import Booking, Screening, Member, WaitlistEntry, CheckInRecord
from utils.error_handler import ValidationError, ConflictError
from utils.notifications import send_booking_confirmation, send_waitlist_promoted, send_booking_cancellation
import uuid

def generate_booking_no():
    return f'BK{datetime.now().strftime("%Y%m%d%H%M%S")}{uuid.uuid4().hex[:6].upper()}'

def validate_booking(screening_id, member_id, guest_count=0):
    screening = Screening.query.get(screening_id)
    if not screening:
        raise ValidationError('场次不存在')
    
    if screening.status not in ['confirmed']:
        raise ValidationError('该场次不可报名')
    
    member = Member.query.get(member_id)
    if not member:
        raise ValidationError('会员不存在')
    
    if not member.is_active_member():
        raise ValidationError('会员状态无效或已过期')
    
    if screening.is_member_only and not member.is_active_member():
        raise ValidationError('该场次仅对有效会员开放')
    
    member_level = member.level
    booking_window_start = screening.start_time.date() - __import__('datetime').timedelta(days=member_level.booking_window_days)
    today = datetime.now().date()
    if today < booking_window_start:
        raise ValidationError(f'您的会员等级可提前{member_level.booking_window_days}天报名，请于{booking_window_start.strftime("%Y-%m-%d")}后再试')
    
    existing_bookings = Booking.query.filter_by(
        screening_id=screening_id,
        member_id=member_id
    ).filter(Booking.status.in_(['confirmed', 'waitlisted', 'pending'])).all()
    
    if len(existing_bookings) >= member_level.max_bookings_per_screening:
        raise ValidationError(f'您的会员等级每场最多可报名{member_level.max_bookings_per_screening}次')
    
    if guest_count > 3:
        raise ValidationError('最多可携带3位嘉宾')
    
    return screening, member, member_level

def create_booking(screening_id, member_id, guest_count=0, seats=None, notes=None):
    screening, member, member_level = validate_booking(screening_id, member_id, guest_count)
    
    existing_booking = Booking.query.filter_by(
        screening_id=screening_id,
        member_id=member_id
    ).filter(Booking.status.in_(['confirmed', 'waitlisted', 'pending'])).first()
    
    if existing_booking:
        raise ConflictError('您已报名该场次')
    
    booking_no = generate_booking_no()
    is_full = screening.is_full()
    
    if is_full and not screening.allow_waitlist:
        raise ValidationError('该场次已满，且不接受候补')
    
    if is_full:
        waitlist_count = len([b for b in screening.bookings if b.status == 'waitlisted'])
        waitlist_position = waitlist_count + 1
        
        booking = Booking(
            screening_id=screening_id,
            member_id=member_id,
            booking_no=booking_no,
            status='waitlisted',
            guest_count=guest_count,
            seats=seats,
            waitlist_position=waitlist_position,
            notes=notes
        )
        db.session.add(booking)
        
        waitlist_entry = WaitlistEntry(
            screening_id=screening_id,
            member_id=member_id,
            position=waitlist_position,
            status='waiting'
        )
        db.session.add(waitlist_entry)
        
    else:
        booking = Booking(
            screening_id=screening_id,
            member_id=member_id,
            booking_no=booking_no,
            status='confirmed',
            guest_count=guest_count,
            seats=seats,
            confirmed_at=datetime.utcnow(),
            notes=notes
        )
        db.session.add(booking)
    
    db.session.commit()
    
    if booking.status == 'confirmed':
        send_booking_confirmation(booking)
    
    return booking

def cancel_booking(booking_id, reason=None):
    booking = Booking.query.get(booking_id)
    if not booking:
        raise ValidationError('报名记录不存在')
    
    if booking.status in ['cancelled', 'checked_in']:
        raise ValidationError('该报名无法取消')
    
    was_confirmed = booking.status == 'confirmed'
    
    booking.status = 'cancelled'
    booking.cancelled_at = datetime.utcnow()
    
    if booking.waitlist_position:
        waitlist_entry = WaitlistEntry.query.filter_by(
            screening_id=booking.screening_id,
            member_id=booking.member_id,
            status='waiting'
        ).first()
        if waitlist_entry:
            waitlist_entry.status = 'cancelled'
            waitlist_entry.expired_at = datetime.utcnow()
    
    db.session.commit()
    
    send_booking_cancellation(booking, reason)
    
    if was_confirmed:
        process_waitlist(booking.screening_id)
    
    return booking

def process_waitlist(screening_id):
    screening = Screening.query.get(screening_id)
    if not screening:
        return
    
    waitlisted_bookings = Booking.query.filter_by(
        screening_id=screening_id,
        status='waitlisted'
    ).order_by(Booking.waitlist_position.asc()).all()
    
    for booking in waitlisted_bookings:
        if screening.get_available_seats() <= 0:
            break
        
        member_level = booking.member.level
        
        member_confirmed = len([b for b in screening.bookings if b.member_id == booking.member_id and b.status == 'confirmed'])
        if member_confirmed >= member_level.max_bookings_per_screening:
            booking.status = 'cancelled'
            booking.cancelled_at = datetime.utcnow()
            continue
        
        booking.status = 'confirmed'
        booking.confirmed_at = datetime.utcnow()
        booking.waitlist_position = None
        
        waitlist_entry = WaitlistEntry.query.filter_by(
            screening_id=screening_id,
            member_id=booking.member_id,
            status='waiting'
        ).first()
        if waitlist_entry:
            waitlist_entry.status = 'promoted'
            waitlist_entry.promoted_at = datetime.utcnow()
            waitlist_entry.booking_id = booking.id
        
        send_waitlist_promoted(booking)
    
    remaining_waitlisted = Booking.query.filter_by(
        screening_id=screening_id,
        status='waitlisted'
    ).order_by(Booking.registered_at.asc()).all()
    
    for idx, booking in enumerate(remaining_waitlisted, 1):
        booking.waitlist_position = idx
    
    db.session.commit()

def check_in_booking(booking_id, user_id, notes=None):
    booking = Booking.query.get(booking_id)
    if not booking:
        raise ValidationError('报名记录不存在')
    
    if booking.status not in ['confirmed']:
        raise ValidationError(f'该报名状态为{booking.status}，无法签到')
    
    booking.status = 'checked_in'
    booking.checked_in_at = datetime.utcnow()
    booking.checked_in_by = user_id
    
    check_in_record = CheckInRecord(
        screening_id=booking.screening_id,
        booking_id=booking.id,
        check_in_type='member',
        checked_in_by=user_id,
        notes=notes
    )
    db.session.add(check_in_record)
    db.session.commit()
    
    return booking

def check_in_guest(guest_id, user_id, notes=None):
    from models import Guest
    guest = Guest.query.get(guest_id)
    if not guest:
        raise ValidationError('嘉宾记录不存在')
    
    if guest.status not in ['confirmed', 'invited']:
        raise ValidationError(f'该嘉宾状态为{guest.status}，无法签到')
    
    guest.status = 'checked_in'
    guest.checked_in_at = datetime.utcnow()
    
    check_in_record = CheckInRecord(
        screening_id=guest.screening_id,
        guest_id=guest.id,
        check_in_type='guest',
        checked_in_by=user_id,
        notes=notes
    )
    db.session.add(check_in_record)
    db.session.commit()
    
    return guest
