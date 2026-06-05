from flask import request, jsonify
from app.services.audit_service import AuditService
from app.middlewares.auth import require_role, require_login

def register_routes(api_bp):
    @api_bp.route('/audit-logs', methods=['GET'])
    @require_role('admin')
    def list_audit_logs():
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        filters = {
            'user_id': request.args.get('user_id', type=int),
            'action': request.args.get('action'),
            'resource_type': request.args.get('resource_type'),
            'resource_id': request.args.get('resource_id', type=int),
            'appointment_id': request.args.get('appointment_id', type=int),
            'start_date': request.args.get('start_date'),
            'end_date': request.args.get('end_date')
        }
        filters = {k: v for k, v in filters.items() if v}
        result = AuditService.list_logs(filters, page, per_page)
        return jsonify(result)

    @api_bp.route('/appointments/<int:appointment_id>/history', methods=['GET'])
    @require_login
    def get_appointment_history(appointment_id):
        from app.middlewares.auth import get_current_user
        current_user = get_current_user()
        from app.models import Appointment
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        if current_user.role != 'admin':
            if current_user.student_profile and appointment.student_id != current_user.student_profile.id:
                return jsonify({'error': 'Permission denied'}), 403
            if current_user.mentor_profile and appointment.mentor_id != current_user.mentor_profile.id:
                return jsonify({'error': 'Permission denied'}), 403
        
        history = AuditService.get_appointment_history(appointment_id)
        return jsonify(history)
