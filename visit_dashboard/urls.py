from django.urls import path
from visit_dashboard import views

app_name = 'visit_dashboard'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('api/overview/', views.api_overview, name='api_overview'),
    path('api/low-score/', views.api_low_score_detail, name='api_low_score_detail'),
    path('api/secondary-complaint/', views.api_secondary_complaint_detail, name='api_secondary_complaint_detail'),
    path('api/dimension-compare/', views.api_dimension_compare, name='api_dimension_compare'),
    path('api/satisfaction-trend/', views.api_satisfaction_trend, name='api_satisfaction_trend'),
    path('api/refund-status/', views.api_refund_status, name='api_refund_status'),
    path('api/recording-tags/', views.api_recording_tags, name='api_recording_tags'),
    path('api/report/create/', views.api_create_report, name='api_create_report'),
    path('api/report/<int:report_id>/status/', views.api_report_status, name='api_report_status'),
    path('api/metric-config/', views.api_metric_config_list, name='api_metric_config_list'),
    path('api/metric-config/create/', views.api_metric_config_create, name='api_metric_config_create'),
    path('api/annotation/create/', views.api_annotation_create, name='api_annotation_create'),
]
