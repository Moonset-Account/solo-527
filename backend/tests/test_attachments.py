import pytest
import os
from app import db
from app.models import Attachment, Appointment
from app.services.appointment_service import AppointmentService
from datetime import datetime, timedelta

def test_add_attachment(app, test_appointment):
    with app.app_context():
        appointment = test_appointment
        
        file_data = {
            'filename': 'resume.pdf',
            'path': 'uploads/appointments/test_resume.pdf',
            'size': 1024000,
            'type': 'application/pdf',
            'description': '学生简历'
        }
        
        attachment = AppointmentService.add_attachment(
            appointment.id,
            file_data,
            appointment.student.user_id
        )
        
        assert attachment is not None
        assert attachment['file_name'] == 'resume.pdf'
        assert attachment['description'] == '学生简历'

def test_offline_attachment(app, test_appointment):
    with app.app_context():
        appointment = test_appointment
        
        file_data = {
            'filename': 'offline_photo.jpg',
            'path': 'uploads/offline/test_photo.jpg',
            'size': 2048000,
            'type': 'image/jpeg',
            'is_offline': True,
            'description': '离线上传的照片'
        }
        
        attachment = AppointmentService.add_attachment(
            appointment.id,
            file_data,
            appointment.student.user_id
        )
        
        assert attachment is not None
        assert attachment['is_offline_upload'] == True
        assert attachment['offline_sync_at'] is not None

def test_get_attachments(app, test_appointment):
    with app.app_context():
        appointment = test_appointment
        
        for i in range(3):
            file_data = {
                'filename': f'file_{i}.pdf',
                'path': f'uploads/appointments/file_{i}.pdf',
                'size': 1024,
                'type': 'application/pdf'
            }
            AppointmentService.add_attachment(
                appointment.id,
                file_data,
                appointment.student.user_id
            )
        
        from app.services.upload_service import UploadService
        attachments = UploadService.get_attachments(appointment.id)
        assert len(attachments) == 3

def test_delete_attachment(app, test_appointment):
    with app.app_context():
        appointment = test_appointment
        
        file_data = {
            'filename': 'test_file.pdf',
            'path': 'uploads/appointments/test_file.pdf',
            'size': 1024,
            'type': 'application/pdf'
        }
        attachment = AppointmentService.add_attachment(
            appointment.id,
            file_data,
            appointment.student.user_id
        )
        
        from app.services.upload_service import UploadService
        result = UploadService.delete_attachment(
            attachment['id'],
            appointment.student.user_id
        )
        assert result == True
