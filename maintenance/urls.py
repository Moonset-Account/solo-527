from django.urls import path
from . import views

app_name = 'maintenance'

urlpatterns = [
    path('', views.ticket_list, name='ticket_list'),
    path('tickets/', views.ticket_list, name='ticket_list_tickets'),
    path('create/', views.ticket_create, name='ticket_create'),
    path('tickets/create/', views.ticket_create, name='ticket_create_tickets'),
    path('<uuid:pk>/', views.ticket_detail, name='ticket_detail'),
    path('tickets/<uuid:pk>/', views.ticket_detail, name='ticket_detail_tickets'),
    path('<uuid:pk>/update-status/', views.ticket_update_status, name='ticket_update_status'),
    path('tickets/<uuid:pk>/update-status/', views.ticket_update_status, name='ticket_update_status_tickets'),
    path('<uuid:pk>/assign/', views.ticket_assign, name='ticket_assign'),
    path('tickets/<uuid:pk>/assign/', views.ticket_assign, name='ticket_assign_tickets'),
    path('<uuid:pk>/comment/', views.ticket_add_comment, name='ticket_add_comment'),
    path('tickets/<uuid:pk>/comment/', views.ticket_add_comment, name='ticket_add_comment_tickets'),
    path('<uuid:pk>/attach/', views.ticket_add_attachment, name='ticket_add_attachment'),
    path('tickets/<uuid:pk>/attach/', views.ticket_add_attachment, name='ticket_add_attachment_tickets'),
    path('schedules/', views.schedule_list, name='schedule_list'),
    path('schedules/<uuid:pk>/', views.schedule_detail, name='schedule_detail'),
    path('schedules/<uuid:pk>/complete/', views.schedule_complete, name='schedule_complete'),
]
