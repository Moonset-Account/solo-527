from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ConversionFunnelViewSet,
    ConversionReportViewSet,
    ConversionReminderViewSet,
    StorePerformanceViewSet
)

router = DefaultRouter()
router.register(r'funnels', ConversionFunnelViewSet)
router.register(r'reports', ConversionReportViewSet)
router.register(r'reminders', ConversionReminderViewSet)
router.register(r'performance', StorePerformanceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
