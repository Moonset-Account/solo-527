from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    MaterialViewSet, MaterialUsageViewSet, MaterialPurchaseViewSet,
    MaterialListViewSet, MaterialListItemViewSet
)

router = DefaultRouter()
router.register(r'', MaterialViewSet, basename='material')
router.register(r'usages', MaterialUsageViewSet, basename='material-usage')
router.register(r'purchases', MaterialPurchaseViewSet, basename='material-purchase')
router.register(r'lists', MaterialListViewSet, basename='material-list')
router.register(r'list-items', MaterialListItemViewSet, basename='material-list-item')

urlpatterns = [
    path('', include(router.urls)),
]
