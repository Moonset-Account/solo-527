from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RepairRecordViewSet, RepairPhotoViewSet

router = DefaultRouter()
router.register(r'records', RepairRecordViewSet)
router.register(r'photos', RepairPhotoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
