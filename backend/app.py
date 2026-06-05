from flask import Flask
from flask_cors import CORS
from config import Config
import os
from extensions import db, jwt

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['LOG_FOLDER'], exist_ok=True)
    
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    jwt.init_app(app)
    
    from models import User
    @jwt.user_identity_loader
    def user_identity_lookup(user):
        return user.id if isinstance(user, User) else user
    
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        return User.query.get(int(identity))
    
    from api.auth import auth_bp
    from api.films import films_bp
    from api.halls import halls_bp
    from api.members import members_bp
    from api.screenings import screenings_bp
    from api.bookings import bookings_bp
    from api.guests import guests_bp
    from api.reports import reports_bp
    from api.import_export import ie_bp
    from api.logs import logs_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(films_bp, url_prefix='/api/films')
    app.register_blueprint(halls_bp, url_prefix='/api/halls')
    app.register_blueprint(members_bp, url_prefix='/api/members')
    app.register_blueprint(screenings_bp, url_prefix='/api/screenings')
    app.register_blueprint(bookings_bp, url_prefix='/api/bookings')
    app.register_blueprint(guests_bp, url_prefix='/api/guests')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(ie_bp, url_prefix='/api/ie')
    app.register_blueprint(logs_bp, url_prefix='/api/logs')
    
    from utils.error_handler import register_error_handlers
    register_error_handlers(app)
    
    from utils.logger import setup_logger
    setup_logger(app)
    
    with app.app_context():
        db.create_all()
        from utils.seed_data import seed_database
        seed_database()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
