from django.conf import settings
from django.http import JsonResponse


class EnvironmentMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if settings.IS_PRODUCTION:
            request.META['X-Environment'] = 'production'
        else:
            request.META['X-Environment'] = 'development'

        response = self.get_response(request)
        response['X-Environment'] = request.META.get('X-Environment', 'development')
        return response
