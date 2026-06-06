from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SurgicalTemplateViewSet, TemplateSupplyItemViewSet,
    OperationScheduleViewSet, PreparedItemViewSet,
    UsageRecordViewSet, ReturnRecordViewSet, HighValueAuditViewSet
)

router = DefaultRouter()
router.register(r'templates', SurgicalTemplateViewSet)
router.register(r'template-items', TemplateSupplyItemViewSet)
router.register(r'schedules', OperationScheduleViewSet)
router.register(r'prepared-items', PreparedItemViewSet)
router.register(r'usage-records', UsageRecordViewSet)
router.register(r'return-records', ReturnRecordViewSet)
router.register(r'high-value-audits', HighValueAuditViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
