from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.inventory.views import (
    InventoryConflictViewSet,
    InventoryViewSet,
    SpecialPricingViewSet,
)

router = DefaultRouter()
router.register(r'calendar', InventoryViewSet, basename='inventory-calendar')
router.register(r'conflicts', InventoryConflictViewSet, basename='inventory-conflict')
router.register(r'pricing', SpecialPricingViewSet, basename='special-pricing')

urlpatterns = [
    path('', include(router.urls)),
]
