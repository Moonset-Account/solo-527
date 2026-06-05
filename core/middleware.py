import json
from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin


class OfflineSyncMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.method == 'POST' and request.path.startswith('/api/offline/sync/'):
            try:
                data = json.loads(request.body)
                request.offline_data = data.get('pending_operations', [])
            except (json.JSONDecodeError, KeyError):
                request.offline_data = []
        return None

    def process_response(self, request, response):
        if hasattr(request, 'offline_sync_results'):
            response['X-Offline-Sync'] = json.dumps(request.offline_sync_results)
        return response
