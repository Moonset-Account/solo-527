from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepositAccountViewSet, DepositTransactionViewSet

router = DefaultRouter()
router.register(r'accounts', DepositAccountViewSet)
router.register(r'transactions', DepositTransactionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
