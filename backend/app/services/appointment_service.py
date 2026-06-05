from datetime import datetime, timedelta
import qrcode
import io
import os
from app import db
from app.models import Appointment, TimeSlot, Mentor, Student, Feedback, Attachment
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService

class AppointmentService:
    @staticmethod
    def create_appointment(student_id, mentor_id, time_slot_id, title, description, topics=None, meeting_type='online'):
        time_slot = db.session.get(TimeSlot, time_slot_id)
        if not time_slot or time_slot.mentor_id != mentor_id:
            raise ValueError('Invalid time slot')
        if time_slot.is_booked:
            raise ValueError('Time slot already booked')
        
        mentor = db.session.get(Mentor, mentor_id)
        student = db.session.get(Student, student_id)
        if not mentor or not student:
            raise ValueError('Invalid mentor or student')
        
        if mentor.review_status != 'approved':
            raise ValueError('Mentor not approved')
        
        appointment = Appointment(
            student_id=student_id,
            mentor_id=mentor_id,
            time_slot_id=time_slot_id,
            title=title,
            description=description,
            topics=topics or [],
            status='pending',
            meeting_type=meeting_type
        )
        
        time_slot.is_booked = True
        
        db.session.add(appointment)
        db.session.flush()
        
        if meeting_type == 'online':
            appointment.meeting_link = f"https://meet.example.com/appointment/{appointment.id}"
        
        qr_data = f"appointment:{appointment.id}:{int(time_slot.start_time.timestamp())}"
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        qr_path = f"uploads/qrcodes/appointment_{appointment.id}.png"
        os.makedirs(os.path.dirname(qr_path), exist_ok=True)
        img.save(qr_path)
        appointment.qr_code = qr_path
        
        db.session.flush()
        
        feedback = Feedback(
            appointment_id=appointment.id,
            student_id=student_id,
            mentor_id=mentor_id
        )
        db.session.add(feedback)
        db.session.commit()
        
        NotificationService.create_notification(
            mentor.user_id,
            'appointment_request',
            '新的预约请求',
            f'{student.user.name} 预约了您 {time_slot.start_time.strftime("%Y-%m-%d %H:%M")} 的时段',
            'appointment',
            appointment.id
        )
        
        AuditService.log(
            user_id=student.user_id,
            action='create',
            resource_type='appointment',
            resource_id=appointment.id,
            appointment_id=appointment.id
        )
        
        return appointment.to_dict(include_details=True)
    
    @staticmethod
    def list_appointments(user, filters=None, page=1, per_page=20):
        query = Appointment.query
        
        if user.role == 'student' and user.student_profile:
            query = query.filter(Appointment.student_id == user.student_profile.id)
        elif user.role == 'mentor' and user.mentor_profile:
            query = query.filter(Appointment.mentor_id == user.mentor_profile.id)
        
        if filters:
            if filters.get('status'):
                query = query.filter(Appointment.status == filters['status'])
            if filters.get('start_date'):
                query = query.join(TimeSlot).filter(TimeSlot.start_time >= filters['start_date'])
            if filters.get('end_date'):
                query = query.join(TimeSlot).filter(TimeSlot.start_time <= filters['end_date'])
        
        query = query.join(TimeSlot).order_by(TimeSlot.start_time.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return {
            'items': [a.to_dict(include_details=True, include_contact=(a.status == 'completed' and a.contact_unlocked)) for a in pagination.items],
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }
    
    @staticmethod
    def get_appointment(appointment_id, user):
        appointment = db.session.get(Appointment, appointment_id)
        if not appointment:
            raise ValueError('Appointment not found')
        
        include_contact = appointment.contact_unlocked or user.role == 'admin'
        include_details = True
        
        if user.role == 'student' and appointment.student_id != user.student_profile.id:
            include_details = False
        elif user.role == 'mentor' and appointment.mentor_id != user.mentor_profile.id:
            include_details = False
        
        return appointment.to_dict(include_details=include_details, include_contact=include_contact)
    
    @staticmethod
    def update_status(appointment_id, status, user, cancellation_reason=None):
        appointment = db.session.get(Appointment, appointment_id)
        if not appointment:
            raise ValueError('Appointment not found')
        
        valid_transitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['in_progress', 'cancelled'],
            'in_progress': ['completed', 'cancelled'],
            'completed': [],
            'cancelled': []
        }
        
        if status not in valid_transitions.get(appointment.status, []):
            raise ValueError(f'Invalid status transition from {appointment.status} to {status}')
        
        old_status = appointment.status
        appointment.status = status
        
        if status == 'cancelled':
            appointment.cancellation_reason = cancellation_reason
            appointment.cancelled_by = user.id
            appointment.cancelled_at = datetime.utcnow()
            appointment.time_slot.is_booked = False
        elif status == 'completed':
            appointment.ended_at = datetime.utcnow()
            appointment.contact_unlocked = True
            appointment.contact_unlocked_at = datetime.utcnow()
            
            mentor = appointment.mentor
            mentor.total_meetings += 1
            db.session.add(mentor)
        elif status == 'in_progress':
            appointment.started_at = datetime.utcnow()
        
        db.session.commit()
        
        notify_user_id = appointment.mentor.user_id if user.role == 'student' else appointment.student.user_id
        status_messages = {
            'confirmed': '预约已确认',
            'cancelled': '预约已取消',
            'in_progress': '会面已开始',
            'completed': '会面已完成'
        }
        NotificationService.create_notification(
            notify_user_id,
            f'appointment_{status}',
            status_messages.get(status, '预约状态更新'),
            f'预约「{appointment.title}」状态已更新为{status}',
            'appointment',
            appointment.id
        )
        
        AuditService.log(
            user_id=user.id,
            action='update_status',
            resource_type='appointment',
            resource_id=appointment.id,
            appointment_id=appointment.id,
            old_values={'status': old_status},
            new_values={'status': status}
        )
        
        return appointment.to_dict(include_details=True)
    
    @staticmethod
    def join_appointment(appointment_id, user):
        appointment = db.session.get(Appointment, appointment_id)
        if not appointment:
            raise ValueError('Appointment not found')
        
        now = datetime.utcnow()
        if user.role == 'student' and appointment.student_id == user.student_profile.id:
            appointment.student_joined_at = now
        elif user.role == 'mentor' and appointment.mentor_id == user.mentor_profile.id:
            appointment.mentor_joined_at = now
        else:
            raise ValueError('Permission denied')
        
        if appointment.student_joined_at and appointment.mentor_joined_at and not appointment.started_at:
            appointment.started_at = now
            appointment.status = 'in_progress'
        
        db.session.commit()
        return appointment.to_dict(include_details=True)
    
    @staticmethod
    def add_attachment(appointment_id, file_data, uploaded_by):
        appointment = db.session.get(Appointment, appointment_id)
        if not appointment:
            raise ValueError('Appointment not found')
        
        attachment = Attachment(
            appointment_id=appointment_id,
            uploaded_by=uploaded_by,
            file_name=file_data['filename'],
            file_path=file_data['path'],
            file_size=file_data.get('size'),
            file_type=file_data.get('type'),
            is_offline_upload=file_data.get('is_offline', False)
        )
        if file_data.get('is_offline'):
            attachment.offline_sync_at = datetime.utcnow()
        
        db.session.add(attachment)
        db.session.commit()
        return attachment.to_dict()
