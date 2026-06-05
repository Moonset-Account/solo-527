from flask import Blueprint

def create_api_blueprint():
    api_bp = Blueprint('api', __name__)
    
    from app.api.auth import register_routes as register_auth_routes
    from app.api.users import register_routes as register_users_routes
    from app.api.mentors import register_routes as register_mentors_routes
    from app.api.students import register_routes as register_students_routes
    from app.api.appointments import register_routes as register_appointments_routes
    from app.api.feedback import register_routes as register_feedback_routes
    from app.api.industries import register_routes as register_industries_routes
    from app.api.notifications import register_routes as register_notifications_routes
    from app.api.dashboard import register_routes as register_dashboard_routes
    from app.api.uploads import register_routes as register_uploads_routes
    from app.api.audit import register_routes as register_audit_routes
    
    register_auth_routes(api_bp)
    register_users_routes(api_bp)
    register_mentors_routes(api_bp)
    register_students_routes(api_bp)
    register_appointments_routes(api_bp)
    register_feedback_routes(api_bp)
    register_industries_routes(api_bp)
    register_notifications_routes(api_bp)
    register_dashboard_routes(api_bp)
    register_uploads_routes(api_bp)
    register_audit_routes(api_bp)
    
    return api_bp
