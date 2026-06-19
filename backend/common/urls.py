from django.urls import path
from .views import DataExportView

urlpatterns = [
    path('export/', DataExportView, name='data-export'),
]
