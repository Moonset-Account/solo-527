from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MedicalRecordPermissionViewSet, MedicalSummaryViewSet,
    FollowUpRecordViewSet, PrescriptionViewSet
)

router = DefaultRouter()
router.register(r'permissions', MedicalRecordPermissionViewSet, basename='record-permission')
router.register(r'summaries', MedicalSummaryViewSet, basename='medical-summary')
router.register(r'followup-records', FollowUpRecordViewSet, basename='followup-record')
router.register(r'prescriptions', PrescriptionViewSet, basename='prescription')

app_name = 'medical_records'

urlpatterns = [
    path('', include(router.urls)),
]
