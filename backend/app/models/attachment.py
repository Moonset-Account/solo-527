from datetime import datetime
from app import db

class Attachment(db.Model):
    __tablename__ = 'attachments'
    
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), index=True)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)
    file_type = db.Column(db.String(100))
    description = db.Column(db.String(500))
    is_offline_upload = db.Column(db.Boolean, default=False)
    offline_sync_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    appointment = db.relationship('Appointment', back_populates='attachments')
    
    def to_dict(self):
        return {
            'id': self.id,
            'appointment_id': self.appointment_id,
            'uploaded_by': self.uploaded_by,
            'file_name': self.file_name,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'description': self.description,
            'is_offline_upload': self.is_offline_upload,
            'offline_sync_at': self.offline_sync_at.isoformat() if self.offline_sync_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
