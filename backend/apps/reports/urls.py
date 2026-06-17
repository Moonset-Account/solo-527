from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReportTemplateViewSet, ReportScheduleViewSet,
    ReportInstanceViewSet, DashboardWidgetViewSet,
    duration_stats, result_stats, trend_stats
)

router = DefaultRouter()
router.register(r'templates', ReportTemplateViewSet, basename='reporttemplate')
router.register(r'schedules', ReportScheduleViewSet, basename='reportschedule')
router.register(r'instances', ReportInstanceViewSet, basename='reportinstance')
router.register(r'dashboard-widgets', DashboardWidgetViewSet, basename='dashboardwidget')

urlpatterns = [
    path('', include(router.urls)),
    path('duration/', duration_stats, name='duration-stats'),
    path('results/', result_stats, name='result-stats'),
    path('trends/', trend_stats, name='trend-stats'),
]
