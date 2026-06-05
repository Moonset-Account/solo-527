from flask import request, jsonify
from app.services.notification_service import NotificationService
from app.middlewares.auth import require_login, get_current_user

def register_routes(api_bp):
    @api_bp.route('/notifications', methods=['GET'])
    @require_login
    def list_notifications():
        current_user = get_current_user()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        result = NotificationService.list_notifications(current_user.id, unread_only, page, per_page)
        return jsonify(result)

    @api_bp.route('/notifications/<int:notification_id>/read', methods=['POST'])
    @require_login
    def mark_notification_read(notification_id):
        current_user = get_current_user()
        try:
            notification = NotificationService.mark_as_read(notification_id, current_user.id)
            return jsonify(notification)
        except ValueError as e:
            return jsonify({'error': str(e)}), 404

    @api_bp.route('/notifications/read-all', methods=['POST'])
    @require_login
    def mark_all_notifications_read():
        current_user = get_current_user()
        NotificationService.mark_all_as_read(current_user.id)
        return jsonify({'message': 'All notifications marked as read'})

    @api_bp.route('/notifications/unread-count', methods=['GET'])
    @require_login
    def get_unread_count():
        current_user = get_current_user()
        count = NotificationService.get_unread_count(current_user.id)
        return jsonify({'count': count})
