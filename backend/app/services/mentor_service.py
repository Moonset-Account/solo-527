from datetime import datetime
from app import db
from app.models import Mentor, User, IndustryTag, TimeSlot

class MentorService:
    @staticmethod
    def list_mentors(filters=None, page=1, per_page=20):
        query = Mentor.query.filter_by(review_status='approved')
        
        if filters:
            if filters.get('industry_tags'):
                query = query.filter(Mentor.industry_tags.contains(filters['industry_tags']))
            if filters.get('keyword'):
                keyword = f"%{filters['keyword']}%"
                query = query.join(User).filter(
                    db.or_(
                        User.name.like(keyword),
                        Mentor.current_company.like(keyword),
                        Mentor.current_position.like(keyword)
                    )
                )
            if filters.get('school'):
                query = query.filter(Mentor.school == filters['school'])
            if filters.get('min_experience'):
                query = query.filter(Mentor.years_of_experience >= filters['min_experience'])
        
        query = query.order_by(Mentor.average_rating.desc(), Mentor.total_meetings.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return {
            'items': [m.to_dict() for m in pagination.items],
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }
    
    @staticmethod
    def get_mentor(mentor_id, include_contact=False):
        mentor = db.session.get(Mentor, mentor_id)
        if not mentor:
            raise ValueError('Mentor not found')
        return mentor.to_dict(include_contact=include_contact, include_private=include_contact)
    
    @staticmethod
    def update_mentor(mentor_id, data, current_user):
        mentor = db.session.get(Mentor, mentor_id)
        if not mentor:
            raise ValueError('Mentor not found')
        if mentor.user_id != current_user.id and current_user.role != 'admin':
            raise ValueError('Permission denied')
        
        updatable_fields = [
            'current_company', 'current_position', 'years_of_experience',
            'industry_tags', 'expertise_areas', 'bio', 'linkedin_url',
            'max_appointments_per_week'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(mentor, field, data[field])
        
        db.session.commit()
        return mentor.to_dict(include_contact=True, include_private=True)
    
    @staticmethod
    def review_mentor(mentor_id, status, reviewed_by, review_note=None):
        mentor = db.session.get(Mentor, mentor_id)
        if not mentor:
            raise ValueError('Mentor not found')
        
        mentor.review_status = status
        mentor.reviewed_by = reviewed_by
        mentor.reviewed_at = datetime.utcnow()
        
        if status == 'approved':
            mentor.user.status = 'active'
        db.session.commit()
        return mentor.to_dict()
    
    @staticmethod
    def get_time_slots(mentor_id, start_date=None, end_date=None):
        mentor = db.session.get(Mentor, mentor_id)
        if not mentor:
            raise ValueError('Mentor not found')
        
        query = TimeSlot.query.filter_by(mentor_id=mentor_id, is_booked=False)
        if start_date:
            query = query.filter(TimeSlot.start_time >= start_date)
        if end_date:
            query = query.filter(TimeSlot.start_time <= end_date)
        
        query = query.order_by(TimeSlot.start_time)
        return [ts.to_dict() for ts in query.all()]
    
    @staticmethod
    def add_time_slot(mentor_id, start_time, end_time, current_user):
        mentor = db.session.get(Mentor, mentor_id)
        if not mentor:
            raise ValueError('Mentor not found')
        if mentor.user_id != current_user.id and current_user.role != 'admin':
            raise ValueError('Permission denied')
        
        existing = TimeSlot.query.filter(
            TimeSlot.mentor_id == mentor_id,
            TimeSlot.start_time < end_time,
            TimeSlot.end_time > start_time
        ).first()
        if existing:
            raise ValueError('Time slot conflicts with existing slot')
        
        time_slot = TimeSlot(
            mentor_id=mentor_id,
            start_time=start_time,
            end_time=end_time
        )
        db.session.add(time_slot)
        db.session.commit()
        return time_slot.to_dict()
    
    @staticmethod
    def delete_time_slot(time_slot_id, current_user):
        time_slot = db.session.get(TimeSlot, time_slot_id)
        if not time_slot:
            raise ValueError('Time slot not found')
        if time_slot.mentor.user_id != current_user.id and current_user.role != 'admin':
            raise ValueError('Permission denied')
        if time_slot.is_booked:
            raise ValueError('Cannot delete booked time slot')
        
        db.session.delete(time_slot)
        db.session.commit()
        return True
