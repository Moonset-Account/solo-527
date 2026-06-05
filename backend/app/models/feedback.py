from datetime import datetime
from app import db

class FeedbackQuestion(db.Model):
    __tablename__ = 'feedback_questions'
    
    id = db.Column(db.Integer, primary_key=True)
    question_type = db.Column(db.String(20), default='rating')
    question_text = db.Column(db.Text, nullable=False)
    target_role = db.Column(db.String(20), default='student')
    options = db.Column(db.JSON, default=list)
    is_required = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'question_type': self.question_type,
            'question_text': self.question_text,
            'target_role': self.target_role,
            'options': self.options or [],
            'is_required': self.is_required,
            'sort_order': self.sort_order
        }

class Feedback(db.Model):
    __tablename__ = 'feedbacks'
    
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), nullable=False, unique=True, index=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False, index=True)
    mentor_id = db.Column(db.Integer, db.ForeignKey('mentors.id'), nullable=False, index=True)
    
    student_rating = db.Column(db.Integer)
    student_comment = db.Column(db.Text)
    student_answers = db.Column(db.JSON, default=dict)
    student_submitted_at = db.Column(db.DateTime)
    
    mentor_rating = db.Column(db.Integer)
    mentor_comment = db.Column(db.Text)
    mentor_answers = db.Column(db.JSON, default=dict)
    mentor_submitted_at = db.Column(db.DateTime)
    
    is_complete = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    appointment = db.relationship('Appointment', back_populates='feedback')
    student = db.relationship('Student', back_populates='feedbacks_given', foreign_keys=[student_id])
    mentor = db.relationship('Mentor', back_populates='feedbacks_received', foreign_keys=[mentor_id])
    
    def to_dict(self, include_private=False):
        data = {
            'id': self.id,
            'appointment_id': self.appointment_id,
            'student_id': self.student_id,
            'mentor_id': self.mentor_id,
            'is_complete': self.is_complete,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if self.student_submitted_at:
            data['student_rating'] = self.student_rating
            data['student_comment'] = self.student_comment
            data['student_answers'] = self.student_answers
            data['student_submitted_at'] = self.student_submitted_at.isoformat()
        if self.mentor_submitted_at or include_private:
            data['mentor_rating'] = self.mentor_rating
            data['mentor_comment'] = self.mentor_comment
            data['mentor_answers'] = self.mentor_answers
            data['mentor_submitted_at'] = self.mentor_submitted_at.isoformat() if self.mentor_submitted_at else None
        return data
