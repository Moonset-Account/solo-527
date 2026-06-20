import time
import json
from django.utils.deprecation import MiddlewareMixin
from .models import AuditLog


class AuditLogMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request._audit_start_time = time.time()
        try:
            request._audit_body = request.body.decode('utf-8')[:2000]
        except Exception:
            request._audit_body = ''

    def process_response(self, request, response):
        if not request.path.startswith('/api/') or request.path.startswith('/api/schema/'):
            return response
        try:
            start_time = getattr(request, '_audit_start_time', time.time())
            duration_ms = int((time.time() - start_time) * 1000)
            user = request.user if request.user.is_authenticated else None
            method = request.method
            path = request.path
            status_code = response.status_code
            action = self._get_action(method, path)
            resource_type, resource_id = self._parse_resource(path)
            response_data = ''
            if hasattr(response, 'data'):
                try:
                    response_data = json.dumps(response.data, ensure_ascii=False)[:2000]
                except Exception:
                    pass
            AuditLog.objects.create(
                organization=user.organization if user else None,
                user=user,
                username=user.username if user else '',
                action=action,
                resource_type=resource_type,
                resource_id=str(resource_id) if resource_id else '',
                method=method,
                path=path,
                ip_address=self._get_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                status_code=status_code,
                request_data=getattr(request, '_audit_body', ''),
                response_data=response_data,
                detail=f'{method} {path}',
                is_success=200 <= status_code < 400,
                duration_ms=duration_ms
            )
        except Exception:
            pass
        return response

    def _get_action(self, method, path):
        if '/login' in path:
            return AuditLog.ACTION_LOGIN
        if '/logout' in path:
            return AuditLog.ACTION_LOGOUT
        action_map = {
            'POST': AuditLog.ACTION_CREATE,
            'PUT': AuditLog.ACTION_UPDATE,
            'PATCH': AuditLog.ACTION_UPDATE,
            'DELETE': AuditLog.ACTION_DELETE,
        }
        return action_map.get(method, AuditLog.ACTION_CUSTOM)

    def _parse_resource(self, path):
        parts = [p for p in path.split('/') if p]
        resource_type = ''
        resource_id = None
        if len(parts) >= 3:
            resource_type = parts[2]
        if len(parts) >= 4 and parts[3].isdigit():
            resource_id = parts[3]
        return resource_type, resource_id

    def _get_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
