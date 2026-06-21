from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.FrameworkContractViewSet, basename='contract')
router.register(r'prices', views.ContractPriceViewSet, basename='contract-price')
router.register(r'price-histories', views.PriceHistoryViewSet, basename='price-history')
router.register(r'renewals', views.ContractRenewalViewSet, basename='contract-renewal')

urlpatterns = [
    path('', include(router.urls)),
]
