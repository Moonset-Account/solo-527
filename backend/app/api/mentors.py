from flask import request, jsonify
from datetime import datetime
from app.api import api_bp
from app.services.mentor_service import MentorService
from app.services.matching_service import MatchingService
from app.middlewares.auth import require_role, require_login, get_current_user

@api_bp.route('/mentors', methods=['GET'])
def list_mentors():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    filters = {
        'industry_tags': request.args.getlist('industry_tags'),
        'keyword': request.args.get('keyword'),
        'school': request.args.get('school'),
        'min_experience': request.args.get('min_experience', type=int)
    }
    filters = {k: v for k, v in filters.items() if v}
    if not filters.get('industry_tags'):
        filters.pop('industry_tags', None)
    result = MentorService.list_mentors(filters, page, per_page)
    return jsonify(result)

@api_bp.route('/mentors/<int:mentor_id>', methods=['GET'])
def get_mentor(mentor_id):
    current_user = get_current_user()
    include_contact = False
    if current_user and (current_user.role == 'admin' or current_user.mentor_profile and current_user.mentor_profile.id == mentor_id):
        include_contact = True
    try:
        mentor = MentorService.get_mentor(mentor_id, include_contact=include_contact)
        return jsonify(mentor)
    except ValueError as e:
        return jsonify({'error': str(e)}), 404

@api_bp.route('/mentors/<int:mentor_id>', methods=['PUT'])
@require_login
def update_mentor(mentor_id):
    current_user = get_current_user()
    data = request.get_json()
    try:
        mentor = MentorService.update_mentor(mentor_id, data, current_user)
        return jsonify(mentor)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@api_bp.route('/mentors/<int:mentor_id>/review', methods=['POST'])
@require_role('admin')
def review_mentor(mentor_id):
    current_user = get_current_user()
    data = request.get_json()
    try:
        mentor = MentorService.review_mentor(
            mentor_id,
            data.get('status'),
            current_user.id,
            data.get('review_note')
        )
        return jsonify(mentor)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@api_bp.route('/mentors/<int:mentor_id>/time-slots', methods=['GET'])
def get_mentor_time_slots(mentor_id):
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    if start_date:
        start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    if end_date:
        end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    try:
        slots = MentorService.get_time_slots(mentor_id, start_date, end_date)
        return jsonify(slots)
    except ValueError as e:
        return jsonify({'error': str(e)}), 404

@api_bp.route('/mentors/<int:mentor_id>/time-slots', methods=['POST'])
@require_login
def add_time_slot(mentor_id):
    current_user = get_current_user()
    data = request.get_json()
    try:
        start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
        slot = MentorService.add_time_slot(mentor_id, start_time, end_time, current_user)
        return jsonify(slot), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@api_bp.route('/time-slots/<int:slot_id>', methods=['DELETE'])
@require_login
def delete_time_slot(slot_id):
    current_user = get_current_user()
    try:
        MentorService.delete_time_slot(slot_id, current_user)
        return jsonify({'message': 'Time slot deleted'})
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@api_bp.route('/mentors/recommendations', methods=['GET'])
@require_login
def get_mentor_recommendations():
    current_user = get_current_user()
    if not current_user.student_profile:
        return jsonify({'error': 'Only students can get recommendations'}), 403
    
    limit = request.args.get('limit', 10, type=int)
    try:
        recommendations = MatchingService.get_recommendations(current_user.student_profile.id, limit)
        return jsonify(recommendations)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@api_bp.route('/mentors/<int:mentor_id>/student-matches', methods=['GET'])
@require_login
def get_mentor_student_matches(mentor_id):
    current_user = get_current_user()
    if current_user.role != 'admin' and not (current_user.mentor_profile and current_user.mentor_profile.id == mentor_id):
        return jsonify({'error': 'Permission denied'}), 403
    
    limit = request.args.get('limit', 10, type=int)
    try:
        matches = MatchingService.get_mentor_student_matches(mentor_id, limit)
        return jsonify(matches)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
