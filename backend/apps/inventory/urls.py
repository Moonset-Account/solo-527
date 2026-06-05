from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StockInViewSet, StockOutViewSet, StockLogViewSet

router = DefaultRouter()
router.register('stock-in', StockInViewSet, basename='stock-in')
router.register('stock-out', StockOutViewSet, basename='stock-out')
router.register('logs', StockLogViewSet, basename='stock-log')

urlpatterns = [
    path('', include(router.urls)),
]
