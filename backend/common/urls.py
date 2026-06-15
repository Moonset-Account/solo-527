from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OperationLogViewSet, SystemConfigViewSet, PublicSeaRuleViewSet

router = DefaultRouter()
router.register(r'operation-logs', OperationLogViewSet)
router.register(r'system-configs', SystemConfigViewSet)
router.register(r'public-sea-rules', PublicSeaRuleViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
