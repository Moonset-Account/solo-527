from flask import request, jsonify
from datetime import datetime
from app.services.appointment_service import AppointmentService
from app.middlewares.auth import require_login, get_current_user, require_appointment_access

def register_routes(api_bp):
    @api_bp.route('/appointments', methods=['POST'])
    @require_login
    def create_appointment():
        current_user = get_current_user()
        if not current_user.student_profile:
            return jsonify({'error': 'Only students can create appointments'}), 403
        
        data = request.get_json()
        try:
            appointment = AppointmentService.create_appointment(
                student_id=current_user.student_profile.id,
                mentor_id=data['mentor_id'],
                time_slot_id=data['time_slot_id'],
                title=data['title'],
                description=data.get('description', ''),
                topics=data.get('topics', []),
                meeting_type=data.get('meeting_type', 'online')
            )
            return jsonify(appointment), 201
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    @api_bp.route('/appointments', methods=['GET'])
    @require_login
    def list_appointments():
        current_user = get_current_user()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        filters = {
            'status': request.args.get('status'),
            'start_date': request.args.get('start_date'),
            'end_date': request.args.get('end_date')
        }
        if filters['start_date']:
            filters['start_date'] = datetime.fromisoformat(filters['start_date'].replace('Z', '+00:00'))
        if filters['end_date']:
            filters['end_date'] = datetime.fromisoformat(filters['end_date'].replace('Z', '+00:00'))
        filters = {k: v for k, v in filters.items() if v}
        
        result = AppointmentService.list_appointments(current_user, filters, page, per_page)
        return jsonify(result)

    @api_bp.route('/appointments/<int:appointment_id>', methods=['GET'])
    @require_login
    def get_appointment(appointment_id):
        current_user = get_current_user()
        try:
            appointment = AppointmentService.get_appointment(appointment_id, current_user)
            return jsonify(appointment)
        except ValueError as e:
            return jsonify({'error': str(e)}), 404

    @api_bp.route('/appointments/<int:appointment_id>/status', methods=['PUT'])
    @require_login
    def update_appointment_status(appointment_id):
        current_user = get_current_user()
        data = request.get_json()
        try:
            appointment = AppointmentService.update_status(
                appointment_id,
                data.get('status'),
                current_user,
                data.get('cancellation_reason')
            )
            return jsonify(appointment)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    @api_bp.route('/appointments/<int:appointment_id>/join', methods=['POST'])
    @require_login
    @require_appointment_access
    def join_appointment(appointment_id):
        current_user = get_current_user()
        try:
            appointment = AppointmentService.join_appointment(appointment_id, current_user)
            return jsonify(appointment)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    @api_bp.route('/appointments/<int:appointment_id>/attachments', methods=['GET'])
    @require_login
    @require_appointment_access
    def get_appointment_attachments(appointment_id):
        from app.services.upload_service import UploadService
        attachments = UploadService.get_attachments(appointment_id)
        return jsonify(attachments)

    @api_bp.route('/appointments/<int:appointment_id>/attachments', methods=['POST'])
    @require_login
    @require_appointment_access
    def upload_appointment_attachment(appointment_id):
        current_user = get_current_user()
        from app.services.upload_service import UploadService
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        try:
            file_data = UploadService.save_file(file, 'appointments', current_user.id)
            description = request.form.get('description', '')
            file_data['description'] = description
            
            attachment = AppointmentService.add_attachment(
                appointment_id,
                file_data,
                current_user.id
            )
            return jsonify(attachment), 201
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    @api_bp.route('/appointments/offline-sync', methods=['POST'])
    @require_login
    def sync_offline_appointments():
        current_user = get_current_user()
        data = request.get_json()
        try:
            from flask import current_app
            if hasattr(current_app, 'celery') and current_app.celery:
                sync_task = current_app.celery.tasks.get('sync_offline_data')
                if sync_task:
                    sync_task.delay(current_user.id, data)
                else:
                    from app.services.upload_service import UploadService
                    for item in data.get('uploads', []):
                        UploadService.save_offline_file(item, current_user.id)
            else:
                from app.services.upload_service import UploadService
                for item in data.get('uploads', []):
                    UploadService.save_offline_file(item, current_user.id)
        except Exception as e:
            print(f"Offline sync failed (fallback to sync): {e}")
            from app.services.upload_service import UploadService
            for item in data.get('uploads', []):
                UploadService.save_offline_file(item, current_user.id)
        return jsonify({'message': 'Sync started'})
