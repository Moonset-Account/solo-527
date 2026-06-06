from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentItemViewSet, InvoiceViewSet, PaymentRecordViewSet

router = DefaultRouter()
router.register('items', PaymentItemViewSet)
router.register('invoices', InvoiceViewSet)
router.register('records', PaymentRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
