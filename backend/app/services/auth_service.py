from datetime import datetime
from flask_jwt_extended import create_access_token, create_refresh_token
from app import db
from app.models import User, Student, Mentor

class AuthService:
    @staticmethod
    def register(data):
        email = data.get('email').lower().strip()
        if User.query.filter_by(email=email).first():
            raise ValueError('Email already registered')
        
        user = User(
            email=email,
            name=data.get('name'),
            phone=data.get('phone'),
            role=data.get('role', 'student'),
            status='pending'
        )
        user.set_password(data.get('password'))
        db.session.add(user)
        db.session.flush()
        
        if user.role == 'student':
            student = Student(
                user_id=user.id,
                student_id=data.get('student_id'),
                school=data.get('school'),
                department=data.get('department'),
                major=data.get('major'),
                grade=data.get('grade'),
                expected_graduation=data.get('expected_graduation'),
                target_industries=data.get('target_industries', []),
                target_positions=data.get('target_positions', []),
                bio=data.get('bio')
            )
            db.session.add(student)
        elif user.role == 'mentor':
            mentor = Mentor(
                user_id=user.id,
                alumni_id=data.get('alumni_id'),
                graduation_year=data.get('graduation_year'),
                school=data.get('school'),
                department=data.get('department'),
                major=data.get('major'),
                current_company=data.get('current_company'),
                current_position=data.get('current_position'),
                years_of_experience=data.get('years_of_experience', 0),
                industry_tags=data.get('industry_tags', []),
                expertise_areas=data.get('expertise_areas', []),
                bio=data.get('bio')
            )
            db.session.add(mentor)
        
        db.session.commit()
        return user
    
    @staticmethod
    def login(email, password):
        user = User.query.filter_by(email=email.lower().strip()).first()
        if not user or not user.check_password(password):
            raise ValueError('Invalid email or password')
        if not user.is_active:
            raise ValueError('Account is disabled')
        
        user.last_login_at = datetime.utcnow()
        db.session.commit()
        
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict(include_contact=True)
        }
    
    @staticmethod
    def refresh_token(user_id):
        user = db.session.get(User, user_id)
        if not user:
            raise ValueError('User not found')
        return {'access_token': create_access_token(identity=user.id)}
    
    @staticmethod
    def get_profile(user_id):
        user = db.session.get(User, user_id)
        if not user:
            raise ValueError('User not found')
        
        profile = user.to_dict(include_contact=True)
        if user.role == 'student' and user.student_profile:
            profile['student_profile'] = user.student_profile.to_dict(include_private=True)
        elif user.role == 'mentor' and user.mentor_profile:
            profile['mentor_profile'] = user.mentor_profile.to_dict(include_contact=True, include_private=True)
        
        return profile
