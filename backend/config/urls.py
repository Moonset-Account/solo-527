from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/assets/', include('apps.assets.urls')),
    path('api/alerts/', include('apps.alerts.urls')),
    path('api/inspections/', include('apps.inspections.urls')),
    path('api/changes/', include('apps.changes.urls')),
    path('api/dictionaries/', include('apps.dictionaries.urls')),
    path('api/audits/', include('apps.audits.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
