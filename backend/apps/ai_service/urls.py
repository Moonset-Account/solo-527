from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AIModelViewSet,
    APIConfigViewSet,
    AILogViewSet,
    ChatViewSet,
    HealthCheckView,
    RiskDetectView,
)

router = DefaultRouter()
router.register(r'models', AIModelViewSet, basename='ai-model')
router.register(r'configs', APIConfigViewSet, basename='api-config')
router.register(r'logs', AILogViewSet, basename='ai-log')
router.register(r'chat', ChatViewSet, basename='chat')

urlpatterns = [
    path('', include(router.urls)),
    path('health/', HealthCheckView.as_view(), name='ai-health-check'),
    path('risk-detect/', RiskDetectView.as_view(), name='risk-detect'),
]
