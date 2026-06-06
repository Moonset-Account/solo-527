import json
import logging
from django.utils.deprecation import MiddlewareMixin
from django.utils.timezone import now

logger = logging.getLogger(__name__)


class AuditLogMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request._audit_start_time = now()

    def process_response(self, request, response):
        if not hasattr(request, '_audit_start_time'):
            return response

        duration = (now() - request._audit_start_time).total_seconds()
        user = getattr(request, 'user', None)
        user_id = user.id if user and user.is_authenticated else None

        log_data = {
            'timestamp': now().isoformat(),
            'user_id': user_id,
            'method': request.method,
            'path': request.path,
            'ip': self._get_client_ip(request),
            'status_code': response.status_code,
            'duration_seconds': duration,
        }

        if request.method in ('POST', 'PUT', 'PATCH') and request.body:
            try:
                body = json.loads(request.body)
                sensitive_fields = ['password', 'token', 'secret']
                for field in sensitive_fields:
                    if field in body:
                        body[field] = '***'
                log_data['request_body'] = body
            except (json.JSONDecodeError, UnicodeDecodeError):
                log_data['request_body'] = '<non-json>'

        logger.info(json.dumps(log_data, ensure_ascii=False))
        return response

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '')


class RolePermissionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)
