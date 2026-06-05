from flask import request, jsonify
from app.api import api_bp
from app.services.student_service import StudentService
from app.middlewares.auth import require_role, require_login, get_current_user

@api_bp.route('/students', methods=['GET'])
@require_role('admin')
def list_students():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    filters = {
        'review_status': request.args.get('review_status'),
        'school': request.args.get('school'),
        'keyword': request.args.get('keyword')
    }
    filters = {k: v for k, v in filters.items() if v}
    result = StudentService.list_students(filters, page, per_page)
    return jsonify(result)

@api_bp.route('/students/<int:student_id>', methods=['GET'])
@require_login
def get_student(student_id):
    current_user = get_current_user()
    include_private = False
    if current_user.role == 'admin' or (current_user.student_profile and current_user.student_profile.id == student_id):
        include_private = True
    try:
        student = StudentService.get_student(student_id, include_private=include_private)
        return jsonify(student)
    except ValueError as e:
        return jsonify({'error': str(e)}), 404

@api_bp.route('/students/<int:student_id>', methods=['PUT'])
@require_login
def update_student(student_id):
    current_user = get_current_user()
    data = request.get_json()
    try:
        student = StudentService.update_student(student_id, data, current_user)
        return jsonify(student)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@api_bp.route('/students/<int:student_id>/review', methods=['POST'])
@require_role('admin')
def review_student(student_id):
    current_user = get_current_user()
    data = request.get_json()
    try:
        student = StudentService.review_student(
            student_id,
            data.get('status'),
            current_user.id
        )
        return jsonify(student)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
