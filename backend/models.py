from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app import db


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='curator')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    ROLES = ['admin', 'curator', 'frontdesk', 'finance']
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }


class Film(db.Model):
    __tablename__ = 'films'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    original_title = db.Column(db.String(200))
    director = db.Column(db.String(100))
    year = db.Column(db.Integer)
    duration = db.Column(db.Integer, nullable=False)
    country = db.Column(db.String(100))
    language = db.Column(db.String(50))
    synopsis = db.Column(db.Text)
    poster_url = db.Column(db.String(500))
    license_start_date = db.Column(db.Date, nullable=False)
    license_end_date = db.Column(db.Date, nullable=False)
    distributor = db.Column(db.String(200))
    license_number = db.Column(db.String(100))
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    screenings = db.relationship('Screening', backref='film', lazy=True)
    
    STATUS = ['active', 'inactive', 'expired']
    
    def is_license_valid(self, date=None):
        if date is None:
            date = datetime.utcnow().date()
        return self.license_start_date <= date <= self.license_end_date
    
    def to_dict(self, include_screenings=False):
        data = {
            'id': self.id,
            'title': self.title,
            'original_title': self.original_title,
            'director': self.director,
            'year': self.year,
            'duration': self.duration,
            'country': self.country,
            'language': self.language,
            'synopsis': self.synopsis,
            'poster_url': self.poster_url,
            'license_start_date': self.license_start_date.isoformat() if self.license_start_date else None,
            'license_end_date': self.license_end_date.isoformat() if self.license_end_date else None,
            'distributor': self.distributor,
            'license_number': self.license_number,
            'status': self.status,
            'is_license_valid': self.is_license_valid(),
            'created_at': self.created_at.isoformat()
        }
        if include_screenings:
            data['screenings'] = [s.to_dict() for s in self.screenings]
        return data


class Hall(db.Model):
    __tablename__ = 'halls'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    seat_map = db.Column(db.JSON)
    facilities = db.Column(db.JSON)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    screenings = db.relationship('Screening', backref='hall', lazy=True)
    
    def to_dict(self, include_screenings=False):
        data = {
            'id': self.id,
            'name': self.name,
            'capacity': self.capacity,
            'seat_map': self.seat_map,
            'facilities': self.facilities,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }
        if include_screenings:
            data['screenings'] = [s.to_dict() for s in self.screenings]
        return data


class MemberLevel(db.Model):
    __tablename__ = 'member_levels'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, default=0.0)
    max_bookings_per_screening = db.Column(db.Integer, default=1)
    priority = db.Column(db.Integer, default=0)
    booking_window_days = db.Column(db.Integer, default=7)
    benefits = db.Column(db.JSON)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    members = db.relationship('Member', backref='level', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'max_bookings_per_screening': self.max_bookings_per_screening,
            'priority': self.priority,
            'booking_window_days': self.booking_window_days,
            'benefits': self.benefits,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }


class Member(db.Model):
    __tablename__ = 'members'
    
    id = db.Column(db.Integer, primary_key=True)
    member_no = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    level_id = db.Column(db.Integer, db.ForeignKey('member_levels.id'), nullable=False)
    join_date = db.Column(db.Date, default=datetime.utcnow().date)
    expiry_date = db.Column(db.Date)
    status = db.Column(db.String(20), default='active')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    bookings = db.relationship('Booking', backref='member', lazy=True)
    
    STATUS = ['active', 'inactive', 'expired', 'suspended']
    
    def is_active_member(self):
        if self.status != 'active':
            return False
        if self.expiry_date and self.expiry_date < datetime.utcnow().date():
            return False
        return True
    
    def to_dict(self, include_bookings=False):
        data = {
            'id': self.id,
            'member_no': self.member_no,
            'name': self.name,
            'phone': self.phone,
            'email': self.email,
            'level_id': self.level_id,
            'level_name': self.level.name if self.level else None,
            'join_date': self.join_date.isoformat() if self.join_date else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'status': self.status,
            'notes': self.notes,
            'is_active_member': self.is_active_member(),
            'created_at': self.created_at.isoformat()
        }
        if include_bookings:
            data['bookings'] = [b.to_dict() for b in self.bookings]
        return data


