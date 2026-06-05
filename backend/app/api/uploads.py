from flask import request, jsonify, send_from_directory, current_app
from app.services.upload_service import UploadService
from app.middlewares.auth import require_login, get_current_user
import os

def register_routes(api_bp):
    @api_bp.route('/upload', methods=['POST'])
    @require_login
    def upload_file():
        current_user = get_current_user()
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        upload_type = request.form.get('type', 'general')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        try:
            file_data = UploadService.save_file(file, upload_type, current_user.id)
            return jsonify(file_data)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    @api_bp.route('/upload/offline', methods=['POST'])
    @require_login
    def upload_offline_file():
        current_user = get_current_user()
        data = request.get_json()
        try:
            file_data = UploadService.save_offline_file(data, current_user.id)
            return jsonify(file_data)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    @api_bp.route('/uploads/<path:filename>', methods=['GET'])
    def serve_upload(filename):
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        return send_from_directory(upload_folder, filename)

    @api_bp.route('/attachments/<int:attachment_id>', methods=['DELETE'])
    @require_login
    def delete_attachment(attachment_id):
        current_user = get_current_user()
        try:
            UploadService.delete_attachment(attachment_id, current_user.id)
            return jsonify({'message': 'Attachment deleted'})
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
