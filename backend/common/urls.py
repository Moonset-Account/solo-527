from django.urls import path
from .views import DataExportView, environment_info, statistics_view

urlpatterns = [
    path('export/', DataExportView, name='data-export'),
    path('environment/', environment_info, name='environment-info'),
    path('statistics/', statistics_view, name='statistics-view'),
]
