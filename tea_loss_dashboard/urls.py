from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from analytics.views import (
    DashboardViewSet, 
    LossDetailViewSet, 
    upload_data, 
    import_tasks, 
    caliber_config,
    generate_report,
    report_tasks,
    export_loss_details
)

router = DefaultRouter()
router.register(r'api/v1/dashboard', DashboardViewSet, basename='dashboard')
router.register(r'api/v1/loss', LossDetailViewSet, basename='loss')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls')),
    path('', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
    path('api/v1/import/upload/', upload_data, name='import_upload'),
    path('api/v1/import/tasks/', import_tasks, name='import_tasks'),
    path('api/v1/config/caliber/', caliber_config, name='caliber_config'),
    path('api/v1/reports/generate/', generate_report, name='generate_report'),
    path('api/v1/reports/tasks/', report_tasks, name='report_tasks'),
    path('api/v1/reports/export-details/', export_loss_details, name='export_details'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
