from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AlertViewSet, AlertRecordViewSet, AlertAttachmentViewSet

router = DefaultRouter()
router.register(r'', AlertViewSet, basename='alert')
router.register(r'records', AlertRecordViewSet)
router.register(r'attachments', AlertAttachmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
