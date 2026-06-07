from flask import Flask
from flask_cors import CORS
from backend.api.routes import api_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object("backend.config")
    CORS(app)
    app.register_blueprint(api_bp, url_prefix="/api")
    return app
