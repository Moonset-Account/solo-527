from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import InspectionViewSet, InspectionItemViewSet, InspectionPhotoViewSet

router = DefaultRouter()
router.register(r'', InspectionViewSet, basename='inspection')
router.register(r'items', InspectionItemViewSet, basename='inspection-item')
router.register(r'photos', InspectionPhotoViewSet, basename='inspection-photo')

urlpatterns = [
    path('', include(router.urls)),
]
