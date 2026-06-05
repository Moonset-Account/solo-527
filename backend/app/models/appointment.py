from datetime import datetime
from app import db

class TimeSlot(db.Model):
    __tablename__ = 'time_slots'
    
    id = db.Column(db.Integer, primary_key=True)
    mentor_id = db.Column(db.Integer, db.ForeignKey('mentors.id'), nullable=False, index=True)
    start_time = db.Column(db.DateTime, nullable=False, index=True)
    end_time = db.Column(db.DateTime, nullable=False)
    is_booked = db.Column(db.Boolean, default=False)
    is_recurring = db.Column(db.Boolean, default=False)
    recurrence_rule = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    mentor = db.relationship('Mentor', back_populates='time_slots')
    appointment = db.relationship('Appointment', back_populates='time_slot', uselist=False)
    
    def to_dict(self, include_mentor=False):
        data = {
            'id': self.id,
            'mentor_id': self.mentor_id,
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat(),
            'is_booked': self.is_booked,
            'is_recurring': self.is_recurring
        }
        if include_mentor and self.mentor:
            data['mentor'] = self.mentor.to_dict()
        return data

class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False, index=True)
    mentor_id = db.Column(db.Integer, db.ForeignKey('mentors.id'), nullable=False, index=True)
    time_slot_id = db.Column(db.Integer, db.ForeignKey('time_slots.id'), nullable=False, unique=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    topics = db.Column(db.JSON, default=list)
    status = db.Column(db.String(20), default='pending', index=True)
    meeting_type = db.Column(db.String(20), default='online')
    meeting_link = db.Column(db.String(500))
    meeting_location = db.Column(db.String(500))
    qr_code = db.Column(db.String(500))
    student_joined_at = db.Column(db.DateTime)
    mentor_joined_at = db.Column(db.DateTime)
    started_at = db.Column(db.DateTime)
    ended_at = db.Column(db.DateTime)
    cancellation_reason = db.Column(db.Text)
    cancelled_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    cancelled_at = db.Column(db.DateTime)
    contact_unlocked = db.Column(db.Boolean, default=False)
    contact_unlocked_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    student = db.relationship('Student', back_populates='appointments', foreign_keys=[student_id])
    mentor = db.relationship('Mentor', back_populates='appointments', foreign_keys=[mentor_id])
    time_slot = db.relationship('TimeSlot', back_populates='appointment')
    feedback = db.relationship('Feedback', back_populates='appointment', uselist=False, cascade='all, delete-orphan')
    attachments = db.relationship('Attachment', back_populates='appointment', cascade='all, delete-orphan')
    audit_logs = db.relationship('AuditLog', back_populates='appointment')
    
    def to_dict(self, include_details=False, include_contact=False):
        data = {
            'id': self.id,
            'student_id': self.student_id,
            'mentor_id': self.mentor_id,
            'time_slot_id': self.time_slot_id,
            'title': self.title,
            'description': self.description,
            'topics': self.topics or [],
            'status': self.status,
            'meeting_type': self.meeting_type,
            'meeting_link': self.meeting_link if include_details else None,
            'meeting_location': self.meeting_location if include_details else None,
            'qr_code': self.qr_code if include_details else None,
            'contact_unlocked': self.contact_unlocked,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'ended_at': self.ended_at.isoformat() if self.ended_at else None
        }
        if include_details:
            if self.student:
                data['student'] = self.student.to_dict(include_private=include_contact)
            if self.mentor:
                data['mentor'] = self.mentor.to_dict(include_contact=include_contact)
            if self.time_slot:
                data['time_slot'] = self.time_slot.to_dict()
            if self.feedback:
                data['feedback'] = self.feedback.to_dict()
        return data
