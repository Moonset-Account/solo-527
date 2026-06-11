from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="CS AI Workbench API",
        default_version='v1',
        description="CS AI工作台后端API文档",
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="contact@example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/conversations/', include('apps.conversations.urls')),
    path('api/prompts/', include('apps.prompts.urls')),
    path('api/reviews/', include('apps.reviews.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/ai/', include('apps.ai_service.urls')),
    path('api/risks/', include('apps.risks.urls')),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
