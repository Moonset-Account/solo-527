from flask import request, jsonify
from app.api import api_bp
from app.services.feedback_service import FeedbackService
from app.middlewares.auth import require_login, get_current_user

@api_bp.route('/feedback/questions', methods=['GET'])
def get_feedback_questions():
    target_role = request.args.get('target_role', 'student')
    questions = FeedbackService.get_questions(target_role)
    return jsonify(questions)

@api_bp.route('/appointments/<int:appointment_id>/feedback', methods=['GET'])
@require_login
def get_feedback(appointment_id):
    current_user = get_current_user()
    try:
        feedback = FeedbackService.get_feedback(appointment_id, current_user)
        return jsonify(feedback)
    except ValueError as e:
        return jsonify({'error': str(e)}), 404

@api_bp.route('/appointments/<int:appointment_id>/feedback/student', methods=['POST'])
@require_login
def submit_student_feedback(appointment_id):
    current_user = get_current_user()
    if not current_user.student_profile:
        return jsonify({'error': 'Only students can submit student feedback'}), 403
    
    data = request.get_json()
    try:
        feedback = FeedbackService.submit_student_feedback(
            appointment_id,
            current_user.student_profile.id,
            data
        )
        return jsonify(feedback)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@api_bp.route('/appointments/<int:appointment_id>/feedback/mentor', methods=['POST'])
@require_login
def submit_mentor_feedback(appointment_id):
    current_user = get_current_user()
    if not current_user.mentor_profile:
        return jsonify({'error': 'Only mentors can submit mentor feedback'}), 403
    
    data = request.get_json()
    try:
        feedback = FeedbackService.submit_mentor_feedback(
            appointment_id,
            current_user.mentor_profile.id,
            data
        )
        return jsonify(feedback)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@api_bp.route('/mentors/<int:mentor_id>/feedbacks', methods=['GET'])
def get_mentor_feedbacks(mentor_id):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    result = FeedbackService.get_mentor_feedbacks(mentor_id, page, per_page)
    return jsonify(result)
