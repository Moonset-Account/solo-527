from django.urls import path
from . import views

urlpatterns = [
    path('', views.calendar_view, name='calendar'),
    path('day/<int:year>/<int:month>/<int:day>/', views.day_detail_view, name='day_detail'),
    path('notifications/', views.notifications_view, name='notifications'),
    path('notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('export/unreturned/', views.export_unreturned_excel, name='export_unreturned'),
    path('export/inventory/', views.export_inventory_excel, name='export_inventory'),
    path('dashboard/', views.dashboard_redirect, name='dashboard'),
]
