from datetime import datetime
from app import db
from app.models import Feedback, Mentor, Appointment, FeedbackQuestion

class FeedbackService:
    @staticmethod
    def get_questions(target_role='student'):
        questions = FeedbackQuestion.query.filter_by(
            target_role=target_role,
            is_active=True
        ).order_by(FeedbackQuestion.sort_order).all()
        return [q.to_dict() for q in questions]
    
    @staticmethod
    def submit_student_feedback(appointment_id, student_id, data):
        feedback = Feedback.query.filter_by(
            appointment_id=appointment_id,
            student_id=student_id
        ).first()
        
        if not feedback:
            raise ValueError('Feedback not found')
        
        if feedback.student_submitted_at:
            raise ValueError('Feedback already submitted')
        
        appointment = db.session.get(Appointment, appointment_id)
        if appointment.status != 'completed':
            raise ValueError('Cannot submit feedback for incomplete appointment')
        
        feedback.student_rating = data.get('rating')
        feedback.student_comment = data.get('comment')
        feedback.student_answers = data.get('answers', {})
        feedback.student_submitted_at = datetime.utcnow()
        
        if feedback.mentor_submitted_at:
            feedback.is_complete = True
        
        db.session.commit()
        
        if feedback.student_rating:
            mentor = db.session.get(Mentor, feedback.mentor_id)
            all_feedbacks = Feedback.query.filter(
                Feedback.mentor_id == feedback.mentor_id,
                Feedback.student_rating.isnot(None)
            ).all()
            
            if all_feedbacks:
                avg_rating = sum(f.student_rating for f in all_feedbacks) / len(all_feedbacks)
                mentor.average_rating = round(avg_rating, 1)
                db.session.commit()
        
        return feedback.to_dict()
    
    @staticmethod
    def submit_mentor_feedback(appointment_id, mentor_id, data):
        feedback = Feedback.query.filter_by(
            appointment_id=appointment_id,
            mentor_id=mentor_id
        ).first()
        
        if not feedback:
            raise ValueError('Feedback not found')
        
        if feedback.mentor_submitted_at:
            raise ValueError('Feedback already submitted')
        
        appointment = db.session.get(Appointment, appointment_id)
        if appointment.status != 'completed':
            raise ValueError('Cannot submit feedback for incomplete appointment')
        
        feedback.mentor_rating = data.get('rating')
        feedback.mentor_comment = data.get('comment')
        feedback.mentor_answers = data.get('answers', {})
        feedback.mentor_submitted_at = datetime.utcnow()
        
        if feedback.student_submitted_at:
            feedback.is_complete = True
        
        db.session.commit()
        return feedback.to_dict()
    
    @staticmethod
    def get_feedback(appointment_id, user):
        feedback = Feedback.query.filter_by(appointment_id=appointment_id).first()
        if not feedback:
            raise ValueError('Feedback not found')
        
        include_private = user.role == 'admin'
        return feedback.to_dict(include_private=include_private)
    
    @staticmethod
    def get_mentor_feedbacks(mentor_id, page=1, per_page=20):
        query = Feedback.query.filter_by(mentor_id=mentor_id).filter(
            Feedback.student_submitted_at.isnot(None)
        ).order_by(Feedback.created_at.desc())
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return {
            'items': [f.to_dict() for f in pagination.items],
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }
