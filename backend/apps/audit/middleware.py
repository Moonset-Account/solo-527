from django.utils.deprecation import MiddlewareMixin
from django.utils.timezone import now
from django.contrib.contenttypes.models import ContentType
from .models import AuditLog, OperationType
import json


class AuditLogMiddleware(MiddlewareMixin):
    SENSITIVE_FIELDS = {'password', 'token', 'secret', 'key'}

    def process_request(self, request):
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            request._audit_body = self._get_safe_body(request)

    def process_response(self, request, response):
        try:
            if not request.user.is_authenticated:
                return response

            operation = self._detect_operation(request, response)
            if not operation:
                return response

            module = self._detect_module(request)
            if not module:
                return response

            description = self._build_description(request, operation, response)

            AuditLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                username=request.user.username if request.user.is_authenticated else '',
                operation=operation,
                module=module,
                description=description,
                old_data=getattr(request, '_audit_old_data', None),
                new_data=getattr(request, '_audit_body', None) if operation in ['create', 'update'] else None,
                ip_address=self._get_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
            )
        except Exception:
            pass
        return response

    def _get_safe_body(self, request):
        try:
            body = json.loads(request.body) if request.body else {}
            return {k: v for k, v in body.items() if k.lower() not in self.SENSITIVE_FIELDS}
        except (json.JSONDecodeError, UnicodeDecodeError):
            return None

    def _get_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')

    def _detect_operation(self, request, response):
        method = request.method
        path = request.path
        status_code = response.status_code

        if status_code >= 400:
            return None

        if '/api/auth/login' in path:
            return OperationType.LOGIN if status_code < 300 else None
        if '/api/auth/logout' in path:
            return OperationType.LOGOUT
        if 'export' in path.lower():
            return OperationType.EXPORT

        if method == 'POST':
            if 'verify' in path or 'approve' in path:
                return OperationType.APPROVE
            if 'assign' in path:
                return OperationType.ASSIGN
            if 'complete' in path:
                return OperationType.COMPLETE
            if 'notify' in path:
                return OperationType.NOTIFY
            if status_code == 201 or status_code < 300:
                return OperationType.CREATE
        elif method in ['PUT', 'PATCH']:
            return OperationType.UPDATE
        elif method == 'DELETE':
            return OperationType.DELETE

        return None

    def _detect_module(self, request):
        path = request.path
        modules = {
            '/api/repairs': '报修管理',
            '/api/notifications': '消息通知',
            '/api/users': '用户管理',
            '/api/audit': '审计日志',
            '/api/rooms': '自习室管理',
            '/api/auth': '认证',
            '/admin': '后台管理',
        }
        for key, value in modules.items():
            if key in path:
                return value
        return '其他'

    def _build_description(self, request, operation, response):
        parts = [f'{request.method} {request.path}']
        if operation == OperationType.LOGIN:
            parts.append(f'用户 {request.user} 登录')
        elif operation == OperationType.LOGOUT:
            parts.append(f'用户 {request.user} 登出')
        return ' | '.join(parts)
