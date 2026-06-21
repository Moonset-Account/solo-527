from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.InvoiceViewSet, basename='invoice')
router.register(r'items', views.InvoiceItemViewSet, basename='invoice-item')
router.register(r'status-logs', views.InvoiceStatusLogViewSet, basename='invoice-status-log')

urlpatterns = [
    path('', include(router.urls)),
]
