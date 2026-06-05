from datetime import datetime
from app import db
from app.models import User, Mentor, Student

class UserService:
    @staticmethod
    def get_user(user_id):
        user = db.session.get(User, user_id)
        if not user:
            raise ValueError('User not found')
        return user.to_dict(include_contact=True)
    
    @staticmethod
    def list_users(filters=None, page=1, per_page=20):
        query = User.query
        
        if filters:
            if filters.get('role'):
                query = query.filter(User.role == filters['role'])
            if filters.get('status'):
                query = query.filter(User.status == filters['status'])
            if filters.get('keyword'):
                keyword = f"%{filters['keyword']}%"
                query = query.filter(
                    db.or_(User.name.like(keyword), User.email.like(keyword))
                )
        
        query = query.order_by(User.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return {
            'items': [u.to_dict() for u in pagination.items],
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }
    
    @staticmethod
    def update_user(user_id, data, current_user):
        user = db.session.get(User, user_id)
        if not user:
            raise ValueError('User not found')
        if user_id != current_user.id and current_user.role != 'admin':
            raise ValueError('Permission denied')
        
        if 'name' in data:
            user.name = data['name']
        if 'phone' in data and current_user.role == 'admin':
            user.phone = data['phone']
        if 'avatar_url' in data:
            user.avatar_url = data['avatar_url']
        if 'status' in data and current_user.role == 'admin':
            user.status = data['status']
        if 'is_active' in data and current_user.role == 'admin':
            user.is_active = data['is_active']
        if 'password' in data:
            user.set_password(data['password'])
        
        db.session.commit()
        return user.to_dict(include_contact=True)
    
    @staticmethod
    def deactivate_user(user_id, current_user):
        if current_user.role != 'admin':
            raise ValueError('Permission denied')
        
        user = db.session.get(User, user_id)
        if not user:
            raise ValueError('User not found')
        
        user.is_active = False
        db.session.commit()
        return True
