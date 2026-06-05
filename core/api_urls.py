from django.urls import path
from . import api_views

app_name = 'api'

urlpatterns = [
    path('offline/sync/', api_views.offline_sync, name='offline_sync'),
    path('equipment/<uuid:pk>/', api_views.equipment_detail, name='equipment_detail'),
    path('equipment/search/', api_views.equipment_search, name='equipment_search'),
    path('bookings/check-conflict/', api_views.check_booking_conflict, name='check_conflict'),
    path('notifications/unread-count/', api_views.unread_notification_count, name='unread_count'),
    path('user/certifications/', api_views.user_certifications, name='user_certifications'),
]
