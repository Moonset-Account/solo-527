from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('dashboard/', views.dashboard, name='dashboard_page'),
    path('details/', views.details, name='details'),
    path('data-management/', views.data_management, name='data_management'),
    path('reports/', views.reports, name='reports'),
    path('login/', views.login_view, name='login'),
]
