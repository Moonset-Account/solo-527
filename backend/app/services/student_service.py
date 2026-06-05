from datetime import datetime
from app import db
from app.models import Student, User

class StudentService:
    @staticmethod
    def list_students(filters=None, page=1, per_page=20):
        query = Student.query
        
        if filters:
            if filters.get('review_status'):
                query = query.filter(Student.review_status == filters['review_status'])
            if filters.get('school'):
                query = query.filter(Student.school == filters['school'])
            if filters.get('keyword'):
                keyword = f"%{filters['keyword']}%"
                query = query.join(User).filter(User.name.like(keyword))
        
        query = query.order_by(Student.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return {
            'items': [s.to_dict() for s in pagination.items],
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }
    
    @staticmethod
    def get_student(student_id, include_private=False):
        student = db.session.get(Student, student_id)
        if not student:
            raise ValueError('Student not found')
        return student.to_dict(include_private=include_private)
    
    @staticmethod
    def update_student(student_id, data, current_user):
        student = db.session.get(Student, student_id)
        if not student:
            raise ValueError('Student not found')
        if student.user_id != current_user.id and current_user.role != 'admin':
            raise ValueError('Permission denied')
        
        updatable_fields = [
            'school', 'department', 'major', 'grade', 'expected_graduation',
            'target_industries', 'target_positions', 'resume_url', 'bio'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(student, field, data[field])
        
        student.review_status = 'pending'
        db.session.commit()
        return student.to_dict(include_private=True)
    
    @staticmethod
    def review_student(student_id, status, reviewed_by):
        student = db.session.get(Student, student_id)
        if not student:
            raise ValueError('Student not found')
        
        student.review_status = status
        student.reviewed_by = reviewed_by
        student.reviewed_at = datetime.utcnow()
        
        if status == 'approved':
            student.user.status = 'active'
        db.session.commit()
        return student.to_dict()
