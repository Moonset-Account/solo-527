from django.urls import path
from . import views

app_name = 'training'

urlpatterns = [
    path('', views.course_list, name='course_list'),
    path('courses/<uuid:pk>/', views.course_detail, name='course_detail'),
    path('sessions/', views.session_list, name='session_list'),
    path('sessions/<uuid:pk>/', views.session_detail, name='session_detail'),
    path('sessions/<uuid:pk>/apply/', views.apply_session, name='apply_session'),
    path('applications/', views.application_list, name='application_list'),
    path('applications/<uuid:pk>/', views.application_detail, name='application_detail'),
    path('applications/<uuid:pk>/approve/', views.approve_application, name='approve_application'),
    path('applications/<uuid:pk>/reject/', views.reject_application, name='reject_application'),
    path('applications/<uuid:pk>/cancel/', views.cancel_application, name='cancel_application'),
    path('certifications/', views.certification_list, name='certification_list'),
    path('certifications/<uuid:pk>/', views.certification_detail, name='certification_detail'),
]
