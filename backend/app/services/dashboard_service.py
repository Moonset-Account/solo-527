from datetime import datetime, timedelta
from sqlalchemy import func, and_
from app import db
from app.models import User, Mentor, Student, Appointment, Feedback, IndustryTag

class DashboardService:
    @staticmethod
    def get_admin_stats():
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        total_users = User.query.count()
        total_mentors = Mentor.query.filter_by(review_status='approved').count()
        total_students = Student.query.filter_by(review_status='approved').count()
        total_appointments = Appointment.query.count()
        
        pending_mentors = Mentor.query.filter_by(review_status='pending').count()
        pending_students = Student.query.filter_by(review_status='pending').count()
        pending_appointments = Appointment.query.filter_by(status='pending').count()
        
        appointments_this_week = Appointment.query.filter(
            Appointment.created_at >= week_ago
        ).count()
        
        appointments_this_month = Appointment.query.filter(
            Appointment.created_at >= month_ago
        ).count()
        
        completed_appointments = Appointment.query.filter_by(status='completed').count()
        completion_rate = (completed_appointments / total_appointments * 100) if total_appointments > 0 else 0
        
        avg_rating = db.session.query(func.avg(Feedback.student_rating)).filter(
            Feedback.student_rating.isnot(None)
        ).scalar() or 0
        
        appointments_by_status = db.session.query(
            Appointment.status, func.count(Appointment.id)
        ).group_by(Appointment.status).all()
        
        status_counts = {s: c for s, c in appointments_by_status}
        
        appointments_by_date = db.session.query(
            func.date(Appointment.created_at),
            func.count(Appointment.id)
        ).filter(
            Appointment.created_at >= month_ago
        ).group_by(func.date(Appointment.created_at)).order_by(func.date(Appointment.created_at)).all()
        
        top_mentors = Mentor.query.filter_by(review_status='approved').order_by(
            Mentor.total_meetings.desc(),
            Mentor.average_rating.desc()
        ).limit(5).all()
        
        industry_distribution = []
        all_tags = IndustryTag.query.filter_by(is_active=True).all()
        for tag in all_tags:
            count = Mentor.query.filter(Mentor.industry_tags.contains([tag.name])).count()
            if count > 0:
                industry_distribution.append({
                    'tag': tag.name,
                    'count': count
                })
        
        return {
            'overview': {
                'total_users': total_users,
                'total_mentors': total_mentors,
                'total_students': total_students,
                'total_appointments': total_appointments,
                'completed_appointments': completed_appointments,
                'completion_rate': round(completion_rate, 1),
                'average_rating': round(avg_rating, 1)
            },
            'pending': {
                'mentors': pending_mentors,
                'students': pending_students,
                'appointments': pending_appointments
            },
            'trends': {
                'appointments_this_week': appointments_this_week,
                'appointments_this_month': appointments_this_month
            },
            'appointments_by_status': status_counts,
            'appointments_by_date': [
                {'date': str(d), 'count': c} for d, c in appointments_by_date
            ],
            'top_mentors': [m.to_dict() for m in top_mentors],
            'industry_distribution': sorted(industry_distribution, key=lambda x: x['count'], reverse=True)[:10]
        }
    
    @staticmethod
    def get_mentor_dashboard(mentor_id):
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        
        mentor = db.session.get(Mentor, mentor_id)
        if not mentor:
            raise ValueError('Mentor not found')
        
        total_meetings = mentor.total_meetings
        avg_rating = mentor.average_rating
        
        appointments = Appointment.query.filter_by(mentor_id=mentor_id)
        upcoming = appointments.filter(Appointment.status.in_(['pending', 'confirmed', 'in_progress'])).count()
        completed = appointments.filter_by(status='completed').count()
        cancelled = appointments.filter_by(status='cancelled').count()
        
        recent_feedbacks = Feedback.query.filter_by(
            mentor_id=mentor_id
        ).filter(
            Feedback.student_submitted_at.isnot(None)
        ).order_by(Feedback.created_at.desc()).limit(5).all()
        
        return {
            'profile': mentor.to_dict(include_private=True),
            'stats': {
                'total_meetings': total_meetings,
                'average_rating': avg_rating,
                'upcoming_appointments': upcoming,
                'completed_appointments': completed,
                'cancelled_appointments': cancelled
            },
            'recent_feedbacks': [f.to_dict() for f in recent_feedbacks]
        }
    
    @staticmethod
    def get_student_dashboard(student_id):
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        
        student = db.session.get(Student, student_id)
        if not student:
            raise ValueError('Student not found')
        
        appointments = Appointment.query.filter_by(student_id=student_id)
        total = appointments.count()
        upcoming = appointments.filter(Appointment.status.in_(['pending', 'confirmed', 'in_progress'])).count()
        completed = appointments.filter_by(status='completed').count()
        cancelled = appointments.filter_by(status='cancelled').count()
        
        recent_appointments = appointments.order_by(Appointment.created_at.desc()).limit(5).all()
        
        return {
            'profile': student.to_dict(include_private=True),
            'stats': {
                'total_appointments': total,
                'upcoming_appointments': upcoming,
                'completed_appointments': completed,
                'cancelled_appointments': cancelled
            },
            'recent_appointments': [a.to_dict() for a in recent_appointments]
        }
