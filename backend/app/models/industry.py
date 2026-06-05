from datetime import datetime
from app import db

class IndustryTag(db.Model):
    __tablename__ = 'industry_tags'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True, index=True)
    name_en = db.Column(db.String(100))
    category = db.Column(db.String(50))
    description = db.Column(db.Text)
    icon = db.Column(db.String(200))
    sort_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'name_en': self.name_en,
            'category': self.category,
            'description': self.description,
            'icon': self.icon,
            'sort_order': self.sort_order,
            'is_active': self.is_active
        }
