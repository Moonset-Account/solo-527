from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepositViewSet, DepositTransactionViewSet, DepositAppealViewSet

router = DefaultRouter()
router.register(r'accounts', DepositViewSet)
router.register(r'transactions', DepositTransactionViewSet)
router.register(r'appeals', DepositAppealViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
