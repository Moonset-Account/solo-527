from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def api_root(request):
    return Response({
        'message': '诊所复诊预约系统 API',
        'endpoints': {
            'patients': '/api/patients/',
            'doctors': '/api/doctors/',
            'appointments': '/api/appointments/',
            'medical': '/api/medical/',
            'notifications': '/api/notifications/',
            'reports': '/api/reports/',
            'admin': '/admin/',
        },
        'auth': {
            'login': '/api-auth/login/',
            'logout': '/api-auth/logout/',
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path('api/', api_root, name='api-root'),
    path('api/patients/', include('patients.urls')),
    path('api/doctors/', include('doctors.urls')),
    path('api/appointments/', include('appointments.urls')),
    path('api/medical/', include('medical_records.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/reports/', include('reports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
