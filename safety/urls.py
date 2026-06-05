from django.urls import path
from . import views

app_name = 'safety'

urlpatterns = [
    path('incidents/', views.incident_list, name='incident_list'),
    path('incidents/create/', views.incident_create, name='incident_create'),
    path('incidents/<uuid:pk>/', views.incident_detail, name='incident_detail'),
    path('incidents/<uuid:pk>/update-status/', views.incident_update_status, name='incident_update_status'),
    path('incidents/<uuid:pk>/attach/', views.incident_add_attachment, name='incident_add_attachment'),
    path('inspections/', views.inspection_list, name='inspection_list'),
    path('inspections/<uuid:pk>/', views.inspection_detail, name='inspection_detail'),
    path('inspections/<uuid:pk>/complete/', views.inspection_complete, name='inspection_complete'),
    path('training/', views.training_record_list, name='training_record_list'),
]
