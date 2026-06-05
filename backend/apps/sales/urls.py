from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SaleOrderViewSet, DailySalesReportViewSet,
    BookSalesRankViewSet, SalesDashboardViewSet
)

router = DefaultRouter()
router.register('orders', SaleOrderViewSet, basename='sale-order')
router.register('reports', DailySalesReportViewSet, basename='sales-report')
router.register('ranks', BookSalesRankViewSet, basename='book-sales-rank')
router.register('dashboard', SalesDashboardViewSet, basename='sales-dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
