from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InspectionTemplateViewSet, InspectionItemViewSet,
    InspectionTaskViewSet, InspectionResultViewSet
)

router = DefaultRouter()
router.register(r'templates', InspectionTemplateViewSet)
router.register(r'items', InspectionItemViewSet)
router.register(r'tasks', InspectionTaskViewSet)
router.register(r'results', InspectionResultViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
