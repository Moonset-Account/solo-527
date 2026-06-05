import pytest
from app import db
from app.services.appointment_service import AppointmentService
from app.services.matching_service import MatchingService
from datetime import datetime, timedelta

def test_create_appointment(app, test_student, test_mentor):
    with app.app_context():
        user_s, student = test_student
        user_m, mentor = test_mentor
        
        from app.models import TimeSlot
        time_slot = TimeSlot(
            mentor_id=mentor.id,
            start_time=datetime.utcnow() + timedelta(days=5),
            end_time=datetime.utcnow() + timedelta(days=5, hours=1)
        )
        db.session.add(time_slot)
        db.session.commit()
        
        appointment = AppointmentService.create_appointment(
            student_id=student.id,
            mentor_id=mentor.id,
            time_slot_id=time_slot.id,
            title='求职咨询',
            description='咨询互联网行业求职经验',
            topics=['简历', '面试'],
            meeting_type='online'
        )
        
        assert appointment is not None
        assert appointment['status'] == 'pending'
        assert appointment['title'] == '求职咨询'

def test_appointment_status_transition(app, test_appointment):
    with app.app_context():
        appointment = test_appointment
        
        result = AppointmentService.update_status(
            appointment.id,
            'in_progress',
            appointment.mentor.user
        )
        assert result['status'] == 'in_progress'
        
        result = AppointmentService.update_status(
            appointment.id,
            'completed',
            appointment.mentor.user
        )
        assert result['status'] == 'completed'
        assert result['contact_unlocked'] == True

def test_invalid_status_transition(app, test_appointment):
    with app.app_context():
        appointment = test_appointment
        
        with pytest.raises(ValueError, match='Invalid status transition'):
            AppointmentService.update_status(
                appointment.id,
                'completed',
                appointment.mentor.user
            )

def test_contact_unlocked_after_completion(app, test_appointment):
    with app.app_context():
        appointment = test_appointment
        
        AppointmentService.update_status(
            appointment.id,
            'in_progress',
            appointment.mentor.user
        )
        
        result = AppointmentService.update_status(
            appointment.id,
            'completed',
            appointment.mentor.user
        )
        
        assert result['contact_unlocked'] == True
        assert result['contact_unlocked_at'] is not None

def test_matching_score(app, test_student, test_mentor):
    with app.app_context():
        user_s, student = test_student
        user_m, mentor = test_mentor
        
        score = MatchingService.calculate_match_score(student, mentor)
        assert score > 0
        assert score <= 100

def test_get_recommendations(app, test_student, test_mentor):
    with app.app_context():
        user_s, student = test_student
        user_m, mentor = test_mentor
        
        recommendations = MatchingService.get_recommendations(student.id, limit=5)
        assert len(recommendations) > 0
        assert 'match_score' in recommendations[0]
        assert 'match_reasons' in recommendations[0]
