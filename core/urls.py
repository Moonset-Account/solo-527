from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.home, name='home'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('login/', auth_views.LoginView.as_view(template_name='core/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('profile/', views.profile, name='profile'),
    path('profile/edit/', views.profile_edit, name='profile_edit'),
    path('scan/', views.scan_qr, name='scan_qr'),
    path('scan/result/', views.scan_qr_result, name='scan_qr_result'),
    path('history/', views.history, name='history'),
    path('offline/sync/', views.offline_sync, name='offline_sync'),
    path('notifications/', views.notifications_list, name='notifications'),
    path('notifications/mark-read/<uuid:pk>/', views.notification_mark_read, name='notification_mark_read'),
    path('notifications/mark-all-read/', views.notification_mark_all_read, name='notification_mark_all_read'),
]
