from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.auth_service import AuthService
from app.middlewares.auth import require_login, get_current_user

def register_routes(api_bp):
    @api_bp.route('/auth/register', methods=['POST'])
    def register():
        data = request.get_json()
        try:
            user = AuthService.register(data)
            return jsonify({
                'message': 'Registration successful',
                'user': user.to_dict()
            }), 201
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    @api_bp.route('/auth/login', methods=['POST'])
    def login():
        data = request.get_json()
        try:
            result = AuthService.login(data.get('email'), data.get('password'))
            return jsonify(result)
        except ValueError as e:
            return jsonify({'error': str(e)}), 401

    @api_bp.route('/auth/refresh', methods=['POST'])
    @jwt_required(refresh=True)
    def refresh():
        user_id = get_jwt_identity()
        try:
            result = AuthService.refresh_token(user_id)
            return jsonify(result)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    @api_bp.route('/auth/profile', methods=['GET'])
    @require_login
    def get_profile():
        user = get_current_user()
        try:
            profile = AuthService.get_profile(user.id)
            return jsonify(profile)
        except ValueError as e:
            return jsonify({'error': str(e)}), 404

    @api_bp.route('/auth/profile', methods=['PUT'])
    @require_login
    def update_profile():
        user = get_current_user()
        data = request.get_json()
        from app.services.user_service import UserService
        try:
            updated = UserService.update_user(user.id, data, user)
            return jsonify(updated)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
