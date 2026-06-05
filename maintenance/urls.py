from django.urls import path
from . import views

app_name = 'maintenance'

urlpatterns = [
    path('', views.ticket_list, name='ticket_list'),
    path('create/', views.ticket_create, name='ticket_create'),
    path('<uuid:pk>/', views.ticket_detail, name='ticket_detail'),
    path('<uuid:pk>/update-status/', views.ticket_update_status, name='ticket_update_status'),
    path('<uuid:pk>/assign/', views.ticket_assign, name='ticket_assign'),
    path('<uuid:pk>/comment/', views.ticket_add_comment, name='ticket_add_comment'),
    path('<uuid:pk>/attach/', views.ticket_add_attachment, name='ticket_add_attachment'),
    path('schedules/', views.schedule_list, name='schedule_list'),
    path('schedules/<uuid:pk>/', views.schedule_detail, name='schedule_detail'),
    path('schedules/<uuid:pk>/complete/', views.schedule_complete, name='schedule_complete'),
]
