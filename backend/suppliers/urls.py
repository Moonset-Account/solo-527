from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.SupplierViewSet, basename='supplier')
router.register(r'risks', views.SupplierRiskViewSet, basename='supplier-risk')
router.register(r'risk-evidences', views.SupplierRiskEvidenceViewSet, basename='risk-evidence')
router.register(r'evaluations', views.SupplierEvaluationViewSet, basename='supplier-evaluation')

urlpatterns = [
    path('', include(router.urls)),
]
