from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
from flask_mail import Mail
from config import config

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()
migrate = Migrate()
mail = Mail()

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})
    migrate.init_app(app, db)
    mail.init_app(app)
    
    from app.middlewares.auth import auth_middleware
    app.before_request(auth_middleware)
    
    from app.api import create_api_blueprint
    api_bp = create_api_blueprint()
    app.register_blueprint(api_bp, url_prefix='/api')
    
    from app.errors import register_error_handlers
    register_error_handlers(app)
    
    try:
        from app.tasks import make_celery, init_celery_tasks
        celery = make_celery(app)
        init_celery_tasks(celery, app, db, mail)
        app.celery = celery
    except Exception as e:
        app.logger.warning(f"Celery initialization skipped: {e}")
        app.celery = None
    
    @app.route('/health')
    def health_check():
        return {'status': 'ok', 'message': 'Alumni Mentor Platform API is running'}
    
    return app