class Screening(db.Model):
    __tablename__ = 'screenings'
    
    id = db.Column(db.Integer, primary_key=True)
    film_id = db.Column(db.Integer, db.ForeignKey('films.id'), nullable=False)
    hall_id = db.Column(db.Integer, db.ForeignKey('halls.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    reserved_seats = db.Column(db.JSON)
    status = db.Column(db.String(20), default='draft')
    is_member_only = db.Column(db.Boolean, default=True)
    allow_waitlist = db.Column(db.Boolean, default=True)
    curator_notes = db.Column(db.Text)
    guest_info = db.Column(db.JSON)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    bookings = db.relationship('Booking', backref='screening', lazy=True)
    guests = db.relationship('Guest', backref='screening', lazy=True)
    
    STATUS = ['draft', 'confirmed', 'cancelled', 'completed']
    
    def get_confirmed_bookings_count(self):
        return len([b for b in self.bookings if b.status == 'confirmed'])
    
    def get_available_seats(self):
        confirmed = self.get_confirmed_bookings_count()
        return max(0, self.capacity - confirmed)
    
    def get_waitlist_count(self):
        return len([b for b in self.bookings if b.status == 'waitlisted'])
    
    def is_full(self):
        return self.get_available_seats() <= 0
    
    def to_dict(self, include_bookings=False, include_film=False, include_hall=False):
        data = {
            'id': self.id,
            'film_id': self.film_id,
            'hall_id': self.hall_id,
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat(),
            'capacity': self.capacity,
            'status': self.status,
            'is_member_only': self.is_member_only,
            'allow_waitlist': self.allow_waitlist,
            'curator_notes': self.curator_notes,
            'guest_info': self.guest_info,
            'confirmed_count': self.get_confirmed_bookings_count(),
            'waitlist_count': self.get_waitlist_count(),
            'available_seats': self.get_available_seats(),
            'is_full': self.is_full(),
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat()
        }
        if include_film and self.film:
            data['film'] = self.film.to_dict()
        if include_hall and self.hall:
            data['hall'] = self.hall.to_dict()
        if include_bookings:
            data['bookings'] = [b.to_dict() for b in self.bookings]
        return data


class Booking(db.Model):
    __tablename__ = 'bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    screening_id = db.Column(db.Integer, db.ForeignKey('screenings.id'), nullable=False)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id'), nullable=False)
    booking_no = db.Column(db.String(50), unique=True, nullable=False)
    status = db.Column(db.String(20), default='pending')
    seats = db.Column(db.JSON)
    guest_count = db.Column(db.Integer, default=0)
    waitlist_position = db.Column(db.Integer)
    registered_at = db.Column(db.DateTime, default=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime)
    cancelled_at = db.Column(db.DateTime)
    checked_in_at = db.Column(db.DateTime)
    checked_in_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    STATUS = ['pending', 'confirmed', 'waitlisted', 'cancelled', 'checked_in', 'no_show']
    
    def to_dict(self, include_member=False, include_screening=False):
        data = {
            'id': self.id,
            'screening_id': self.screening_id,
            'member_id': self.member_id,
            'booking_no': self.booking_no,
            'status': self.status,
            'seats': self.seats,
            'guest_count': self.guest_count,
            'waitlist_position': self.waitlist_position,
            'registered_at': self.registered_at.isoformat() if self.registered_at else None,
            'confirmed_at': self.confirmed_at.isoformat() if self.confirmed_at else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'checked_in_at': self.checked_in_at.isoformat() if self.checked_in_at else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }
        if include_member and self.member:
            data['member'] = self.member.to_dict()
        if include_screening and self.screening:
            data['screening'] = self.screening.to_dict(include_film=True, include_hall=True)
        return data


