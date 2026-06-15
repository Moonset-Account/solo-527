from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    PaymentOrderViewSet,
    PaymentTransactionViewSet,
    CashierShiftViewSet
)

router = DefaultRouter()
router.register(r'orders', PaymentOrderViewSet, basename='paymentorder')
router.register(r'transactions', PaymentTransactionViewSet, basename='paymenttransaction')
router.register(r'shifts', CashierShiftViewSet, basename='cashiershift')

urlpatterns = [
    path('', include(router.urls)),
]
