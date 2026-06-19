from django.urls import path
from .views import DataExportView, environment_info

urlpatterns = [
    path('export/', DataExportView, name='data-export'),
    path('environment/', environment_info, name='environment-info'),
]
