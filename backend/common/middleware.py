import json
from django.utils.deprecation import MiddlewareMixin
from django.contrib.contenttypes.models import ContentType
from .models import OperationLog


class OperationLogMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE'] and request.user.is_authenticated:
            if hasattr(request, '_operation_log_data'):
                log_data = request._operation_log_data
                OperationLog.objects.create(
                    user=request.user,
                    action=log_data.get('action', 'other'),
                    content_type=log_data.get('content_type'),
                    object_id=log_data.get('object_id'),
                    description=log_data.get('description', ''),
                    old_values=log_data.get('old_values', {}),
                    new_values=log_data.get('new_values', {}),
                    ip_address=self.get_client_ip(request),
                )
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')
