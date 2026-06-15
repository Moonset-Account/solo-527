from django.urls import path
from .views import (
    SalesFunnelView, LeadSourceReportView, SalesPerformanceView,
    TimeoutReportView, TrendReportView, ResponseNodeReportView,
    OperationLogReportView
)

urlpatterns = [
    path('sales-funnel/', SalesFunnelView.as_view(), name='sales-funnel'),
    path('lead-source/', LeadSourceReportView.as_view(), name='lead-source'),
    path('sales-performance/', SalesPerformanceView.as_view(), name='sales-performance'),
    path('timeout/', TimeoutReportView.as_view(), name='timeout-report'),
    path('trend/', TrendReportView.as_view(), name='trend-report'),
    path('response-node/', ResponseNodeReportView.as_view(), name='response-node'),
    path('operation-logs/', OperationLogReportView.as_view(), name='operation-logs-report'),
]
