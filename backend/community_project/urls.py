from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="社区议题任务派发系统 API",
        default_version='v1',
        description="居民代表议题任务派发系统接口文档",
        terms_of_service="https://www.example.com/policies/terms/",
        contact=openapi.Contact(email="contact@example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

api_v1_patterns = [
    path('auth/', include('users.urls')),
    path('residents/', include('residents.urls')),
    path('topics/', include('topics.urls')),
    path('voting/', include('voting.urls')),
    path('patrol/', include('patrol.urls')),
    path('assistance/', include('assistance.urls')),
    path('tasks/', include('tasks.urls')),
    path('volunteers/', include('volunteers.urls')),
    path('notifications/', include('notifications.urls')),
    path('common/', include('common.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(api_v1_patterns)),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
