from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'reconciliations', views.ReconciliationViewSet, basename='reconciliation')

urlpatterns = router.urls
