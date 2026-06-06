from flask import jsonify
from werkzeug.exceptions import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

class APIError(Exception):
    def __init__(self, message, code=400, data=None):
        self.message = message
        self.code = code
        self.data = data
        super().__init__(message)

def register_error_handlers(app):
    @app.errorhandler(APIError)
    def handle_api_error(e):
        response = {
            'code': e.code,
            'message': e.message
        }
        if e.data:
            response['data'] = e.data
        return jsonify(response), e.code if e.code < 600 else 400
    
    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        return jsonify({
            'code': e.code,
            'message': e.description
        }), e.code
    
    @app.errorhandler(IntegrityError)
    def handle_integrity_error(e):
        return jsonify({
            'code': 400,
            'message': '数据完整性错误，可能是重复数据或关联数据不存在'
        }), 400
    
    @app.errorhandler(SQLAlchemyError)
    def handle_sqlalchemy_error(e):
        return jsonify({
            'code': 500,
            'message': '数据库操作失败'
        }), 500
    
    @app.errorhandler(Exception)
    def handle_generic_error(e):
        app.logger.error(f'Unhandled exception: {str(e)}')
        return jsonify({
            'code': 500,
            'message': '服务器内部错误'
        }), 500
