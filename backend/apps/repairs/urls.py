from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import RepairViewSet, RepairPhotoViewSet, RepairNoteViewSet

router = DefaultRouter()
router.register(r'', RepairViewSet, basename='repair')
router.register(r'photos', RepairPhotoViewSet, basename='repair-photo')
router.register(r'notes', RepairNoteViewSet, basename='repair-note')

urlpatterns = [
    path('', include(router.urls)),
]
