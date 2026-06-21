from django.urls import path, include
from rest_framework.routers import SimpleRouter
from . import views

supplier_router = SimpleRouter()
supplier_router.register(r'', views.SupplierViewSet, basename='supplier')

risk_router = SimpleRouter()
risk_router.register(r'', views.SupplierRiskViewSet, basename='supplier-risk')

evidence_router = SimpleRouter()
evidence_router.register(r'', views.SupplierRiskEvidenceViewSet, basename='risk-evidence')

eval_router = SimpleRouter()
eval_router.register(r'', views.SupplierEvaluationViewSet, basename='supplier-evaluation')

urlpatterns = [
    path('risks/', include(risk_router.urls)),
    path('risk-evidences/', include(evidence_router.urls)),
    path('evaluations/', include(eval_router.urls)),
    path('', include(supplier_router.urls)),
]
