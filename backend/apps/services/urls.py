from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ServiceCategoryViewSet,
    ServiceItemViewSet,
    TestDriveSlotViewSet,
    ServiceRecordViewSet
)

router = DefaultRouter()
router.register(r'categories', ServiceCategoryViewSet, basename='servicecategory')
router.register(r'items', ServiceItemViewSet, basename='serviceitem')
router.register(r'test-drive-slots', TestDriveSlotViewSet, basename='testdriveslot')
router.register(r'records', ServiceRecordViewSet, basename='servicerecord')

urlpatterns = [
    path('', include(router.urls)),
]
