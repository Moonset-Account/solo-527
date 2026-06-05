import os
import uuid
from werkzeug.utils import secure_filename
from datetime import datetime
from app import db
from app.models import Attachment
from flask import current_app

class UploadService:
    @staticmethod
    def allowed_file(filename):
        allowed_extensions = current_app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx'})
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions
    
    @staticmethod
    def save_file(file, upload_type='general', uploaded_by=None, is_offline=False):
        if not file or not UploadService.allowed_file(file.filename):
            raise ValueError('Invalid file type')
        
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        type_folder = os.path.join(upload_folder, upload_type)
        os.makedirs(type_folder, exist_ok=True)
        
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        file_path = os.path.join(type_folder, unique_filename)
        
        file.save(file_path)
        
        file_size = os.path.getsize(file_path)
        file_type = filename.rsplit('.', 1)[1].lower() if '.' in filename else None
        
        return {
            'filename': filename,
            'path': file_path,
            'size': file_size,
            'type': file_type,
            'url': f"/{file_path}",
            'is_offline': is_offline
        }
    
    @staticmethod
    def save_offline_file(data, uploaded_by, appointment_id=None):
        file_data = {
            'filename': data.get('filename', 'offline_file'),
            'path': data.get('path', f"uploads/offline/{uuid.uuid4().hex}"),
            'size': data.get('size', 0),
            'type': data.get('type'),
            'is_offline': True
        }
        
        os.makedirs(os.path.dirname(file_data['path']), exist_ok=True)
        if data.get('content'):
            with open(file_data['path'], 'wb') as f:
                f.write(data['content'].encode('utf-8') if isinstance(data['content'], str) else data['content'])
        
        if appointment_id:
            attachment = Attachment(
                appointment_id=appointment_id,
                uploaded_by=uploaded_by,
                file_name=file_data['filename'],
                file_path=file_data['path'],
                file_size=file_data['size'],
                file_type=file_data['type'],
                description=data.get('description', ''),
                is_offline_upload=True,
                offline_sync_at=datetime.utcnow()
            )
            db.session.add(attachment)
            db.session.commit()
            return attachment.to_dict()
        
        return file_data
    
    @staticmethod
    def get_attachments(appointment_id):
        attachments = Attachment.query.filter_by(appointment_id=appointment_id).order_by(Attachment.created_at.desc()).all()
        return [a.to_dict() for a in attachments]
    
    @staticmethod
    def delete_attachment(attachment_id, user_id):
        attachment = db.session.get(Attachment, attachment_id)
        if not attachment:
            raise ValueError('Attachment not found')
        if attachment.uploaded_by != user_id:
            raise ValueError('Permission denied')
        
        if os.path.exists(attachment.file_path):
            os.remove(attachment.file_path)
        
        db.session.delete(attachment)
        db.session.commit()
        return True
