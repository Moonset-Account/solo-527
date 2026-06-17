from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    QualityCheckViewSet, ImprovementActionViewSet,
    ExportRecordViewSet, service_tickets, check_duplicate_export
)

router = DefaultRouter()
router.register(r'quality-checks', QualityCheckViewSet, basename='qualitycheck')
router.register(r'improvement-actions', ImprovementActionViewSet, basename='improvementaction')
router.register(r'export-records', ExportRecordViewSet, basename='exportrecord')

urlpatterns = [
    path('', include(router.urls)),
    path('service-tickets/', service_tickets, name='service-tickets'),
    path('exports/check-duplicate/', check_duplicate_export, name='check-duplicate-export'),
]