class Guest(db.Model):
    __tablename__ = 'guests'
    
    id = db.Column(db.Integer, primary_key=True)
    screening_id = db.Column(db.Integer, db.ForeignKey('screenings.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    title = db.Column(db.String(100))
    organization = db.Column(db.String(200))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    status = db.Column(db.String(20), default='invited')
    seats = db.Column(db.JSON)
    confirmed_at = db.Column(db.DateTime)
    declined_at = db.Column(db.DateTime)
    checked_in_at = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    STATUS = ['invited', 'confirmed', 'declined', 'checked_in', 'no_show']
    
    def to_dict(self, include_screening=False):
        data = {
            'id': self.id,
            'screening_id': self.screening_id,
            'name': self.name,
            'title': self.title,
            'organization': self.organization,
            'phone': self.phone,
            'email': self.email,
            'status': self.status,
            'seats': self.seats,
            'confirmed_at': self.confirmed_at.isoformat() if self.confirmed_at else None,
            'declined_at': self.declined_at.isoformat() if self.declined_at else None,
            'checked_in_at': self.checked_in_at.isoformat() if self.checked_in_at else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }
        if include_screening and self.screening:
            data['screening'] = self.screening.to_dict(include_film=True)
        return data


class WaitlistEntry(db.Model):
    __tablename__ = 'waitlist_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    screening_id = db.Column(db.Integer, db.ForeignKey('screenings.id'), nullable=False)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id'), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'))
    position = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='waiting')
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    promoted_at = db.Column(db.DateTime)
    expired_at = db.Column(db.DateTime)
    notification_sent = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    STATUS = ['waiting', 'promoted', 'expired', 'cancelled']


class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)
    recipient_type = db.Column(db.String(20), default='member')
    recipient_id = db.Column(db.Integer)
    recipient_email = db.Column(db.String(120))
    recipient_phone = db.Column(db.String(20))
    subject = db.Column(db.String(200))
    content = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')
    sent_at = db.Column(db.DateTime)
    error_message = db.Column(db.Text)
    related_type = db.Column(db.String(50))
    related_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    TYPE = ['booking_confirmed', 'booking_cancelled', 'waitlist_promoted', 
            'screening_reminder', 'guest_invitation', 'system_alert']
    STATUS = ['pending', 'sent', 'failed', 'cancelled']


class ImportExportTask(db.Model):
    __tablename__ = 'import_export_tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='pending')
    file_name = db.Column(db.String(500))
    file_path = db.Column(db.String(500))
    total_records = db.Column(db.Integer, default=0)
    processed_records = db.Column(db.Integer, default=0)
    failed_records = db.Column(db.Integer, default=0)
    error_log = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    TYPE = ['import', 'export']
    STATUS = ['pending', 'processing', 'completed', 'failed']
    ENTITY_TYPES = ['members', 'films', 'screenings', 'bookings', 'guests']


class ErrorLog(db.Model):
    __tablename__ = 'error_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    level = db.Column(db.String(20), default='error')
    message = db.Column(db.Text, nullable=False)
    traceback = db.Column(db.Text)
    path = db.Column(db.String(500))
    method = db.Column(db.String(10))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    LEVEL = ['debug', 'info', 'warning', 'error', 'critical']


class CheckInRecord(db.Model):
    __tablename__ = 'check_in_records'
    
    id = db.Column(db.Integer, primary_key=True)
    screening_id = db.Column(db.Integer, db.ForeignKey('screenings.id'), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'))
    guest_id = db.Column(db.Integer, db.ForeignKey('guests.id'))
    check_in_type = db.Column(db.String(20), nullable=False)
    checked_in_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    checked_in_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    CHECK_IN_TYPES = ['member', 'guest', 'walk_in']


class MonthlyReconciliation(db.Model):
    __tablename__ = 'monthly_reconciliations'
    
    id = db.Column(db.Integer, primary_key=True)
    month = db.Column(db.String(7), nullable=False)
    status = db.Column(db.String(20), default='draft')
    total_screenings = db.Column(db.Integer, default=0)
    total_bookings = db.Column(db.Integer, default=0)
    total_attendance = db.Column(db.Integer, default=0)
    total_cancellations = db.Column(db.Integer, default=0)
    total_no_shows = db.Column(db.Integer, default=0)
    total_guests = db.Column(db.Integer, default=0)
    notes = db.Column(db.Text)
    generated_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    generated_at = db.Column(db.DateTime)
    confirmed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    confirmed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    STATUS = ['draft', 'reviewed', 'confirmed', 'archived']
