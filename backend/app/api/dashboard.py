from flask import jsonify
from app.services.dashboard_service import DashboardService
from app.middlewares.auth import require_role, require_login, get_current_user

def register_routes(api_bp):
    @api_bp.route('/dashboard/admin', methods=['GET'])
    @require_role('admin')
    def get_admin_dashboard():
        stats = DashboardService.get_admin_stats()
        return jsonify(stats)

    @api_bp.route('/dashboard/mentor', methods=['GET'])
    @require_login
    def get_mentor_dashboard():
        current_user = get_current_user()
        if not current_user.mentor_profile:
            return jsonify({'error': 'Only mentors can access this dashboard'}), 403
        
        try:
            stats = DashboardService.get_mentor_dashboard(current_user.mentor_profile.id)
            return jsonify(stats)
        except ValueError as e:
            return jsonify({'error': str(e)}), 404

    @api_bp.route('/dashboard/student', methods=['GET'])
    @require_login
    def get_student_dashboard():
        current_user = get_current_user()
        if not current_user.student_profile:
            return jsonify({'error': 'Only students can access this dashboard'}), 403
        
        try:
            stats = DashboardService.get_student_dashboard(current_user.student_profile.id)
            return jsonify(stats)
        except ValueError as e:
            return jsonify({'error': str(e)}), 404
