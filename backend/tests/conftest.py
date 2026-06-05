import pytest
from app import create_app, db
from app.models import *
from datetime import datetime, timedelta

@pytest.fixture
def app():
    app = create_app('testing')
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers(client):
    user_data = {
        'email': 'admin@test.com',
        'password': 'test123',
        'name': 'Admin User',
        'role': 'admin'
    }
    
    client.post('/api/auth/register', json=user_data)
    response = client.post('/api/auth/login', json={
        'email': 'admin@test.com',
        'password': 'test123'
    })
    
    token = response.get_json()['access_token']
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def test_student(app):
    with app.app_context():
        user = User(
            email='student@test.com',
            name='Test Student',
            role='student',
            status='active'
        )
        user.set_password('test123')
        db.session.add(user)
        db.session.flush()
        
        student = Student(
            user_id=user.id,
            student_id='STU001',
            school='Test University',
            department='Computer Science',
            major='Software Engineering',
            grade='Senior',
            expected_graduation=datetime(2025, 6, 30).date(),
            target_industries=['互联网', '金融科技'],
            target_positions=['后端开发', '全栈工程师'],
            review_status='approved'
        )
        db.session.add(student)
        db.session.commit()
        
        return user, student

@pytest.fixture
def test_mentor(app):
    with app.app_context():
        user = User(
            email='mentor@test.com',
            name='Test Mentor',
            role='mentor',
            status='active'
        )
        user.set_password('test123')
        db.session.add(user)
        db.session.flush()
        
        mentor = Mentor(
            user_id=user.id,
            alumni_id='ALU001',
            graduation_year=2018,
            school='Test University',
            department='Computer Science',
            major='Computer Science',
            current_company='Tech Corp',
            current_position='Senior Engineer',
            years_of_experience=6,
            industry_tags=['互联网', '金融科技'],
            expertise_areas=['后端开发', '系统设计'],
            review_status='approved',
            average_rating=4.8,
            total_meetings=25
        )
        db.session.add(mentor)
        db.session.commit()
        
        return user, mentor

@pytest.fixture
def test_appointment(app, test_student, test_mentor):
    with app.app_context():
        user, student = test_student
        user_m, mentor = test_mentor
        
        time_slot = TimeSlot(
            mentor_id=mentor.id,
            start_time=datetime.utcnow() + timedelta(days=3),
            end_time=datetime.utcnow() + timedelta(days=3, hours=1)
        )
        db.session.add(time_slot)
        db.session.flush()
        
        appointment = Appointment(
            student_id=student.id,
            mentor_id=mentor.id,
            time_slot_id=time_slot.id,
            title='职业发展咨询',
            description='关于简历优化和面试技巧的咨询',
            topics=['简历优化', '面试技巧'],
            status='confirmed',
            meeting_type='online'
        )
        db.session.add(appointment)
        db.session.commit()
        
        return appointment
