from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ProjectViewSet, ProjectPhotoViewSet, ProjectAttachmentViewSet, ChangeHistoryViewSet

router = DefaultRouter()
router.register(r'', ProjectViewSet, basename='project')
router.register(r'photos', ProjectPhotoViewSet, basename='project-photo')
router.register(r'attachments', ProjectAttachmentViewSet, basename='project-attachment')
router.register(r'history', ChangeHistoryViewSet, basename='change-history')

urlpatterns = [
    path('', include(router.urls)),
]
