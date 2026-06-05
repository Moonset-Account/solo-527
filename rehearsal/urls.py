from django.urls import path
from . import views

app_name = 'rehearsal'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('calendar/', views.calendar_view, name='calendar'),
    path('api/calendar/events/', views.api_calendar_events, name='api_calendar_events'),
    path('api/check-conflict/', views.check_conflict_api, name='check_conflict'),
    path('rehearsals/', views.rehearsal_list, name='rehearsal_list'),
    path('rehearsals/<int:pk>/', views.rehearsal_detail, name='rehearsal_detail'),
    path('rehearsals/create/', views.rehearsal_create, name='rehearsal_create'),
    path('rehearsals/<int:pk>/edit/', views.rehearsal_edit, name='rehearsal_edit'),
    path('rehearsals/<int:pk>/cancel/', views.rehearsal_cancel, name='rehearsal_cancel'),
    path('rehearsals/<int:pk>/approve/', views.rehearsal_approve, name='rehearsal_approve'),
    path('rehearsals/<int:pk>/reject/', views.rehearsal_reject, name='rehearsal_reject'),
    path('rehearsals/<int:rehearsal_id>/check-in/', views.check_in, name='check_in'),
    path('messages/', views.message_list, name='message_list'),
    path('messages/<int:pk>/read/', views.message_read, name='message_read'),
    path('props/', views.prop_list, name='prop_list'),
    path('rooms/', views.room_list, name='room_list'),
    path('attendance/stats/', views.attendance_stats, name='attendance_stats'),
]
