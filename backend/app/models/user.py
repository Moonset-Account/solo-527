from datetime import datetime
from app import db
import bcrypt

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    avatar_url = db.Column(db.String(500))
    role = db.Column(db.String(20), nullable=False, default='student')
    status = db.Column(db.String(20), nullable=False, default='pending')
    is_active = db.Column(db.Boolean, default=True)
    last_login_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    student_profile = db.relationship('Student', back_populates='user', uselist=False, cascade='all, delete-orphan', foreign_keys='Student.user_id')
    mentor_profile = db.relationship('Mentor', back_populates='user', uselist=False, cascade='all, delete-orphan', foreign_keys='Mentor.user_id')
    notifications = db.relationship('Notification', back_populates='user', cascade='all, delete-orphan', foreign_keys='Notification.user_id')
    audit_logs = db.relationship('AuditLog', back_populates='user', foreign_keys='AuditLog.user_id')
    
    __mapper_args__ = {
        'polymorphic_identity': 'user',
        'polymorphic_on': role
    }
    
    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def to_dict(self, include_contact=False):
        data = {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'avatar_url': self.avatar_url,
            'role': self.role,
            'status': self.status,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_contact:
            data['phone'] = self.phone
        return data

class Student(db.Model):
    __tablename__ = 'students'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    student_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    school = db.Column(db.String(200), nullable=False)
    department = db.Column(db.String(200), nullable=False)
    major = db.Column(db.String(200), nullable=False)
    grade = db.Column(db.String(50), nullable=False)
    expected_graduation = db.Column(db.Date, nullable=False)
    target_industries = db.Column(db.JSON, default=list)
    target_positions = db.Column(db.JSON, default=list)
    resume_url = db.Column(db.String(500))
    bio = db.Column(db.Text)
    review_status = db.Column(db.String(20), default='pending')
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    reviewed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship('User', back_populates='student_profile', foreign_keys=[user_id])
    reviewed_by_user = db.relationship('User', foreign_keys=[reviewed_by])
    appointments = db.relationship('Appointment', back_populates='student', foreign_keys='Appointment.student_id')
    feedbacks_given = db.relationship('Feedback', back_populates='student', foreign_keys='Feedback.student_id')
    
    def to_dict(self, include_private=False):
        data = {
            'id': self.id,
            'user': self.user.to_dict() if self.user else None,
            'student_id': self.student_id,
            'school': self.school,
            'department': self.department,
            'major': self.major,
            'grade': self.grade,
            'target_industries': self.target_industries or [],
            'target_positions': self.target_positions or [],
            'bio': self.bio,
            'review_status': self.review_status
        }
        if include_private:
            data['expected_graduation'] = self.expected_graduation.isoformat() if self.expected_graduation else None
            data['resume_url'] = self.resume_url
        return data

class Mentor(db.Model):
    __tablename__ = 'mentors'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    alumni_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    graduation_year = db.Column(db.Integer, nullable=False)
    school = db.Column(db.String(200), nullable=False)
    department = db.Column(db.String(200), nullable=False)
    major = db.Column(db.String(200), nullable=False)
    current_company = db.Column(db.String(200), nullable=False)
    current_position = db.Column(db.String(200), nullable=False)
    years_of_experience = db.Column(db.Integer, default=0)
    industry_tags = db.Column(db.JSON, default=list)
    expertise_areas = db.Column(db.JSON, default=list)
    bio = db.Column(db.Text)
    linkedin_url = db.Column(db.String(500))
    max_appointments_per_week = db.Column(db.Integer, default=5)
    average_rating = db.Column(db.Float, default=0.0)
    total_meetings = db.Column(db.Integer, default=0)
    review_status = db.Column(db.String(20), default='pending')
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    reviewed_at = db.Column(db.DateTime)
    contact_visible = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship('User', back_populates='mentor_profile', foreign_keys=[user_id])
    reviewed_by_user = db.relationship('User', foreign_keys=[reviewed_by])
    time_slots = db.relationship('TimeSlot', back_populates='mentor', cascade='all, delete-orphan')
    appointments = db.relationship('Appointment', back_populates='mentor', foreign_keys='Appointment.mentor_id')
    feedbacks_received = db.relationship('Feedback', back_populates='mentor', foreign_keys='Feedback.mentor_id')
    
    def to_dict(self, include_contact=False, include_private=False):
        data = {
            'id': self.id,
            'user': self.user.to_dict(include_contact=include_contact) if self.user else None,
            'alumni_id': self.alumni_id,
            'graduation_year': self.graduation_year,
            'school': self.school,
            'department': self.department,
            'major': self.major,
            'current_company': self.current_company,
            'current_position': self.current_position,
            'years_of_experience': self.years_of_experience,
            'industry_tags': self.industry_tags or [],
            'expertise_areas': self.expertise_areas or [],
            'bio': self.bio,
            'average_rating': self.average_rating,
            'total_meetings': self.total_meetings,
            'review_status': self.review_status,
            'contact_visible': self.contact_visible
        }
        if include_private:
            data['max_appointments_per_week'] = self.max_appointments_per_week
            data['linkedin_url'] = self.linkedin_url
        return data
