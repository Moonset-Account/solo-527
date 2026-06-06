from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from core.views import (
    DashboardOverviewView, DashboardPickupTrendView,
    DashboardClassUtilizationView, DashboardStatusBreakdownView
)

urlpatterns = [
    path('api/dashboard/overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),
    path('api/dashboard/pickup-trend/', DashboardPickupTrendView.as_view(), name='dashboard-pickup-trend'),
    path('api/dashboard/class-utilization/', DashboardClassUtilizationView.as_view(), name='dashboard-class-utilization'),
    path('api/dashboard/status-breakdown/', DashboardStatusBreakdownView.as_view(), name='dashboard-status-breakdown'),

    path('admin/', admin.site.urls),
    path('api/auth/', include('knox.urls')),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/children/', include('apps.children.urls')),
    path('api/pickup/', include('apps.pickup.urls')),
    path('api/daily-records/', include('apps.daily_records.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/leave/', include('apps.leave.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
