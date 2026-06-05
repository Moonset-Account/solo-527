from flask import jsonify
from werkzeug.exceptions import HTTPException
from app import db
from models import ErrorLog
import traceback
import sys

def register_error_handlers(app):
    
    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        response = {
            'error': e.name,
            'message': e.description,
            'status_code': e.code
        }
        return jsonify(response), e.code
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        if isinstance(e, HTTPException):
            return handle_http_exception(e)
        
        exc_type, exc_value, exc_traceback = sys.exc_info()
        tb_str = ''.join(traceback.format_exception(exc_type, exc_value, exc_traceback))
        
        try:
            from flask import request
            error_log = ErrorLog(
                level='critical',
                message=str(e),
                traceback=tb_str,
                path=request.path if request else None,
                method=request.method if request else None,
                ip_address=request.remote_addr if request else None,
                user_agent=request.user_agent.string if request and request.user_agent else None
            )
            db.session.add(error_log)
            db.session.commit()
        except:
            pass
        
        app.logger.error(f"Unhandled exception: {str(e)}\n{tb_str}")
        
        response = {
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred',
            'status_code': 500
        }
        return jsonify(response), 500


class ApiError(Exception):
    def __init__(self, message, status_code=400, errors=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.errors = errors or {}
    
    def to_dict(self):
        return {
            'error': self.__class__.__name__,
            'message': self.message,
            'errors': self.errors,
            'status_code': self.status_code
        }


class ValidationError(ApiError):
    def __init__(self, message='Validation failed', errors=None):
        super().__init__(message, 400, errors)


class AuthorizationError(ApiError):
    def __init__(self, message='Not authorized'):
        super().__init__(message, 403)


class NotFoundError(ApiError):
    def __init__(self, message='Resource not found'):
        super().__init__(message, 404)


class ConflictError(ApiError):
    def __init__(self, message='Resource conflict'):
        super().__init__(message, 409)
