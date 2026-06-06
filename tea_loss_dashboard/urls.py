from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from analytics.views import DashboardViewSet, LossDetailViewSet

router = DefaultRouter()
router.register(r'api/v1/dashboard', DashboardViewSet, basename='dashboard')
router.register(r'api/v1/loss', LossDetailViewSet, basename='loss')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls')),
    path('', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
