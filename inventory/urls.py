from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SupplyCategoryViewSet, SupplyViewSet, BatchViewSet,
    ScanRecordViewSet, StockWarningViewSet
)

router = DefaultRouter()
router.register(r'categories', SupplyCategoryViewSet)
router.register(r'supplies', SupplyViewSet)
router.register(r'batches', BatchViewSet)
router.register(r'scans', ScanRecordViewSet)
router.register(r'warnings', StockWarningViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
