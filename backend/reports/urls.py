from django.urls import path
from . import views

urlpatterns = [
    path('overdue/', views.OverdueView.as_view(), name='report-overdue'),
    path('mismatches/', views.MismatchView.as_view(), name='report-mismatches'),
    path('last-actions/', views.LastActionView.as_view(), name='report-last-actions'),
    path('overdue/export/', views.OverdueExportView.as_view(), name='report-overdue-export'),
    path('mismatches/export/', views.MismatchExportView.as_view(), name='report-mismatch-export'),
]
