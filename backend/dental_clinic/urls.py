from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.jwt')),
    path('api/users/', include('users.urls')),
    path('api/leads/', include('leads.urls')),
    path('api/consultations/', include('consultations.urls')),
    path('api/contracts/', include('contracts.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/common/', include('common.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
