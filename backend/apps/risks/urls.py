from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RiskSampleViewSet, RiskRuleViewSet

router = DefaultRouter()
router.register(r'samples', RiskSampleViewSet, basename='risk-sample')
router.register(r'rules', RiskRuleViewSet, basename='risk-rule')

urlpatterns = [
    path('', include(router.urls)),
]
