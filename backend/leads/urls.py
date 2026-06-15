from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LeadSourceViewSet, LeadStatusViewSet, CustomerViewSet,
    LeadViewSet, FollowupRecordViewSet, TimeoutRecordViewSet
)

router = DefaultRouter()
router.register(r'sources', LeadSourceViewSet)
router.register(r'statuses', LeadStatusViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'', LeadViewSet)
router.register(r'followups', FollowupRecordViewSet)
router.register(r'timeouts', TimeoutRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
