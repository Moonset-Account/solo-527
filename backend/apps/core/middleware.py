import logging
import traceback
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from .models import SystemLog

logger = logging.getLogger('apps')


class ErrorLoggingMiddleware(MiddlewareMixin):
    def process_exception(self, request, exception):
        error_msg = f'{type(exception).__name__}: {str(exception)}'
        stack_trace = traceback.format_exc()
        
        SystemLog.objects.create(
            log_type=SystemLog.LOG_TYPE_ERROR,
            user=request.user if request.user.is_authenticated else None,
            action=request.path,
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            error_message=f'{error_msg}\n{stack_trace}'
        )
        
        logger.error(f'Error on {request.path}: {error_msg}', exc_info=True)
        
        return JsonResponse({
            'error': '服务器内部错误',
            'detail': str(exception) if settings.DEBUG else '请联系管理员'
        }, status=500)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')
