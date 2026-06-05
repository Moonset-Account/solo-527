from flask import request, jsonify
from app.services.user_service import UserService
from app.middlewares.auth import require_role, require_login, get_current_user

def register_routes(api_bp):
    @api_bp.route('/users', methods=['GET'])
    @require_role('admin')
    def list_users():
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        filters = {
            'role': request.args.get('role'),
            'status': request.args.get('status'),
            'keyword': request.args.get('keyword')
        }
        filters = {k: v for k, v in filters.items() if v}
        result = UserService.list_users(filters, page, per_page)
        return jsonify(result)

    @api_bp.route('/users/<int:user_id>', methods=['GET'])
    @require_login
    def get_user(user_id):
        current_user = get_current_user()
        if current_user.role != 'admin' and current_user.id != user_id:
            return jsonify({'error': 'Permission denied'}), 403
        try:
            user = UserService.get_user(user_id)
            return jsonify(user)
        except ValueError as e:
            return jsonify({'error': str(e)}), 404

    @api_bp.route('/users/<int:user_id>', methods=['PUT'])
    @require_login
    def update_user(user_id):
        current_user = get_current_user()
        data = request.get_json()
        try:
            user = UserService.update_user(user_id, data, current_user)
            return jsonify(user)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    @api_bp.route('/users/<int:user_id>', methods=['DELETE'])
    @require_role('admin')
    def deactivate_user(user_id):
        current_user = get_current_user()
        try:
            UserService.deactivate_user(user_id, current_user)
            return jsonify({'message': 'User deactivated'})
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
