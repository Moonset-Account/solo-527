from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    DashboardWidgetViewSet,
    DashboardLayoutViewSet,
    LayoutWidgetViewSet,
    AlertViewSet,
    dashboard_data
)

router = DefaultRouter()
router.register(r'widgets', DashboardWidgetViewSet)
router.register(r'layouts', DashboardLayoutViewSet)
router.register(r'layout-widgets', LayoutWidgetViewSet)
router.register(r'alerts', AlertViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('data/', dashboard_data, name='dashboard-data'),
]
