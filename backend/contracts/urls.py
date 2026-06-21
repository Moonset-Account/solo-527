from django.urls import path, include
from rest_framework.routers import SimpleRouter
from . import views

contract_router = SimpleRouter()
contract_router.register(r'', views.FrameworkContractViewSet, basename='contract')

price_router = SimpleRouter()
price_router.register(r'', views.ContractPriceViewSet, basename='contract-price')

history_router = SimpleRouter()
history_router.register(r'', views.PriceHistoryViewSet, basename='price-history')

renewal_router = SimpleRouter()
renewal_router.register(r'', views.ContractRenewalViewSet, basename='contract-renewal')

urlpatterns = [
    path('prices/', include(price_router.urls)),
    path('price-histories/', include(history_router.urls)),
    path('renewals/', include(renewal_router.urls)),
    path('', include(contract_router.urls)),
]
