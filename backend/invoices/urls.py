from django.urls import path, include
from rest_framework.routers import SimpleRouter
from . import views

invoice_router = SimpleRouter()
invoice_router.register(r'', views.InvoiceViewSet, basename='invoice')

item_router = SimpleRouter()
item_router.register(r'', views.InvoiceItemViewSet, basename='invoice-item')

log_router = SimpleRouter()
log_router.register(r'', views.InvoiceStatusLogViewSet, basename='invoice-status-log')

urlpatterns = [
    path('items/', include(item_router.urls)),
    path('status-logs/', include(log_router.urls)),
    path('', include(invoice_router.urls)),
]
