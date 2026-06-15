from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ContractStatusViewSet, ContractViewSet,
    ContractAttachmentViewSet, ApprovalRecordViewSet, PaymentRecordViewSet
)

router = DefaultRouter()
router.register(r'statuses', ContractStatusViewSet)
router.register(r'attachments', ContractAttachmentViewSet)
router.register(r'approvals', ApprovalRecordViewSet)
router.register(r'payments', PaymentRecordViewSet)
router.register(r'', ContractViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
