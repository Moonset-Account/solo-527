from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConsultationRecordViewSet, ConsultationAttachmentViewSet,
    TreatmentItemViewSet
)

router = DefaultRouter()
router.register(r'treatment-items', TreatmentItemViewSet)
router.register(r'attachments', ConsultationAttachmentViewSet)
router.register(r'', ConsultationRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
