from django.urls import path
from . import views

app_name = 'bookings'

urlpatterns = [
    path('', views.booking_list, name='list'),
    path('calendar/', views.booking_calendar, name='calendar'),
    path('<uuid:pk>/', views.booking_detail, name='detail'),
    path('create/', views.booking_create, name='create'),
    path('<uuid:pk>/edit/', views.booking_edit, name='edit'),
    path('<uuid:pk>/cancel/', views.booking_cancel, name='cancel'),
    path('<uuid:pk>/approve/', views.booking_approve, name='approve'),
    path('<uuid:pk>/reject/', views.booking_reject, name='reject'),
    path('<uuid:pk>/check-in/', views.booking_check_in, name='check_in'),
    path('<uuid:pk>/complete/', views.booking_complete, name='complete'),
    path('my/', views.my_bookings, name='my_bookings'),
]
