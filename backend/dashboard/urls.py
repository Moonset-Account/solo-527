from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'widgets', views.DashboardWidgetViewSet, basename='dashboard-widget')
router.register(r'operation-logs', views.OperationLogViewSet, basename='operation-log')

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', views.dashboard_stats, name='dashboard-stats'),
    path('price-fluctuation/', views.price_fluctuation_data, name='price-fluctuation'),
]
